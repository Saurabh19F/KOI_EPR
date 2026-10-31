'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receivingPlanApi, inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  Printer,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceivingHistoryPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [printGrn, setPrintGrn] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: grnsResponse, isLoading } = useQuery({
    queryKey: ['grn-history', selectedWarehouse, search, page],
    queryFn: () => receivingPlanApi.listAllGrns({
      warehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      search: search || undefined,
      page,
      limit: 20,
    }),
  });

  const warehouseList = warehouses?.data || [];
  const grns = grnsResponse?.data?.data || [];
  const totalPages = grnsResponse?.data?.totalPages || 1;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>GRN Slip</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 20px; color: #1a1a2e; }
        .grn-slip { max-width: 800px; margin: 0 auto; border: 2px solid #1a1a2e; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; }
        .header-left small { color: #6366f1; font-size: 11px; letter-spacing: 1px; }
        .header-left h2 { margin: 4px 0; font-size: 20px; }
        .header-left .ref { font-size: 12px; text-decoration: underline; }
        .header-right { text-align: right; }
        .header-right .brand { font-size: 28px; font-weight: bold; }
        .header-right .auth { font-size: 10px; color: #16a34a; }
        .section-row { display: flex; gap: 16px; margin-bottom: 16px; }
        .section { flex: 1; border: 1px solid #cbd5e1; padding: 12px; }
        .section-title { font-size: 11px; font-weight: bold; color: #1e40af; letter-spacing: 1px; margin-bottom: 8px; text-decoration: underline; }
        .field { display: flex; margin-bottom: 4px; font-size: 12px; }
        .field-label { color: #64748b; min-width: 130px; }
        .field-value { font-weight: bold; }
        .field-value.blue { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #1e293b; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border: 1px solid #e2e8f0; }
        .qty-planned { background: #dbeafe; text-align: center; }
        .qty-accepted { background: #dcfce7; text-align: center; color: #16a34a; font-weight: bold; }
        .qty-rejected { background: #fee2e2; text-align: center; color: #dc2626; font-weight: bold; }
        .remarks { border: 1px solid #cbd5e1; padding: 12px; margin: 16px 0; }
        .remarks-title { font-size: 11px; text-decoration: underline; color: #64748b; }
        .signatures { display: flex; justify-content: space-between; margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 16px; }
        .sig-block { text-align: center; font-size: 11px; }
        .sig-line { border-top: 1px solid #1a1a2e; width: 160px; margin: 24px auto 4px; }
        .sig-name { font-weight: bold; color: #1e40af; }
        .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #94a3b8; }
        @media print { body { margin: 0; } .grn-slip { border: none; } }
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
          <h1 className="text-2xl font-bold">Receiving History Log</h1>
          <p className="text-muted-foreground">Track all incoming goods received at warehouses</p>
        </div>
        <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ledger..."
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>GRN Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>PO / Order No</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead>Vendor Details</TableHead>
                  <TableHead>Buyer Code</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="text-right">Accepted Qty</TableHead>
                  <TableHead className="text-right">Rejected Qty</TableHead>
                  <TableHead>Last Edit Status</TableHead>
                  <TableHead>Reprint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(grns) ? grns : []).map((grn: any) => (
                  <TableRow key={grn.grnId}>
                    <TableCell className="font-medium text-blue-600">{grn.grnNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          grn.grnType === 'MULTI GRN' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                          grn.grnType === 'BULK GRN' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''
                        }
                      >
                        {grn.grnType || 'SINGLE GRN'}
                      </Badge>
                    </TableCell>
                    <TableCell>{grn.createdAt ? new Date(grn.createdAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">{grn.poNumber || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px] truncate text-sm">{grn.productDetails || '-'}</div>
                    </TableCell>
                    <TableCell>{grn.vendorDetails || '-'}</TableCell>
                    <TableCell>{grn.buyerCode || '-'}</TableCell>
                    <TableCell>{grn.invoiceNumber || grn.gstInvoiceNo || '-'}</TableCell>
                    <TableCell>{grn.receivedByUsername || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {grn.totalAccepted || 0}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {grn.totalRejected || 0}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {grn.updatedAt ? new Date(grn.updatedAt).toLocaleString() : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setPrintGrn(grn)}
                      >
                        Reprint
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!Array.isArray(grns) || grns.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading receiving history...' : 'No receiving records found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRN Slip Print Preview Dialog */}
      <Dialog open={!!printGrn} onOpenChange={() => setPrintGrn(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">GRN Slip Print Preview</DialogTitle>
                <p className="text-sm text-muted-foreground">Review document layout parameters before printing or saving.</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
          </DialogHeader>

          {printGrn && (
            <div ref={printRef}>
              <div className="grn-slip" style={{ border: '2px solid #1a1a2e', padding: '24px', fontFamily: "'Courier New', monospace", maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a2e', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '1px' }}>WAREHOUSE MANAGEMENT OPERATIONS</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>GOODS RECEIPT NOTE (ACCEPTED)</h2>
                    <div style={{ fontSize: '12px', textDecoration: 'underline' }}>
                      Ref ID: {printGrn.grnNumber} | Date: {printGrn.createdAt ? new Date(printGrn.createdAt).toLocaleString() : '-'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>KOI</div>
                    <div style={{ fontSize: '10px', color: '#16a34a' }}>SYS.AUTH.VERIFIED</div>
                  </div>
                </div>

                {/* Sourcing & Logistics */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>SOURCING PARTICULARS</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Sales Order No:</span> <strong style={{ color: '#2563eb' }}>{printGrn.poNumber || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Buyer Code:</span> <strong>{printGrn.buyerCode || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Vendor Name:</span> <strong>{printGrn.vendorDetails || printGrn.vendorName || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Vendor Code:</span> <strong>{printGrn.buyerCode || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>PO Number:</span> <strong style={{ color: '#2563eb' }}>{printGrn.poNumber || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Purchaser Name:</span> <strong>{printGrn.purchaserName || '-'}</strong></div>
                    </div>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>LOGISTICS &amp; PLANNING</div>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Warehouse ID:</span> <strong>{printGrn.storageLocation || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Plan ID:</span> <strong>{printGrn.planId || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Planner Name:</span> <strong>{printGrn.plannerName || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Date Received:</span> <strong>{printGrn.createdAt ? new Date(printGrn.createdAt).toLocaleString() : '-'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Transit Parameters */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '1px', marginBottom: '8px', textDecoration: 'underline' }}>TRANSIT PARAMETERS</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Invoice No:</span> <strong>{printGrn.invoiceNumber || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Truck Vehicle No:</span> <strong>{printGrn.vehicleNumber || '-'}</strong></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>GST Invoice No:</span> <strong>{printGrn.gstInvoiceNo || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Driver Name:</span> <strong>{printGrn.driverName || '-'}</strong></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Bilty (LR) No:</span> <strong>{printGrn.lrNumber || '-'}</strong></div>
                      <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', minWidth: '130px' }}>Driver Phone:</span> <strong>{printGrn.driverNo || '-'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Product Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT ID</th>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'left', fontSize: '11px' }}>PRODUCT DESCRIPTION</th>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>TOTAL PLANNED</th>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>ACCEPTED</th>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '11px' }}>REJECTED</th>
                      <th style={{ background: '#1e293b', color: 'white', padding: '8px', textAlign: 'left', fontSize: '11px' }}>UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printGrn.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>{item.sku || item.productId || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.productName || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#dbeafe', textAlign: 'center' }}>{Number(item.orderedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#dcfce7', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{Number(item.acceptedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#fee2e2', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{Number(item.rejectedQuantity || 0)}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.uomName || '-'}</td>
                      </tr>
                    ))}
                    {(!printGrn.items || printGrn.items.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Remarks */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textDecoration: 'underline', color: '#64748b' }}>Operational Remarks:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{printGrn.notes || 'OK'}</div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div style={{ textDecoration: 'underline' }}>System Authorized &amp; Checked By:</div>
                    <div style={{ fontWeight: 'bold', color: '#1e40af' }}>{printGrn.receivedByUsername || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Auditor Signature</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>
                    <div style={{ borderTop: '1px solid #1a1a2e', width: '160px', margin: '24px auto 4px' }}></div>
                    <div>Receiver / Driver</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#94a3b8' }}>
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
