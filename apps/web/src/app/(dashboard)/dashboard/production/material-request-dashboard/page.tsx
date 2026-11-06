'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-orange-600' },
  approved: { label: 'Output Approved', color: 'text-green-700' },
  in_transit: { label: 'In Transit', color: 'text-purple-600' },
  received: { label: 'Received', color: 'text-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-600' },
  rejected: { label: 'Rejected', color: 'text-red-600' },
};

function getWarehouseShort(name: string): string {
  if (!name) return '-';
  const match = name.match(/[WM]\d+|Warehouse\s*(\d+)/i);
  if (match) return match[0].startsWith('W') || match[0].startsWith('M') ? match[0] : `W${match[1]}`;
  return name.length > 8 ? name.substring(0, 8) : name;
}

function getRequestTypeLabel(type: string): string {
  if (!type) return 'Transfer';
  if (type === 'production_output' || type === 'output') return 'Production Output';
  if (type === 'material_request' || type === 'production') return 'Production Material';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRequestTypeColor(type: string): string {
  if (type === 'production_output' || type === 'output') return 'text-blue-600';
  if (type === 'material_request' || type === 'production') return 'text-purple-600';
  return 'text-gray-600';
}

const ITEMS_PER_PAGE = 10;

export default function MaterialRequestDashboardPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['material-request-transfers'],
    queryFn: () => inventoryTrackingApi.getTransfers({ limit: 500 }).then((res) => res.data),
  });

  const allTransfers: any[] = transfersData?.data || [];

  const filteredTransfers = useMemo(() => {
    let filtered = allTransfers;
    if (statusFilter !== '__all__') {
      filtered = filtered.filter((t: any) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t: any) =>
          (t.transferNumber || '').toLowerCase().includes(q) ||
          (t.finalProductName || '').toLowerCase().includes(q) ||
          (t.orderNo || '').toLowerCase().includes(q) ||
          (t.requestRemarks || '').toLowerCase().includes(q) ||
          (t.requestedByUsername || '').toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [allTransfers, statusFilter, search]);

  const stats = useMemo(() => {
    const total = allTransfers.length;
    const pending = allTransfers.filter((t: any) => t.status === 'pending').length;
    const inTransit = allTransfers.filter((t: any) => t.status === 'in_transit').length;
    const completed = allTransfers.filter(
      (t: any) => t.status === 'received' || t.status === 'approved',
    ).length;
    const requestedQty = allTransfers.reduce(
      (sum: number, t: any) => sum + (Number(t.totalQuantity) || 0),
      0,
    );
    return { total, pending, inTransit, completed, requestedQty };
  }, [allTransfers]);

  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const paginatedRows = filteredTransfers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Material Request Dashboard', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          'Request No',
          'Material',
          'Order No',
          'Requested By',
          'Qty',
          'Route',
          'Date',
          'Status',
          'Remarks',
        ],
      ],
      body: filteredTransfers.map((t: any) => [
        t.transferNumber || '-',
        t.finalProductName || '-',
        t.orderNo || '-',
        t.requestedByUsername || '-',
        Number(t.totalQuantity) || 0,
        `${getWarehouseShort(t.sourceWarehouseName)} → ${getWarehouseShort(t.destinationWarehouseName)}`,
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-',
        STATUS_STYLES[t.status]?.label || t.status,
        t.requestRemarks || '-',
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save('material-request-dashboard.pdf');
    toast.success('PDF downloaded');
  };

  const handleDownloadExcel = () => {
    const headers = [
      'Request No',
      'Type',
      'Material',
      'Order No',
      'Requested By',
      'Quantity',
      'From WH',
      'To WH',
      'Date',
      'Status',
      'Remarks',
    ];
    const rows = filteredTransfers.map((t: any) => [
      t.transferNumber || '',
      getRequestTypeLabel(t.requestType),
      t.finalProductName || '',
      t.orderNo || '',
      t.requestedByUsername || '',
      Number(t.totalQuantity) || 0,
      t.sourceWarehouseName || '',
      t.destinationWarehouseName || '',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      STATUS_STYLES[t.status]?.label || t.status,
      t.requestRemarks || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'material-request-dashboard.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Requests
          </p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pending
          </p>
          <p className="text-2xl font-bold text-orange-700">{stats.pending}</p>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            In Transit
          </p>
          <p className="text-2xl font-bold">{stats.inTransit}</p>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Completed
          </p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Requested Qty
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.requestedQty.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Header */}
      <WorkspacePageHeader title="Material Request Dashboard" description="Request no, material, quantity, date aur current status." />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search request no, material, order..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Output Approved</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Excel
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Loading material requests...
        </div>
      ) : paginatedRows.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No material requests found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[11px] font-bold uppercase">Request No</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Material</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">
                  Against (Production / Item)
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Requested Qty
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Request Date</TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">Route</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((transfer: any) => {
                const statusStyle = STATUS_STYLES[transfer.status] || {
                  label: transfer.status,
                  color: 'text-gray-600',
                };
                const qty = Number(transfer.totalQuantity) || 0;

                return (
                  <TableRow key={transfer.transferId} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="text-sm font-medium text-blue-600">
                        {transfer.transferNumber || '-'}
                      </div>
                      <div className={`text-[10px] font-medium ${getRequestTypeColor(transfer.requestType)}`}>
                        {getRequestTypeLabel(transfer.requestType)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[280px]">
                        <div className="text-sm font-medium leading-tight">
                          {transfer.finalProductName || '-'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[250px] space-y-0.5">
                        {transfer.orderNo && (
                          <div className="text-xs font-semibold text-slate-800">
                            Order: {transfer.orderNo}
                          </div>
                        )}
                        {transfer.requestedByUsername && (
                          <div className="text-[10px] text-muted-foreground">
                            By: {transfer.requestedByUsername}
                          </div>
                        )}
                        {transfer.destinationWarehouseName && (
                          <div className="text-[10px] text-muted-foreground">
                            Destination: {getWarehouseShort(transfer.destinationWarehouseName)}
                          </div>
                        )}
                        {transfer.transferDate && (
                          <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                            {new Date(transfer.transferDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center text-sm font-semibold">
                      {qty}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs whitespace-nowrap">
                        {transfer.createdAt
                          ? new Date(transfer.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="whitespace-nowrap text-xs font-semibold">
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-blue-700">
                          {getWarehouseShort(transfer.sourceWarehouseName)}
                        </span>
                        <span className="mx-1 text-muted-foreground">→</span>
                        <span className="rounded bg-green-100 px-1 py-0.5 text-green-700">
                          {getWarehouseShort(transfer.destinationWarehouseName)}
                        </span>
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className={`text-xs font-semibold ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[200px] text-[10px] text-muted-foreground leading-tight">
                        {transfer.requestRemarks || transfer.notes || '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransfers.length)} of{' '}
            {filteredTransfers.length} entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[32px]"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
