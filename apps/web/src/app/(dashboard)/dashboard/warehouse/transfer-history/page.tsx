'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryTrackingApi, inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeftRight,
  Search,
  Download,
  Package,
  FileDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Warehouse Approval', variant: 'outline' },
  approved: { label: 'Output Approved', variant: 'default' },
  in_transit: { label: 'Shipped', variant: 'secondary' },
  received: { label: 'Received', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function TransferHistoryPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pdfTransfer, setPdfTransfer] = useState<any>(null);
  const [pdfItems, setPdfItems] = useState<any[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const limit = 50;

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: transfersResponse, isLoading } = useQuery({
    queryKey: ['transfer-history', search, selectedWarehouse],
    queryFn: () => inventoryTrackingApi.getTransfers({
      search: search || undefined,
      sourceWarehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      page: 1,
      limit: 500,
    }),
  });

  const warehouseList = warehouses?.data || [];
  const allTransfers: any[] = transfersResponse?.data?.data || [];

  const filtered = useMemo(() => {
    if (selectedWarehouse === 'all') return allTransfers;
    return allTransfers.filter((t: any) =>
      t.sourceWarehouseId === selectedWarehouse || t.destinationWarehouseId === selectedWarehouse
    );
  }, [allTransfers, selectedWarehouse]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const exportCsv = () => {
    const headers = ['Date', 'Reference', 'Product', 'From', 'To', 'Quantity', 'Status'];
    const rows = filtered.map((t: any) => [
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      t.transferNumber || '',
      t.finalProductName || '',
      t.sourceWarehouseName || '',
      t.destinationWarehouseName || '',
      String(Math.round(Number(t.totalQuantity || 0))),
      STATUS_STYLES[t.status]?.label || t.status || '',
    ]);
    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transfer-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Transfer History Log', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = ['Date', 'Reference', 'Product', 'From WH', 'To WH', 'Qty', 'Status'];
    const body = filtered.map((t: any) => [
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      t.transferNumber || '',
      t.finalProductName || '',
      t.sourceWarehouseName || '',
      t.destinationWarehouseName || '',
      String(Math.round(Number(t.totalQuantity || 0))),
      STATUS_STYLES[t.status]?.label || t.status || '',
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save('transfer-history.pdf');
    toast.success('PDF downloaded');
  };

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
        @media print { body { margin: 0; } }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transfer History Log</h1>
          <p className="text-muted-foreground">Track inter-warehouse stock transfers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadPdf}>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product or reference..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={(v) => { setSelectedWarehouse(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouseList.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">PDF Slip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Loading transfer history...
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No transfer records found
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((item: any) => {
                  const st = STATUS_STYLES[item.status] || { label: item.status || 'Unknown', variant: 'outline' as const };
                  return (
                    <TableRow key={item.transferId}>
                      <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="font-medium">{item.transferNumber || item.orderNo || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          Transfer
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {item.finalProductName || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{item.sourceWarehouseName || '-'}</TableCell>
                      <TableCell>{item.destinationWarehouseName || '-'}</TableCell>
                      <TableCell className="text-right">{Math.round(Number(item.totalQuantity || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openPdfSlip(item)}>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Slip Dialog */}
      <Dialog open={!!pdfTransfer} onOpenChange={() => { setPdfTransfer(null); setPdfItems([]); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Transfer Slip Print Preview</DialogTitle>
                <p className="text-sm text-muted-foreground">Review document layout before printing or saving.</p>
              </div>
              <Button variant="outline" onClick={handlePrint}>
                <FileText className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
          </DialogHeader>

          {pdfTransfer && (
            <div ref={printRef}>
              <div style={{ border: '2px solid #1a1a2e', padding: '24px', fontFamily: "'Courier New', monospace", maxWidth: '800px', margin: '0 auto' }}>
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

                <div style={{ border: '1px solid #cbd5e1', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textDecoration: 'underline', color: '#64748b' }}>Operational Remarks:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{pdfTransfer.requestRemarks || pdfTransfer.notes || 'N/A'}</div>
                </div>

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
