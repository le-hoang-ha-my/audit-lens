import { UploadZone } from '@/components/features/upload/upload-zone';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload Document</h1>
          <p className="text-muted-foreground mt-1">
            Upload receipts, invoices, or contracts for AI-powered data extraction
          </p>
        </div>
      </div>

      <UploadZone />

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">How it works</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              1
            </span>
            <span>
              <strong className="text-foreground">Upload your document</strong> - 
              We accept images (JPEG, PNG, WebP) and PDF files
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              2
            </span>
            <span>
              <strong className="text-foreground">AI extracts data</strong> - 
              Our vision AI automatically identifies vendor, amount, date, and items
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              3
            </span>
            <span>
              <strong className="text-foreground">Search and chat</strong> - 
              Query your documents using natural language and get instant insights
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}