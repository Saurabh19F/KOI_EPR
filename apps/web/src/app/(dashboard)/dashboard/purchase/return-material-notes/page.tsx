'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number | string | null | undefined) {
  const val = Number(amount || 0);
  return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
}

export default function ReturnMaterialNotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['return-material-notes', search, statusFilter, page],
    queryFn: () =>
      purchaseOrderApi.getReturnMaterialNotes({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }).then((res) => res.data),
  });

  const notes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Return Material Notes" description="Material returns to vendors from quality rejections">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search RMN number, vendor, product, PO..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">RMN Number</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">PO Number</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Return Qty</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Unit Price</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Loading return material notes...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-red-500">
                    Failed to load return material notes.
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <PackageOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No return material notes found
                  </td>
                </tr>
              ) : (
                notes.map((rmn: any) => (
                  <tr key={rmn.rmnId} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/purchase/return-material-notes/${rmn.rmnId}`)}>
                    <td className="px-4 py-3 font-medium text-blue-700 underline">{rmn.rmnNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(rmn.rmnDate)}</td>
                    <td className="px-4 py-3 text-slate-900">{rmn.vendorName}</td>
                    <td className="px-4 py-3 text-slate-600">{rmn.poNumber || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={rmn.productName}>
                      {rmn.productName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{Number(rmn.returnQty || 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatAmount(rmn.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatAmount(rmn.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={STATUS_COLORS[rmn.status] || 'bg-gray-100 text-gray-800'}>
                        {rmn.status?.charAt(0).toUpperCase() + rmn.status?.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
