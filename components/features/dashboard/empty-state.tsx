import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-6">
        {/* Illustration */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          {/* Sparkle accent */}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">No documents yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload your first receipt, invoice, or contract. Our AI will
            automatically extract the vendor, amounts, dates, and more — then
            you can chat with your data.
          </p>
        </div>

        {/* CTA */}
        <Button asChild size="lg">
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload your first document
          </Link>
        </Button>

        {/* Supported formats hint */}
        <p className="text-xs text-muted-foreground">
          Supports JPEG, PNG, WebP, and PDF · Max 10 MB
        </p>
      </CardContent>
    </Card>
  );
}