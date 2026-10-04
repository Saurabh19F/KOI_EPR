'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingBag,
  Search,
  Plus,
  Eye,
  FileDown,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received: 'bg-emerald-100 text-emerald-800',
  invoiced: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-600',
};

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num || 0);
}

function formatDate(date: string | Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLES_CAN_VIEW_ALL = ['ADMIN', 'PURCHASE_MANAGER', 'MANAGEMENT'];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userRole = (user?.role || '').toUpperCase();
  const canViewAll = user?.isSuperAdmin || ROLES_CAN_VIEW_ALL.includes(userRole);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [myOrders, setMyOrders] = useState(!canViewAll);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const effectiveMyOrders = canViewAll ? myOrders : true;

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { page, status, search, myOrders: effectiveMyOrders, userId: user?.userId }],
    queryFn: () =>
      purchaseOrderApi.getOrders({
        page,
        limit: 20,
        ...(status !== 'all' ? { status } : {}),
        ...(search ? { search } : {}),
        ...(effectiveMyOrders ? { myOrders: true } : {}),
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['po-stats'],
    queryFn: () => purchaseOrderApi.getStats().then((r) => r.data),
  });

  const orders = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;
  const stats = statsData || { orders: { total: 0, value: 0 }, pendingApprovals: 0, activeVendors: 0 };

  const approveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.approveOrder(id),
    onSuccess: () => {
      toast.success('Purchase order approved');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to approve'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.cancelOrder(id),
    onSuccess: () => {
      toast.success('Purchase order cancelled');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to cancel'),
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: ({ orderId, remarks }: { orderId: string; remarks?: string }) =>
      purchaseOrderApi.submitForApproval({ orderId, remarks }),
    onSuccess: () => {
      toast.success('Submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
      setApprovalDialog({ open: false, orderId: null });
      setApprovalRemarks('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to submit'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => purchaseOrderApi.approveOrder(id)));
    },
    onSuccess: () => {
      toast.success(`${selectedOrders.length} order(s) approved`);
      setSelectedOrders([]);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Bulk approve failed'),
  });

  const handleDownloadPdf = async (orderId: string, orderNumber: string) => {
    try {
      const response = await purchaseOrderApi.downloadPdf(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-${orderNumber.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    const draftOrders = orders.filter((o: any) => ['draft', 'submitted'].includes(o.status));
    if (selectedOrders.length === draftOrders.length && draftOrders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(draftOrders.map((o: any) => o.orderId));
    }
  };

  const isBusy = approveMutation.isPending || cancelMutation.isPending || submitForApprovalMutation.isPending || bulkApproveMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500">Manage purchase orders, approvals, and PDF generation</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingBag className="h-4 w-4" /> Total Orders
            </div>
            <div className="text-2xl font-bold">{stats.orders?.total || 0}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(stats.orders?.value || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Pending Approvals
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Truck className="h-4 w-4" /> Approved Orders
            </div>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((o: any) => o.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Package className="h-4 w-4" /> Active Vendors
            </div>
            <div className="text-2xl font-bold">{stats.activeVendors || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Orders Toggle */}
      <div className="flex gap-2 items-center">
        {canViewAll ? (
          <>
            <Button
              variant={myOrders ? 'default' : 'outline'}
              onClick={() => { setMyOrders(true); setPage(1); }}
              size="sm"
            >
              My Orders
            </Button>
            <Button
              variant={!myOrders ? 'default' : 'outline'}
              onClick={() => { setMyOrders(false); setPage(1); }}
              size="sm"
            >
              All Orders
            </Button>
          </>
        ) : (
          <span className="text-sm font-medium text-primary">
            My Orders
          </span>
        )}
        {effectiveMyOrders && user?.name && (
          <span className="text-sm text-muted-foreground ml-2">
            Showing orders assigned to <strong>{user.name}</strong>
          </span>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by PO number, vendor name..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setMyOrders(false); setPage(1); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const ids = selectedOrders.join(',');
                  router.push(`/dashboard/purchase/orders/new?from=${ids}`);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                New PO from Selected
              </Button>
              <Button
                size="sm"
                variant="default"
                disabled={isBusy}
                onClick={() => bulkApproveMutation.mutate(selectedOrders)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Bulk Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedOrders([])}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : orders.length ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length > 0 && selectedOrders.length === orders.filter((o: any) => ['draft', 'submitted'].includes(o.status)).length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead className="font-semibold">PO Number</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Vendor</TableHead>
                      <TableHead className="font-semibold">SO Ref</TableHead>
                      <TableHead className="font-semibold">Purchase Person</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.orderId} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/purchase/orders/${order.orderId}`)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {['draft', 'submitted'].includes(order.status) && (
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.orderId)}
                              onChange={() => toggleSelectOrder(order.orderId)}
                              className="rounded border-gray-300"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-blue-700 hover:text-blue-900">
                          <Link href={`/dashboard/purchase/orders/${order.orderId}`} onClick={(e) => e.stopPropagation()}>
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(order.orderDate || order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm">{order.vendorName || 'TBD'}</span>
                            {order.vendorCode && (
                              <span className="text-xs text-slate-500 block font-mono">{order.vendorCode}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-slate-600">
                          {order.soNo || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {order.purchasePerson || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} text-[10px] uppercase font-bold`}>
                            {order.status?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(order.orderId, order.orderNumber)}
                            >
                              <FileDown className="h-4 w-4 text-blue-600" />
                            </Button>

                            {['draft', 'submitted'].includes(order.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                title="Submit for Approval"
                                disabled={isBusy}
                                onClick={() => setApprovalDialog({ open: true, orderId: order.orderId })}
                              >
                                <Send className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}

                            {['draft', 'submitted', 'pending_approval'].includes(order.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                title="Approve"
                                disabled={isBusy}
                                onClick={() => approveMutation.mutate(order.orderId)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}

                            {!['cancelled', 'received', 'invoiced', 'closed'].includes(order.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                title="Cancel"
                                disabled={isBusy}
                                onClick={() => cancelMutation.mutate(order.orderId)}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}

                            <Button asChild variant="ghost" size="sm" className="h-8 px-2" title="View Details">
                              <Link href={`/dashboard/purchase/orders/${order.orderId}`}>
                                <Eye className="h-4 w-4 text-slate-600" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
              <p className="text-gray-500 mt-1">
                {search || status !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Purchase orders are auto-generated from confirmed sales orders, or create one manually'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/purchase/orders/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={approvalDialog.open} onOpenChange={(open) => { if (!open) { setApprovalDialog({ open: false, orderId: null }); setApprovalRemarks(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Submit this purchase order for management approval before processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Add remarks for the approver..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApprovalDialog({ open: false, orderId: null }); setApprovalRemarks(''); }}>
              Cancel
            </Button>
            <Button
              disabled={submitForApprovalMutation.isPending}
              onClick={() => {
                if (approvalDialog.orderId) {
                  submitForApprovalMutation.mutate({ orderId: approvalDialog.orderId, remarks: approvalRemarks || undefined });
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitForApprovalMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
