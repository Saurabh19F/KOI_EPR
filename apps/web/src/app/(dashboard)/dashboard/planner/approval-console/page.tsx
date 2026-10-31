'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ApprovalConsolePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['approval-console-transfers', page],
    queryFn: async () => {
      const res = await inventoryTrackingApi.getTransfers({ status: 'pending', page, limit });
      return res.data;
    },
  });

  const transfers = data?.data || data?.items || [];
  const total = data?.total || transfers.length;
  const totalPages = Math.ceil(total / limit) || 1;

  const approveMutation = useMutation({
    mutationFn: (transferId: string) => inventoryTrackingApi.approveTransfer(transferId),
    onSuccess: () => {
      toast.success('Transfer approved');
      queryClient.invalidateQueries({ queryKey: ['approval-console-transfers'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Approve failed');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason?: string }) =>
      inventoryTrackingApi.rejectTransfer(transferId, reason),
    onSuccess: () => {
      toast.success('Transfer rejected');
      setRejectDialogId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['approval-console-transfers'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Reject failed');
    },
  });

  const getProductDisplay = (transfer: any) => {
    if (transfer.items && transfer.items.length > 0) {
      return transfer.items.map((i: any) => i.productName || i.productId).join(', ');
    }
    return transfer.finalProductName || '-';
  };

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg font-semibold">
              Cross-Warehouse Transfer Approval Console (Head Planner)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              Approval Required
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>No pending transfer requests</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>REQ ID</TableHead>
                    <TableHead>ORDER NO</TableHead>
                    <TableHead>PRODUCT ID</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead>FROM WH (SOURCE)</TableHead>
                    <TableHead>TO WH (REQUESTING)</TableHead>
                    <TableHead>REQUESTED BY</TableHead>
                    <TableHead className="text-right">APPROVAL ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t: any) => (
                    <TableRow key={t.transferId}>
                      <TableCell>
                        <span className="text-red-600 font-medium">{t.transferNumber}</span>
                      </TableCell>
                      <TableCell className="font-medium">{t.orderNo || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {getProductDisplay(t)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-red-600">
                        {Number(t.totalQuantity || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.sourceWarehouseName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.destinationWarehouseName}</Badge>
                      </TableCell>
                      <TableCell>{t.requestedByUsername || t.createdBy || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveMutation.mutate(t.transferId)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectDialogId(t.transferId);
                              setRejectReason('');
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIdx} to {endIdx} of {total} entries
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i + 1}
                      variant={page === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectDialogId} onOpenChange={(open) => { if (!open) setRejectDialogId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for rejection (optional)</Label>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectDialogId) {
                  rejectMutation.mutate({ transferId: rejectDialogId, reason: rejectReason || undefined });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
