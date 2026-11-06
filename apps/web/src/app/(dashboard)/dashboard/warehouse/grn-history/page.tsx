'use client';

import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receivingPlanApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GrnHistoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filterPo, setFilterPo] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ po: '', item: '' });
  const [printGrn, setPrintGrn] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: grnsResponse, isLoading } = useQuery({
    queryKey: ['grn-history-all', page, entriesPerPage, search],
    queryFn: () => receivingPlanApi.listAllGrns({
      search: search || undefined,
      page,
      limit: 500,
    }),
  });

  const allGrns: any[] = grnsResponse?.data?.data || [];

  const poNumbers = useMemo(() => {
    const pos = new Set<string>();
    for (const grn of allGrns) {
      if (grn.poNumber) pos.add(grn.poNumber);
    }
    return Array.from(pos).sort();
  }, [allGrns]);

  const filtered = useMemo(() => {
    let result = allGrns;
    if (appliedFilters.po) {
      result = result.filter((grn: any) => grn.poNumber === appliedFilters.po);
    }
    if (appliedFilters.item) {
      const s = appliedFilters.item.toLowerCase();
      result = result.filter((grn: any) =>
        grn.productDetails?.toLowerCase().includes(s) ||
        grn.productCode?.toLowerCase().includes(s) ||
        grn.sku?.toLowerCase().includes(s)
      );
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((grn: any) =>
        grn.grnNumber?.toLowerCase().includes(s) ||
        grn.poNumber?.toLowerCase().includes(s) ||
        grn.productDetails?.toLowerCase().includes(s) ||
        grn.vendorDetails?.toLowerCase().includes(s) ||
        grn.buyerCode?.toLowerCase().includes(s) ||
        grn.invoiceNumber?.toLowerCase().includes(s) ||
        grn.receivedByUsername?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allGrns, search, appliedFilters]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / entriesPerPage);
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const resetFilters = () => {
    setFilterPo('');
    setFilterItem('');
    setAppliedFilters({ po: '', item: '' });
    setPage(1);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>GRN Slip</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 20px; color: #2563eb; }
        .grn-slip { max-width: 800px; margin: 0 auto; border: 2px solid #2563eb; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
        .section-row { display: flex; gap: 16px; margin-bottom: 16px; }
        .section { flex: 1; border: 1px solid #fcfeff; padding: 12px; }
        .section-title { font-size: 11px; font-weight: bold; color: #2563eb; letter-spacing: 1px; margin-bottom: 8px; text-decoration: underline; }
        .field { display: flex; margin-bottom: 4px; font-size: 12px; }
        .field-label { color: #2563eb; min-width: 130px; }
        .field-value { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #2563eb; color: #fcfeff; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border: 1px solid #fcfeff; }
        .qty-accepted { background: #fcfeff; text-align: center; color: #2563eb; font-weight: bold; }
        .qty-rejected { background: #fcfeff; text-align: center; color: #2563eb; font-weight: bold; }
        .signatures { display: flex; justify-content: space-between; margin-top: 24px; border-top: 1px solid #fcfeff; padding-top: 16px; }
        .sig-block { text-align: center; font-size: 11px; }
        .sig-line { border-top: 1px solid #2563eb; width: 160px; margin: 24px auto 4px; }
        .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #2563eb; }
        @media print { body { margin: 0; } .grn-slip { border: none; } }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('GRN History Log', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = ['Receipt ID', 'GRN Type', 'Date', 'PO / Order No', 'Product Details', 'Vendor Details', 'Buyer Code', 'Invoice No', 'Received By', 'Accepted Qty', 'Rejected Qty'];
    const body = filtered.map((grn: any) => [
      grn.grnNumber || '',
      grn.grnType || 'SINGLE GRN',
      grn.createdAt ? new Date(grn.createdAt).toLocaleString() : '',
      grn.poNumber || '',
      grn.productDetails || '',
      grn.vendorDetails || '',
      grn.buyerCode || '',
      grn.invoiceNumber || grn.gstInvoiceNo || '',
      grn.receivedByUsername || '',
      String(grn.totalAccepted || 0),
      String(grn.totalRejected || 0),
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save('grn-history-log.pdf');
    toast.success('PDF downloaded');
  };

  const downloadExcel = () => {
    const headers = ['Receipt ID', 'GRN Type', 'Date', 'PO / Order No', 'Product Details', 'Vendor Details', 'Buyer Code', 'Invoice No', 'Received By', 'Accepted Qty', 'Rejected Qty', 'Last Edit Status'];
    const rows = filtered.map((grn: any) => [
      grn.grnNumber || '',
      grn.grnType || 'SINGLE GRN',
      grn.createdAt ? new Date(grn.createdAt).toLocaleString() : '',
      grn.poNumber || '',
      grn.productDetails || '',
      grn.vendorDetails || '',
      grn.buyerCode || '',
      grn.invoiceNumber || grn.gstInvoiceNo || '',
      grn.receivedByUsername || '',
      String(grn.totalAccepted || 0),
      String(grn.totalRejected || 0),
      grn.updatedAt ? new Date(grn.updatedAt).toLocaleString() : '',
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grn-history-log.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel (CSV) downloaded');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Completed Goods Received Logs</p>
          <h1 className="text-xl font-bold text-slate-900">GRN History Log &amp; Reprint Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Download Excel
          </Button>
          <span className="text-sm font-bold text-indigo-600 ml-2">AUDIT ARCHIVE</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap border rounded-lg p-4 bg-white">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-500 uppercase">PO Filter (Multi-Select)</Label>
          <Select value={filterPo || '__all__'} onValueChange={(v) => { const val = v === '__all__' ? '' : v; setFilterPo(val); setAppliedFilters(f => ({ ...f, po: val })); setPage(1); }}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="All PO IDs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All PO IDs</SelectItem>
              {poNumbers.map((po) => (
                <SelectItem key={po} value={po}>{po}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Item Name / Code Filter</Label>
          <Input
            placeholder="Search item name or code"
            value={filterItem}
            onChange={(e) => { setFilterItem(e.target.value); setAppliedFilters(f => ({ ...f, item: e.target.value })); setPage(1); }}
          />
        </div>
        <Button variant="outline" className="px-8 font-semibold" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search ledger..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-sm pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Receipt ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">GRN Type</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Date</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">PO / Order No</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product Details</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Vendor Details</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Buyer Code</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Invoice No</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Received By</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Accepted Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Rejected Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Last Edit Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Reprint</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-slate-400">
                  Loading GRN history...
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-slate-400">
                  No GRN records found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((grn: any) => (
                <TableRow key={grn.grnId} className="border-b">
                  <TableCell className="text-sm font-medium text-blue-600 whitespace-nowrap">
                    {grn.grnNumber || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                    {grn.grnType || 'SINGLE GRN'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {grn.createdAt ? new Date(grn.createdAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{grn.poNumber || '—'}</div>
                    {grn.orderNo && <div className="text-xs text-slate-400 italic">{grn.orderNo}</div>}
                  </TableCell>
                  <TableCell className="text-sm max-w-[300px]">
                    <div className="font-medium">{grn.productDetails || '—'}</div>
                    {grn.sku && <div className="font-mono text-xs text-slate-400 truncate">{grn.sku} · {grn.uomName || ''}</div>}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{grn.vendorDetails || '—'}</TableCell>
                  <TableCell className="text-sm">{grn.buyerCode || '—'}</TableCell>
                  <TableCell className="text-sm">{grn.invoiceNumber || grn.gstInvoiceNo || '—'}</TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{grn.receivedByUsername || '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-green-600">{grn.totalAccepted || 0}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-600">{grn.totalRejected || 0}</span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {grn.updatedAt && grn.updatedAt !== grn.createdAt
                      ? new Date(grn.updatedAt).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                      onClick={() => setPrintGrn(grn)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Reprint
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {total === 0 ? 0 : (page - 1) * entriesPerPage + 1} to {Math.min(page * entriesPerPage, total)} of {total} entries
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
              &laquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              &lsaquo;
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="min-w-[36px]">
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} className="min-w-[36px]">
                  {totalPages}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              &rsaquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              &raquo;
            </Button>
          </div>
        )}
      </div>

      {/* GRN Slip Print Preview Dialog */}
      <Dialog open={!!printGrn} onOpenChange={() => setPrintGrn(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">GRN Slip Print Preview</DialogTitle>
                <p className="text-sm text-slate-500">Review document layout before printing or saving.</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
          </DialogHeader>

          {printGrn && (
            <div ref={printRef}>
              <div style={{ border: '2px solid #2563eb', padding: '24px', fontFamily: "'Courier New', monospace", maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2563eb', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#2563eb', letterSpacing: '1px' }}>WAREHOUSE MANAGEMENT OPERATIONS</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>GOODS RECEIPT NOTE (ACCEPTED)</h2>
                    <div style={{ fontSize: '12px', textDecoration: 'underline' }}>
                      Ref ID: {printGrn.grnNumber} | Date: {printGrn.createdAt ? new Date(printGrn.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>KOI</div>
                    <div style={{ fontSize: '10px', color: '#2563eb' }}>SYS.AUTH.VERIFIED</div>
                  </div>
                </div>

                {/* Sourcing & Logistics */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, border: '1px solid #fcfeff', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>SOURCING PARTICULARS</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Sales Order No:</span> <strong style={{ color: '#2563eb' }}>{printGrn.poNumber || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Buyer Code:</span> <strong>{printGrn.buyerCode || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Vendor Name:</span> <strong>{printGrn.vendorDetails || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>PO Number:</span> <strong style={{ color: '#2563eb' }}>{printGrn.poNumber || '—'}</strong></div>
                    </div>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #fcfeff', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>LOGISTICS &amp; PLANNING</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Warehouse ID:</span> <strong>{printGrn.storageLocation || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Plan ID:</span> <strong>{printGrn.planId || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Date Received:</span> <strong>{printGrn.createdAt ? new Date(printGrn.createdAt).toLocaleString() : '—'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Transit */}
                <div style={{ border: '1px solid #fcfeff', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>TRANSIT PARAMETERS</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Invoice No:</span> <strong>{printGrn.invoiceNumber || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Truck Vehicle No:</span> <strong>{printGrn.vehicleNumber || '—'}</strong></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>GST Invoice No:</span> <strong>{printGrn.gstInvoiceNo || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Driver Name:</span> <strong>{printGrn.driverName || '—'}</strong></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Bilty (LR) No:</span> <strong>{printGrn.lrNumber || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#2563eb', minWidth: '130px' }}>Driver Phone:</span> <strong>{printGrn.driverNo || '—'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Product Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT ID</th>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT DESCRIPTION</th>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'center', fontSize: '11px' }}>TOTAL PLANNED</th>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'center', fontSize: '11px' }}>ACCEPTED</th>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'center', fontSize: '11px' }}>REJECTED</th>
                      <th style={{ background: '#2563eb', color: '#fcfeff', padding: '8px', textAlign: 'left', fontSize: '11px' }}>UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printGrn.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff', fontSize: '11px' }}>{item.sku || item.productId || '—'}</td>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff' }}>{item.productName || '—'}</td>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff', background: '#fcfeff', textAlign: 'center' }}>{Number(item.orderedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff', background: '#fcfeff', textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>{Number(item.acceptedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff', background: '#fcfeff', textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>{Number(item.rejectedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #fcfeff' }}>{item.uomName || '—'}</td>
                      </tr>
                    ))}
                    {(!printGrn.items || printGrn.items.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ padding: '8px', border: '1px solid #fcfeff', textAlign: 'center', color: '#2563eb' }}>No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Remarks */}
                <div style={{ border: '1px solid #fcfeff', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textDecoration: 'underline', color: '#2563eb' }}>Operational Remarks:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{printGrn.notes || 'OK'}</div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fcfeff', paddingTop: '16px' }}>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #2563eb', width: '160px', margin: '24px auto 4px' }}></div>
                    <div style={{ textDecoration: 'underline' }}>System Authorized &amp; Checked By:</div>
                    <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{printGrn.receivedByUsername || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #2563eb', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Auditor Signature</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #2563eb', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Receiver / Driver</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#2563eb' }}>
                  SYS-GEN-{printGrn.grnNumber}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
