'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, Search, RefreshCw, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

const MATCH_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  matched: { label: 'Matched', variant: 'default' },
  mismatch: { label: 'Mismatch', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'secondary' },
  grn_missing: { label: 'GRN Missing', variant: 'outline' },
  invoice_missing: { label: 'Invoice Missing', variant: 'outline' },
};

const LINE_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  matched: { label: 'OK', variant: 'default' },
  qty_mismatch: { label: 'Qty Mismatch', variant: 'destructive' },
  price_mismatch: { label: 'Price Mismatch', variant: 'destructive' },
};

export default function ThreeWayMatchPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['three-way-match', page, search],
    queryFn: () =>
      accountsApi.getThreeWayMatch({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const matches = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const matchedCount = matches.filter((m: any) => m.matchStatus === 'matched').length;
  const mismatchCount = matches.filter((m: any) => m.matchStatus === 'mismatch').length;
  const pendingCount = matches.filter((m: any) => ['pending', 'grn_missing', 'invoice_missing'].includes(m.matchStatus)).length;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="3-Way Invoice Matching" description="Reconcile Purchase Orders vs GRNs vs Invoices">
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold">{matchedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Mismatches</p>
                <p className="text-2xl font-bold">{mismatchCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending / Incomplete</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Reconciliation</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by PO no or vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileCheck className="mb-2 h-10 w-10" />
              <p>No purchase orders to reconcile</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead className="text-right">PO Total</TableHead>
                    <TableHead className="text-right">GRN Total</TableHead>
                    <TableHead className="text-right">Invoice Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match: any) => {
                    const statusConfig = MATCH_STATUS_CONFIG[match.matchStatus] || MATCH_STATUS_CONFIG.pending;
                    const isExpanded = expandedRows.has(match.orderId);
                    return (
                      <>
                        <TableRow key={match.orderId} className="cursor-pointer" onClick={() => toggleRow(match.orderId)}>
                          <TableCell>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">{match.orderNumber}</TableCell>
                          <TableCell>{match.vendorName || '—'}</TableCell>
                          <TableCell>{match.orderDate ? new Date(match.orderDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-right">{Number(match.poTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                          <TableCell className="text-right">{Number(match.grnTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                          <TableCell className="text-right">{Number(match.invoiceTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          </TableCell>
                        </TableRow>
                        {isExpanded && match.lineMatches?.length > 0 && (
                          <TableRow key={`${match.orderId}-detail`}>
                            <TableCell colSpan={8} className="bg-muted/50 p-0">
                              <div className="p-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead className="text-right">Ordered</TableHead>
                                      <TableHead className="text-right">Received</TableHead>
                                      <TableHead className="text-right">Accepted</TableHead>
                                      <TableHead className="text-right">Invoiced</TableHead>
                                      <TableHead className="text-right">PO Price</TableHead>
                                      <TableHead className="text-right">Inv Price</TableHead>
                                      <TableHead>Line Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {match.lineMatches.map((line: any, idx: number) => {
                                      const lineConfig = LINE_STATUS_CONFIG[line.status] || LINE_STATUS_CONFIG.matched;
                                      return (
                                        <TableRow key={idx}>
                                          <TableCell>{line.productName}</TableCell>
                                          <TableCell className="text-right">{Number(line.orderedQty).toLocaleString()}</TableCell>
                                          <TableCell className="text-right">{Number(line.receivedQty).toLocaleString()}</TableCell>
                                          <TableCell className="text-right">{Number(line.acceptedQty).toLocaleString()}</TableCell>
                                          <TableCell className="text-right">{Number(line.invoicedQty).toLocaleString()}</TableCell>
                                          <TableCell className="text-right">{Number(line.poUnitPrice).toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{Number(line.invoiceUnitPrice).toFixed(2)}</TableCell>
                                          <TableCell>
                                            <Badge variant={lineConfig.variant}>{lineConfig.label}</Badge>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {matches.length} of {total} purchase orders
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
