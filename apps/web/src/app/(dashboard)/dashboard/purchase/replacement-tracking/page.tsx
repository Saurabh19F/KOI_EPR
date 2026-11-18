'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '@/lib/api';
import toast from 'react-hot-toast';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, RefreshCw, Package, CheckCircle, Truck } from 'lucide-react';

export default function ReplacementTrackingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'awaiting' | 'received' | 'all'>('awaiting');
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['replacement-tracking', search, page],
    queryFn: async () => {
      const params: any = { page, limit: 50 };
      if (search) params.search = search;
      const res = await qualityApi.getRejectActions(params);
      return res.data;
    },
  });

  const allActions = data?.data || [];

  const replacementItems = useMemo(() => {
    return allActions.filter((a: any) => a.isReplacementExpected === true);
  }, [allActions]);

  const displayItems = useMemo(() => {
    if (tab === 'awaiting') return replacementItems.filter((a: any) => !a.replacementReceivedAt);
    if (tab === 'received') return replacementItems.filter((a: any) => a.replacementReceivedAt);
    return replacementItems;
  }, [replacementItems, tab]);

  const awaitingCount = replacementItems.filter((a: any) => !a.replacementReceivedAt).length;
  const receivedCount = replacementItems.filter((a: any) => a.replacementReceivedAt).length;

  const markReceivedMutation = useMutation({
    mutationFn: (id: string) => qualityApi.markReplacementReceived(id),
    onSuccess: () => {
      toast.success('Replacement marked as received');
      queryClient.invalidateQueries({ queryKey: ['replacement-tracking'] });
      setConfirmDialog(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update');
    },
  });

  const getEtaStatus = (eta: string) => {
    if (!eta) return { label: 'No ETA', className: 'bg-gray-100 text-gray-700' };
    const diff = new Date(eta).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: 'bg-red-100 text-red-800' };
    if (days <= 2) return { label: `${days}d left`, className: 'bg-amber-100 text-amber-800' };
    return { label: `${days}d left`, className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Replacement Tracking" description="Track replacement orders linked to purchase rejections">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Replacements</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{replacementItems.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Awaiting Delivery</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{awaitingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Received</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{receivedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={tab === 'awaiting' ? 'default' : 'outline'} size="sm" onClick={() => setTab('awaiting')}>
          Awaiting ({awaitingCount})
        </Button>
        <Button variant={tab === 'received' ? 'default' : 'outline'} size="sm" onClick={() => setTab('received')}>
          Received ({receivedCount})
        </Button>
        <Button variant={tab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTab('all')}>
          All ({replacementItems.length})
        </Button>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 w-[220px] text-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="mb-2 h-10 w-10" />
              <p>No replacement items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO / GRN</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rejected Qty</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Replacement Vendor</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item: any) => {
                    const eta = getEtaStatus(item.replacementEta);
                    return (
                      <TableRow key={item.actionId || item.id}>
                        <TableCell className="font-medium text-sm">
                          {item.poNumber || '—'}
                          {item.grnNumber && <span className="block text-xs text-muted-foreground">{item.grnNumber}</span>}
                        </TableCell>
                        <TableCell className="text-sm">{item.productName || item.itemDescription || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{item.rejectedQty ?? item.qty ?? '—'}</TableCell>
                        <TableCell className="text-sm">{item.vendorName || '—'}</TableCell>
                        <TableCell className="text-sm">
                          {item.replacementVendor || item.vendorName || '—'}
                          {item.supplierOption === 'other_vendor' && <Badge variant="outline" className="ml-1 text-[10px]">Alt</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge className={eta.className + ' text-xs'}>{eta.label}</Badge>
                          {item.replacementEta && (
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {new Date(item.replacementEta).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.replacementReceivedAt ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Received</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">Awaiting</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!item.replacementReceivedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => setConfirmDialog(item)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark Received
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Replacement Received</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Mark replacement as received for:</p>
            <p className="font-medium">{confirmDialog?.productName || confirmDialog?.itemDescription}</p>
            <p className="text-muted-foreground">PO: {confirmDialog?.poNumber} | Vendor: {confirmDialog?.replacementVendor || confirmDialog?.vendorName}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              onClick={() => confirmDialog && markReceivedMutation.mutate(confirmDialog.actionId || confirmDialog.id)}
              disabled={markReceivedMutation.isPending}
            >
              {markReceivedMutation.isPending ? 'Updating...' : 'Confirm Received'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
