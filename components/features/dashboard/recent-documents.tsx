
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileImage, FileText, ExternalLink } from 'lucide-react';
import type { DashboardDocument } from '@/app/actions/documents';

interface RecentDocumentsProps {
  documents: DashboardDocument[];
}

// ---------------------------------------------------------------------------
// Category badge colour map — keeps the table visually scannable
// ---------------------------------------------------------------------------
const CATEGORY_COLOURS: Record<string, string> = {
  'Food & Dining':  'bg-orange-100  text-orange-800  dark:bg-orange-900/30  dark:text-orange-300',
  'Transportation': 'bg-blue-100    text-blue-800    dark:bg-blue-900/30    dark:text-blue-300',
  'Shopping':       'bg-pink-100    text-pink-800    dark:bg-pink-900/30    dark:text-pink-300',
  'Utilities':      'bg-yellow-100  text-yellow-800  dark:bg-yellow-900/30  dark:text-yellow-300',
  'Healthcare':     'bg-red-100     text-red-800     dark:bg-red-900/30     dark:text-red-300',
  'Entertainment':  'bg-purple-100  text-purple-800  dark:bg-purple-900/30  dark:text-purple-300',
  'Other':          'bg-slate-100   text-slate-800   dark:bg-slate-900/30   dark:text-slate-300',
};

function categoryClass(cat: string): string {
  return CATEGORY_COLOURS[cat] ?? CATEGORY_COLOURS['Other'];
}

// ---------------------------------------------------------------------------
// File-type icon helper
// ---------------------------------------------------------------------------
function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-4 w-4 text-muted-foreground" />;
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Documents</CardTitle>
        <a
          href="/dashboard/upload"
          className="text-sm text-primary hover:underline"
        >
          + Upload new
        </a>
      </CardHeader>

      <CardContent>
        {/* -------------------------------------------------- Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Document</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="group">
                  {/* File name + icon */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <FileIcon mimeType={doc.file_type} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.summary}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Vendor */}
                  <TableCell className="text-sm">{doc.vendor}</TableCell>

                  {/* Category badge */}
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryClass(doc.category)}`}>
                      {doc.category}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(doc.date)}
                  </TableCell>

                  {/* Total — right-aligned, green for emphasis */}
                  <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    ${doc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  {/* External link to file (appears on hover) */}
                  <TableCell>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      aria-label={`Open ${doc.file_name}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* -------------------------------------------------- Mobile cards */}
        <div className="md:hidden space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                <FileIcon mimeType={doc.file_type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{doc.file_name}</p>
                  <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    ${doc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.vendor}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryClass(doc.category)}`}>
                    {doc.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.date)}
                  </span>
                </div>
              </div>

              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-muted-foreground hover:text-primary"
                aria-label={`Open ${doc.file_name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}