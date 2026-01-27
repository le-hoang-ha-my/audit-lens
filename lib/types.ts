export interface Document {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  text_content: string | null;
  structured_data: StructuredData | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface StructuredData {
  vendor?: string;
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  [key: string]: unknown; // Allow flexible fields
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}