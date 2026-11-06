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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Search, RefreshCw, FileText, Clock, CheckCircle, IndianRupee } from 'lucide-react';

export default function POInvoiceStatusPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [activeTab, setActiveTab] = useState('indent-to-po');

  const { data: stats } = useQuery({
    queryKey: ['accounts-stats'],
    queryFn: () => accountsApi.getStats().then((res) => res.data),
  });

  const { data: indentData, isLoading: indentLoading, refetch: refetchIndent } = useQuery({
    queryKey: ['indent-to-po', page, search],
    queryFn: () =>
      accountsApi.getIndentToPO({ page, limit: 25, search: search || undefined }).then((res) => res.data),
    enabled: activeTab === 'indent-to-po',
  });

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['accounts-pending-pos', pendingPage, search],
    queryFn: () =>
      accountsApi.getPendingPOs({ page: pendingPage, limit: 25, search: search || undefined }).then((res) => res.data),
    enabled: activeTab === 'pending-ledger',
  });

  const indentItems = indentData?.data || [];
  const indentTotal = indentData?.total || 0;
  const indentTotalPages = indentData?.totalPages || 1;

  const pendingItems = pendingData?.data || [];
  const pendingTotal = pendingData?.total || 0;
  const pendingTotalPages = pendingData?.totalPages || 1;

  const dashStats = stats?.data || stats || {};

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Accounts PO / Invoice Status" description="Track purchase orders from indent through to invoice and ledger entry">
        <Button variant="outline" onClick={() => { refetchIndent(); refetchPending(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total POs</p>
                <p className="text-2xl font-bold">{dashStats.totalPOs || dashStats.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Ledger</p>
                <p className="text-2xl font-bold">{dashStats.pendingLedger || pendingTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{dashStats.completedLedger || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2"><IndianRupee className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {Number(dashStats.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>PO Tracking</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PO, vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); setPendingPage(1); }}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="indent-to-po">Indent to PO ({indentTotal})</TabsTrigger>
              <TabsTrigger value="pending-ledger">Pending Ledger Entry ({pendingTotal})</TabsTrigger>
            </TabsList>

            <TabsContent value="indent-to-po" className="mt-4">
              {indentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : indentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="mb-2 h-10 w-10" />
                  <p>No indent-to-PO records found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Indent Ref</TableHead>
                          <TableHead>PO Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>GRN Status</TableHead>
                          <TableHead>Invoice Status</TableHead>
                          <TableHead>Ledger Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {indentItems.map((item: any) => (
                          <TableRow key={item.orderId || item.id}>
                            <TableCell className="text-xs font-medium">{item.poNumber || item.orderNumber || '—'}</TableCell>
                            <TableCell className="text-xs">{item.vendorName || '—'}</TableCell>
                            <TableCell className="text-xs">{item.indentNumber || item.requestNumber || '—'}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              {Number(item.totalAmount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.grnStatus === 'received' ? 'default' : 'secondary'} className="text-xs">
                                {item.grnStatus || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.invoiceStatus === 'uploaded' ? 'default' : 'secondary'} className="text-xs">
                                {item.invoiceStatus || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.ledgerStatus === 'approved' ? 'default' : item.ledgerStatus === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                                {item.ledgerStatus || 'pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Showing {indentItems.length} of {indentTotal}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= indentTotalPages}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="pending-ledger" className="mt-4">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="mb-2 h-10 w-10" />
                  <p>No pending POs awaiting ledger entry</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.map((item: any) => (
                          <TableRow key={item.orderId || item.id}>
                            <TableCell className="text-xs font-medium">{item.poNumber || item.orderNumber || '—'}</TableCell>
                            <TableCell className="text-xs">{item.vendorName || '—'}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              {Number(item.totalAmount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{item.status || 'approved'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Showing {pendingItems.length} of {pendingTotal}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage <= 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPendingPage(p => p + 1)} disabled={pendingPage >= pendingTotalPages}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
