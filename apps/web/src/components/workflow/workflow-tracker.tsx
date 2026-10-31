'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receivingPlanApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface StageData {
  status: 'complete' | 'pending';
  qty: number;
  date?: string | null;
  label: string;
}

interface WorkflowRow {
  planId: string;
  planNumber: string;
  productId: string;
  productName: string;
  poNumber: string;
  plan: StageData;
  poStatus: StageData;
  grn: StageData;
  production: StageData;
}

function StatusBadge({ status }: { status: 'complete' | 'pending' }) {
  if (status === 'complete') {
    return (
      <Badge className="bg-teal-50 text-teal-700 border-teal-300 font-semibold italic text-sm px-3 py-1">
        Complete
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-600 border-red-300 font-semibold text-sm px-3 py-1">
      Pending
    </Badge>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}  ${d.toLocaleTimeString('en-GB')}`;
}

function StageCell({ stage, showDateTime }: { stage: StageData; showDateTime?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3">
      <StatusBadge status={stage.status} />
      {stage.date && (
        <p className="text-xs text-gray-500 font-mono">
          {showDateTime ? formatDateTime(stage.date) : formatDate(stage.date)}
        </p>
      )}
      <p className="text-xs text-gray-500">{stage.label}</p>
    </div>
  );
}

export function WorkflowTracker() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workflow-tracker', search, page],
    queryFn: () =>
      receivingPlanApi
        .getWorkflowTracker({ search: search || undefined, page, limit: 20 })
        .then((res) => res.data),
  });

  const rows: WorkflowRow[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Workflow Tracker</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search product, PO..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-8 w-[200px] text-xs"
              />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No workflow data available</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">Plan / Indent</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">PO Status</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">GRN / Stock In</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">Production</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.planId} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{row.productName}</p>
                        <p className="text-xs text-gray-400">{row.poNumber}</p>
                      </td>
                      <td className="px-3 text-center">
                        <StageCell stage={row.plan} />
                      </td>
                      <td className="px-3 text-center">
                        <StageCell stage={row.poStatus} />
                      </td>
                      <td className="px-3 text-center">
                        <StageCell stage={row.grn} showDateTime />
                      </td>
                      <td className="px-3 text-center">
                        <StageCell stage={row.production} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} items)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
