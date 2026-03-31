import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Tag } from 'lucide-react';
import type { CategoryBreakdown } from '@/app/actions/documents';

interface DashboardStatsProps {
  totalSpend: number;
  totalDocuments: number;
  categoryBreakdown: CategoryBreakdown[];
}

export function DashboardStats({
  totalSpend,
  totalDocuments,
  categoryBreakdown,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Spend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spend
          </CardTitle>
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {totalDocuments} document{totalDocuments !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Total Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Documents
          </CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalDocuments}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Showing last 10 uploads
          </p>
        </CardContent>
      </Card>

      {/* Top Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Category
          </CardTitle>
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Tag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length > 0 ? (
            <>
              <p className="text-3xl font-bold truncate">{categoryBreakdown[0].category}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {categoryBreakdown[0].count} doc{categoryBreakdown[0].count !== 1 ? 's' : ''} · $
                {categoryBreakdown[0].total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground mt-1">No categories yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}