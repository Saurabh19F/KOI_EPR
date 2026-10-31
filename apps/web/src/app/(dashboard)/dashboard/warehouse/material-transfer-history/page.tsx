'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending Warehouse Approval', className: 'text-orange-600 font-semibold' },
  approved: { label: 'Output Approved', className: 'text-green-600 font-semibold' },
  in_transit: { label: 'Shipped', className: 'text-purple-600 font-semibold' },
  received: { label: 'Received', className: 'text-green-600 font-semibold' },
  cancelled: { label: 'Cancelled', className: 'text-red-600 font-semibold' },
  rejected: { label: 'Rejected', className: 'text-red-600 font-semibold' },
};

export default function MaterialTransferHistoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [pdfTransfer, setPdfTransfer] = useState<any>(null);
  const [pdfItems, setPdfItems] = useState<any[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: transfersResponse, isLoading } = useQuery({
    queryKey: ['material-transfer-history', search],
    queryFn: () => inventoryTrackingApi.getTransfers({
      search: search || undefined,
      page: 1,
      limit: 500,
    }),
  });

  const allTransfers: any[] = transfersResponse?.data?.data || [];

  const filtered = useMemo(() => {
    if (!search) return allTransfers;
    const s = search.toLowerCase();
    return allTransfers.filter((t: any) =>
      t.transferNumber?.toLowerCase().includes(s) ||
      t.orderNo?.toLowerCase().includes(s) ||
      t.referenceNumber?.toLowerCase().includes(s) ||
      t.sourceWarehouseName?.toLowerCase().includes(s) ||
      t.destinationWarehouseName?.toLowerCase().includes(s) ||
      t.finalProductName?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  }, [allTransfers, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / entriesPerPage);
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const openPdfSlip = async (transfer: any) => {
    setLoadingPdf(true);
    setPdfTransfer(transfer);
    try {
      const res = await inventoryTrackingApi.getTransfer(transfer.transferId);
      const full = res?.data;
      setPdfItems(full?.items || []);
    } catch {
      setPdfItems([]);
    }
    setLoadingPdf(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Transfer Slip</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 20px; color: #1a1a2e; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #1e293b; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border: 1px solid #e2e8f0; }
        .section { border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 16px; }
        .section-title { font-size: 11px; font-weight: bold; color: #1e40af; letter-spacing: 1px; margin-bottom: 8px; text-decoration: underline; }
        .field { display: flex; margin-bottom: 4px; font-size: 12px; }
        .field-label { color: #64748b; min-width: 140px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 16px; }
        .sig-block { text-align: center; font-size: 11px; }
        .sig-line { border-top: 1px solid #1a1a2e; width: 160px; margin: 24px auto 4px; }
        @media print { body { margin: 0; } }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Material Transfer History Log', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = ['Req ID', 'Order No', 'Product', 'UOM', 'From WH', 'To WH', 'Req Qty', 'Disp Qty', 'Recd Qty', 'Status'];
    const body = filtered.map((t: any) => [
      t.transferNumber || '',
      t.orderNo || t.referenceNumber || '',
      t.finalProductName || '—',
      '',
      t.sourceWarehouseName || '',
      t.destinationWarehouseName || '',
      String(Math.round(Number(t.totalQuantity || 0))),
      '',
      '',
      STATUS_STYLES[t.status]?.label || t.status || '',
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save('material-transfer-history.pdf');
    toast.success('PDF downloaded');
  };

  const downloadExcel = () => {
    const headers = ['Req ID', 'Order No', 'Product ID', 'UOM', 'From WH', 'To WH', 'Req Qty', 'Disp Qty', 'Recd Qty', 'Status', 'Last Edit Status'];
    const rows = filtered.map((t: any) => [
      t.transferNumber || '',
      t.orderNo || t.referenceNumber || '',
      t.finalProductName || '',
      '',
      t.sourceWarehouseName || '',
      t.destinationWarehouseName || '',
      String(Math.round(Number(t.totalQuantity || 0))),
      '',
      '',
      STATUS_STYLES[t.status]?.label || t.status || '',
      t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '',
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'material-transfer-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel (CSV) downloaded');
  };

  const getWarehouseShort = (name: string) => {
    if (!name) return '—';
    const match = name.match(/\b(W\d+|M\d+|WH\d+)/i);
    return match ? match[1].toUpperCase() : name;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Internal Logistics Audit</p>
          <h1 className="text-xl font-bold text-slate-900">Material Transfer History Log</h1>
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
          <span className="text-sm font-bold text-indigo-600 ml-2">STOCK MOVEMENTS</span>
        </div>
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
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Req ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Order No</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">UOM</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">From WH</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">To WH</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Req Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Disp Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Recd Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Last Edit Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">PDF Slip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-slate-400">
                  Loading transfer history...
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-slate-400">
                  No transfer records found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((transfer: any) => {
                const st = STATUS_STYLES[transfer.status] || { label: transfer.status || '—', className: 'text-slate-500' };
                return (
                  <TableRow key={transfer.transferId} className="border-b">
                    <TableCell className="text-sm font-medium text-blue-600 whitespace-nowrap">
                      {transfer.transferNumber || '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {transfer.orderNo || transfer.referenceNumber || '—'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[350px]">
                      <div className="font-mono text-xs truncate">{transfer.finalProductId || transfer.referenceNumber || '—'}</div>
                      <div className="text-xs text-slate-400 truncate">{transfer.finalProductName || ''}</div>
                    </TableCell>
                    <TableCell className="text-sm">{transfer.uom || '—'}</TableCell>
                    <TableCell className="text-sm">
                      <span className="font-semibold text-green-600">{getWarehouseShort(transfer.sourceWarehouseName)}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-semibold text-green-600">{getWarehouseShort(transfer.destinationWarehouseName)}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Math.round(Number(transfer.totalQuantity || 0))}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="text-green-600 font-semibold">
                        {transfer.dispatchedQty != null ? Math.round(Number(transfer.dispatchedQty)) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {transfer.receivedQty != null ? Math.round(Number(transfer.receivedQty)) : '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className={st.className}>{st.label}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400 whitespace-nowrap">
                      {transfer.updatedAt && transfer.updatedAt !== transfer.createdAt
                        ? new Date(transfer.updatedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                        onClick={() => openPdfSlip(transfer)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        PDF Slip
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* PDF Slip Dialog */}
      <Dialog open={!!pdfTransfer} onOpenChange={() => { setPdfTransfer(null); setPdfItems([]); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Transfer Slip Print Preview</DialogTitle>
                <p className="text-sm text-slate-500">Review document layout before printing or saving.</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePrint}>
                <FileText className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
          </DialogHeader>

          {pdfTransfer && (
            <div ref={printRef}>
              <div style={{ border: '2px solid #1a1a2e', padding: '24px', fontFamily: "'Courier New', monospace", maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a2e', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '1px' }}>INTERNAL LOGISTICS OPERATIONS</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>MATERIAL TRANSFER SLIP</h2>
                    <div style={{ fontSize: '12px', textDecoration: 'underline' }}>
                      Ref: {pdfTransfer.transferNumber} | Date: {pdfTransfer.transferDate ? new Date(pdfTransfer.transferDate).toLocaleString() : pdfTransfer.createdAt ? new Date(pdfTransfer.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>KOI</div>
                    <div style={{ fontSize: '10px', color: '#16a34a' }}>SYS.AUTH.VERIFIED</div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>TRANSFER DETAILS</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Transfer No:</span> <strong style={{ color: '#2563eb' }}>{pdfTransfer.transferNumber || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Order No:</span> <strong>{pdfTransfer.orderNo || pdfTransfer.referenceNumber || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Status:</span> <strong>{STATUS_STYLES[pdfTransfer.status]?.label || pdfTransfer.status || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Request Type:</span> <strong>{pdfTransfer.requestType || '—'}</strong></div>
                    </div>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>WAREHOUSE ROUTING</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Source Warehouse:</span> <strong>{pdfTransfer.sourceWarehouseName || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Dest Warehouse:</span> <strong>{pdfTransfer.destinationWarehouseName || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Requested By:</span> <strong>{pdfTransfer.requestedByUsername || '—'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '140px' }}>Date:</span> <strong>{pdfTransfer.createdAt ? new Date(pdfTransfer.createdAt).toLocaleString() : '—'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {loadingPdf ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Loading items...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT ID</th>
                        <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT NAME</th>
                        <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>REQ QTY</th>
                        <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>DISPATCHED</th>
                        <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>RECEIVED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdfItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>{item.productId || '—'}</td>
                          <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.productName || '—'}</td>
                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#dbeafe', textAlign: 'center' }}>{Math.round(Number(item.requestedQty || item.quantity || 0))}</td>
                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#dcfce7', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{Math.round(Number(item.dispatchedQty || 0))}</td>
                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#fef9c3', textAlign: 'center', fontWeight: 'bold' }}>{Math.round(Number(item.receivedQty || 0))}</td>
                        </tr>
                      ))}
                      {pdfItems.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>No items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* Remarks */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textDecoration: 'underline', color: '#64748b' }}>Operational Remarks:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{pdfTransfer.requestRemarks || pdfTransfer.notes || 'N/A'}</div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div style={{ textDecoration: 'underline' }}>Requested By:</div>
                    <div style={{ fontWeight: 'bold', color: '#1e40af' }}>{pdfTransfer.requestedByUsername || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Sent By</div>
                    <div style={{ fontWeight: 'bold' }}>{pdfTransfer.sentBy || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Received By</div>
                    <div style={{ fontWeight: 'bold' }}>{pdfTransfer.receivedBy || '—'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#94a3b8' }}>
                  SYS-GEN-{pdfTransfer.transferNumber}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
