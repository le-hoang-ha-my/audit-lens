'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DocumentRow = Database['public']['Tables']['documents']['Row'];

/**
 * The shape we actually use on the dashboard.
 * Keeps components decoupled from the raw DB row.
 */
export interface DashboardDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  vendor: string;
  total: number;
  date: string;
  category: string;
  summary: string;
  created_at: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  total: number;
}

interface DocumentsSummaryData {
  documents: DashboardDocument[];
  totalSpend: number;
  categoryBreakdown: CategoryBreakdown[];
}

interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely pull a typed value out of the JSONB `structured_data` column.
 * Gemini *should* return the right shape, but we never trust unvalidated
 * external data at the boundary.
 */
function safeString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function safeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalise a raw DB row → the DTO the UI actually needs.
 */
function toDocumentDTO(row: DocumentRow): DashboardDocument {
  const sd = (row.structured_data ?? {}) as Record<string, unknown>;

  return {
    id: row.id,
    file_name: row.file_name,
    file_url: row.file_url,
    file_type: row.file_type,
    vendor: safeString(sd.vendor, 'Unknown'),
    total: safeNumber(sd.total),
    date: safeString(sd.date, row.created_at.split('T')[0]),
    category: safeString(sd.category, 'Other'),
    summary: safeString(sd.summary, 'No summary available'),
    created_at: row.created_at,
  };
}

/**
 * Roll up documents into per-category totals.
 */
function buildCategoryBreakdown(docs: DashboardDocument[]): CategoryBreakdown[] {
  const map = new Map<string, { count: number; total: number }>();

  for (const doc of docs) {
    const existing = map.get(doc.category) ?? { count: 0, total: 0 };
    map.set(doc.category, {
      count: existing.count + 1,
      total: existing.total + doc.total,
    });
  }

  return Array.from(map.entries())
    .map(([category, vals]) => ({ category, ...vals }))
    .sort((a, b) => b.total - a.total); // highest spend first
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------
export async function getDocumentsSummary(
  userId: string
): Promise<ServerActionResponse<DocumentsSummaryData>> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: rows, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    const documents = (rows ?? []).map(toDocumentDTO);
    const totalSpend = documents.reduce((sum, d) => sum + d.total, 0);
    const categoryBreakdown = buildCategoryBreakdown(documents);

    return {
      success: true,
      data: { documents, totalSpend, categoryBreakdown },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch documents',
    };
  }
}