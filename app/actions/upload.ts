'use server';

import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

interface ExtractedData {
  vendor: string;
  total: number;
  date: string;
  category: string;
  summary: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
}

interface UploadResponse {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    fileName: string;
  };
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function uploadFile(formData: FormData): Promise<UploadResponse> {
  try {
    // 1. Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Extract file from FormData
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF.',
      };
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    const supabase = await getSupabaseServerClient();

    // 3. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('docs')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('docs')
      .getPublicUrl(uploadData.path);

    // 4. Process with Gemini Vision AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let extractedData: ExtractedData;
    let textContent: string;

    try {
      // Convert file to base64 for Gemini
      const base64Data = buffer.toString('base64');
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };

      const prompt = `Analyze this document (receipt, invoice, or contract) and extract the following information.
Return ONLY valid JSON with no markdown formatting, no code blocks, no additional text.

Required fields:
- vendor: The business/vendor name (string)
- total: The total amount as a number (extract numeric value only, e.g., 45.99)
- date: The transaction date in ISO format YYYY-MM-DD (string)
- category: Categorize as one of: "Food & Dining", "Transportation", "Shopping", "Utilities", "Healthcare", "Entertainment", "Other" (string)
- summary: A brief 1-sentence summary of this transaction (string)
- items: An array of line items if visible, each with {name: string, quantity?: number, price?: number}

Also provide:
- textContent: Full text transcription of all visible text in the document (string)

Example response format:
{
  "vendor": "Starbucks",
  "total": 12.50,
  "date": "2024-01-15",
  "category": "Food & Dining",
  "summary": "Coffee and pastry purchase at Starbucks",
  "items": [{"name": "Latte", "quantity": 1, "price": 5.50}, {"name": "Croissant", "quantity": 1, "price": 7.00}],
  "textContent": "STARBUCKS\\nReceipt #12345\\n..."
}

If you cannot find a field, use these defaults:
- vendor: "Unknown"
- total: 0
- date: current date
- category: "Other"
- summary: "Document uploaded"
- items: []

Return ONLY the JSON object, nothing else.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();

      // Clean up response - remove markdown code blocks if present
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '');
      cleanedText = cleanedText.replace(/```\n?/g, '');
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);
      
      // Extract textContent separately
      textContent = parsed.textContent || '';
      
      // Remove textContent from structured data
      const { textContent: _, ...structuredData } = parsed;
      extractedData = structuredData as ExtractedData;

      // Validate extracted data
      if (!extractedData.vendor || !extractedData.summary) {
        throw new Error('Invalid extraction format');
      }

    } catch (aiError) {
      console.error('AI extraction error:', aiError);
      // Fallback to default values
      extractedData = {
        vendor: 'Unknown',
        total: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        summary: 'Document uploaded - AI extraction failed',
      };
      textContent = 'Text extraction failed';
    }

    // 5. Generate embedding for semantic search
    let embedding: number[] | null = null;
    
    try {
      const embeddingModel = genAI.getGenerativeModel({ 
        model: 'text-embedding-004' 
      });
      
      // Create search text from extracted data
      const searchText = `${extractedData.vendor} ${extractedData.category} ${extractedData.summary} ${textContent}`;
      
      const embeddingResult = await embeddingModel.embedContent(searchText);
      embedding = embeddingResult.embedding.values;
      
    } catch (embeddingError) {
      console.error('Embedding error:', embeddingError);
      // Continue without embedding - it's optional
    }

    // 6. Insert into database
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        text_content: textContent,
        structured_data: extractedData,
        embedding: embedding,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('docs').remove([uploadData.path]);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    // 7. Revalidate dashboard
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: dbData.id,
        fileName: file.name,
      },
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}