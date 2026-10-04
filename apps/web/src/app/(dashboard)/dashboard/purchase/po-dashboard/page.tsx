'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  ClipboardList,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from 'lucide-react';

type TabType = 'dashboard' | 'orders' | 'database' | 'orderSheet' | 'approvals' | 'vendors' | 'tracking';

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
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num || 0);
}

function formatDate(date: string | Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== Dashboard Tab =====
function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ['po-stats'],
    queryFn: () => purchaseOrderApi.getStats().then((r) => r.data),
  });

  const { data: trackingData } = useQuery({
    queryKey: ['po-tracking-fms'],
    queryFn: () => purchaseOrderApi.getTrackingFMS().then((r) => r.data),
  });

  const s = stats || { orders: { total: 0, value: 0 }, invoices: { total: 0, value: 0, pending: 0 }, pendingApprovals: 0, activeVendors: 0 };
  const t = trackingData?.summary || { totalOrders: 0, totalValue: 0, pendingDeliveryValue: 0, statusCounts: {} };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingBag className="h-4 w-4" /> Total Orders
            </div>
            <div className="text-2xl font-bold">{s.orders.total}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(s.orders.value)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Pending Approvals
            </div>
            <div className="text-2xl font-bold">{s.pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Truck className="h-4 w-4" /> Pending Delivery
            </div>
            <div className="text-2xl font-bold">{formatCurrency(t.pendingDeliveryValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" /> Active Vendors
            </div>
            <div className="text-2xl font-bold">{s.activeVendors}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PO Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(t.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm capitalize">{status.replace(/_/g, ' ')}</span>
                <Badge className={STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}>{String(count)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {trackingData?.pendingItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Delivery Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>SO No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingData.pendingItems.slice(0, 20).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.item_productName || item.productName}</TableCell>
                      <TableCell>{item.item_uniqueCode || item.uniqueCode || '-'}</TableCell>
                      <TableCell className="text-right">{item.item_quantity || item.quantity}</TableCell>
                      <TableCell className="text-right">{item.item_receivedQuantity || item.receivedQuantity || 0}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">{item.item_balanceQty || item.balanceQty}</TableCell>
                      <TableCell>{(item.item_leadTimeDays || item.leadTimeDays) ? `${item.item_leadTimeDays || item.leadTimeDays} days` : '-'}</TableCell>
                      <TableCell>{item.item_soNo || item.soNo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Orders Tab =====
function OrdersTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['po-orders', page, search, status],
    queryFn: () =>
      purchaseOrderApi.getOrders({
        page,
        limit: 20,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
      }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO number, vendor..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Purchase Person</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
            ) : (
              data.data.map((order: any) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.vendorName}</TableCell>
                  <TableCell>{order.purchasePerson || '-'}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100'}>{order.status?.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>{order.location || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages} ({data.total} orders)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Database Tab =====
function DatabaseTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['po-database', page, search],
    queryFn: () => purchaseOrderApi.getDatabaseView({ page, limit: 50, search: search || undefined }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search PO, vendor, product, code..." className="pl-9" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>S.No</TableHead>
              <TableHead>Unique Code</TableHead>
              <TableHead>Item Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Order Qty</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">GST Amt</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Enquiry No</TableHead>
              <TableHead>Approved By</TableHead>
              <TableHead>SO No</TableHead>
              <TableHead className="text-right">Balance Qty</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
            ) : (
              data.data.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium whitespace-nowrap">{item.order_orderNumber || item.orderNumber || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(item.order_orderDate || item.orderDate)}</TableCell>
                  <TableCell>{item.order_vendorName || item.vendorName || '-'}</TableCell>
                  <TableCell>{item.lineNumber}</TableCell>
                  <TableCell>{item.uniqueCode || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.productName}</TableCell>
                  <TableCell>{item.uomName || '-'}</TableCell>
                  <TableCell className="text-right">{item.orderQty || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.unitPrice}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.taxableAmount || 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.taxAmount || 0)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmount || 0)}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.remark || '-'}</TableCell>
                  <TableCell>{item.enquiryNo || '-'}</TableCell>
                  <TableCell>{item.approvedBy || '-'}</TableCell>
                  <TableCell>{item.soNo || '-'}</TableCell>
                  <TableCell className="text-right">{item.balanceQty || '-'}</TableCell>
                  <TableCell>{item.location || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Order Sheet Tab =====
function OrderSheetTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['po-order-sheet', page, search],
    queryFn: () => purchaseOrderApi.getOrderSheet({ page, limit: 50, search: search || undefined }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search PO, vendor, person, SO..." className="pl-9" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Vendor Type</TableHead>
              <TableHead>Purchase Person</TableHead>
              <TableHead>Enquiry No</TableHead>
              <TableHead>SO No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>PO URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
            ) : (
              data.data.map((order: any) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.vendorName}</TableCell>
                  <TableCell className="capitalize">{order.vendorType || '-'}</TableCell>
                  <TableCell>{order.purchasePerson || '-'}</TableCell>
                  <TableCell>{order.enquiryNo || '-'}</TableCell>
                  <TableCell>{order.soNo || '-'}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100'}>{order.status?.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>{order.items?.length || 0}</TableCell>
                  <TableCell>{order.location || '-'}</TableCell>
                  <TableCell>
                    {order.poUrl ? (
                      <a href={order.poUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View PDF</a>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Approvals Tab =====
function ApprovalsTab() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['po-approvals', page, status],
    queryFn: () => purchaseOrderApi.getApprovals({ page, limit: 20, status: status === 'all' ? undefined : status }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.approveApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => purchaseOrderApi.rejectApproval(id, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    },
  });

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; reason: string }>({ open: false, id: '', reason: '' });

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved/Rejected By</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No approval requests</TableCell></TableRow>
            ) : (
              data.data.map((approval: any) => (
                <TableRow key={approval.approvalId}>
                  <TableCell className="font-medium">{approval.orderNumber}</TableCell>
                  <TableCell>{approval.vendorName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(approval.totalAmount)}</TableCell>
                  <TableCell>{approval.requestedByName || '-'}</TableCell>
                  <TableCell>{formatDate(approval.requestedAt)}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[approval.status] || 'bg-gray-100'}>{approval.status}</Badge></TableCell>
                  <TableCell>{approval.approvedByName || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{approval.remarks || approval.rejectionReason || '-'}</TableCell>
                  <TableCell>
                    {approval.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => approveMutation.mutate(approval.approvalId)} disabled={approveMutation.isPending}>
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => setRejectDialog({ open: true, id: approval.approvalId, reason: '' })}>
                          <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Order</DialogTitle>
            <DialogDescription>Please provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Rejection Reason</Label>
            <Textarea value={rejectDialog.reason} onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Enter reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: '', reason: '' })}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectDialog.reason.trim() || rejectMutation.isPending}
              onClick={() => { rejectMutation.mutate({ id: rejectDialog.id, reason: rejectDialog.reason }); setRejectDialog({ open: false, id: '', reason: '' }); }}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Vendor Master Tab =====
function VendorMasterTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, search],
    queryFn: () => purchaseOrderApi.getVendors({ page, limit: 20, search: search || undefined }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.createVendor(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); setShowDialog(false); setEditVendor(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseOrderApi.updateVendor(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); setShowDialog(false); setEditVendor(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.deleteVendor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  });

  const [form, setForm] = useState<any>({});

  const openCreate = () => {
    setEditVendor(null);
    setForm({ vendorName: '', vendorCode: '', vendorType: '', contactPerson: '', phone: '', mobileNo: '', email: '', address: '', city: '', state: '', pincode: '', gstin: '', panNumber: '', category: '', productsSupplied: '', paymentTerms: '', purchasePerson: '', notes: '' });
    setShowDialog(true);
  };

  const openEdit = (vendor: any) => { setEditVendor(vendor); setForm({ ...vendor }); setShowDialog(true); };

  const handleSave = () => {
    if (editVendor) updateMutation.mutate({ id: editVendor.vendorId, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendor name, code, GSTIN..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Purchase Person</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
            ) : (
              data.data.map((vendor: any) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell className="font-mono text-sm">{vendor.vendorCode}</TableCell>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell className="capitalize">{vendor.vendorType || '-'}</TableCell>
                  <TableCell>{vendor.contactPerson || '-'}</TableCell>
                  <TableCell>{vendor.mobileNo || vendor.phone || '-'}</TableCell>
                  <TableCell>{vendor.gstin || '-'}</TableCell>
                  <TableCell>{vendor.category || '-'}</TableCell>
                  <TableCell>{vendor.purchasePerson || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(vendor)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500"
                        onClick={() => { if (confirm('Deactivate this vendor?')) deleteMutation.mutate(vendor.vendorId); }}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label>Vendor Name *</Label><Input value={form.vendorName || ''} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} /></div>
            <div><Label>Vendor Code</Label><Input value={form.vendorCode || ''} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} placeholder="Auto-generated if empty" /></div>
            <div>
              <Label>Vendor Type</Label>
              <Select value={form.vendorType || ''} onValueChange={(v) => setForm({ ...form, vendorType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="outstation">Outstation</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Category</Label><Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Contact Person</Label><Input value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div><Label>Mobile No</Label><Input value={form.mobileNo || ''} onChange={(e) => setForm({ ...form, mobileNo: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="col-span-2"><Label>Address</Label><Textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>City</Label><Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>State</Label><Input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><Label>Pincode</Label><Input value={form.pincode || ''} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
            <div><Label>GSTIN</Label><Input value={form.gstin || ''} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
            <div><Label>PAN Number</Label><Input value={form.panNumber || ''} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} /></div>
            <div><Label>FSSAI Number</Label><Input value={form.fssaiNumber || ''} onChange={(e) => setForm({ ...form, fssaiNumber: e.target.value })} /></div>
            <div><Label>Purchase Person</Label><Input value={form.purchasePerson || ''} onChange={(e) => setForm({ ...form, purchasePerson: e.target.value })} /></div>
            <div><Label>Payment Terms</Label><Input value={form.paymentTerms || ''} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
            <div className="col-span-2"><Label>Products Supplied</Label><Textarea value={form.productsSupplied || ''} onChange={(e) => setForm({ ...form, productsSupplied: e.target.value })} placeholder="Comma-separated list" /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.vendorName?.trim() || createMutation.isPending || updateMutation.isPending}>
              {editVendor ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Tracking FMS Tab =====
function TrackingFMSTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['po-tracking-fms'],
    queryFn: () => purchaseOrderApi.getTrackingFMS().then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading tracking data...</div>;

  const summary = data?.summary || {};
  const pendingItems = data?.pendingItems || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Orders</div><div className="text-2xl font-bold">{summary.totalOrders || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Value</div><div className="text-2xl font-bold">{formatCurrency(summary.totalValue || 0)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pending Delivery Value</div><div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingDeliveryValue || 0)}</div></CardContent></Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Status Breakdown</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(summary.statusCounts || {}).map(([s, c]) => (
                <Badge key={s} variant="outline" className="text-xs">{s}: {String(c)}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Items Pending Delivery</CardTitle></CardHeader>
        <CardContent>
          {!pendingItems.length ? (
            <p className="text-center py-8 text-muted-foreground">No pending delivery items</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Unique Code</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>SO No</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingItems.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.item_productName || item.productName}</TableCell>
                      <TableCell>{item.item_uniqueCode || item.uniqueCode || '-'}</TableCell>
                      <TableCell className="text-right">{item.item_quantity || item.quantity}</TableCell>
                      <TableCell className="text-right">{item.item_receivedQuantity || item.receivedQuantity || 0}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">{item.item_balanceQty || item.balanceQty}</TableCell>
                      <TableCell>{(item.item_leadTimeDays || item.leadTimeDays) ? `${item.item_leadTimeDays || item.leadTimeDays} days` : '-'}</TableCell>
                      <TableCell>{item.item_soNo || item.soNo || '-'}</TableCell>
                      <TableCell>{item.item_location || item.location || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Main Page =====
export default function PODashboardPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && ['dashboard', 'orders', 'database', 'orderSheet', 'approvals', 'vendors', 'tracking'].includes(tabParam)
      ? tabParam as TabType
      : 'dashboard'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Purchase Order Management</h1>
        <p className="text-muted-foreground">Dashboard, orders, approvals, vendors, and tracking</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Orders</TabsTrigger>
          <TabsTrigger value="database" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Database</TabsTrigger>
          <TabsTrigger value="orderSheet" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Order Sheet</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Approvals</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Vendor Master</TabsTrigger>
          <TabsTrigger value="tracking" className="gap-1.5"><Truck className="h-3.5 w-3.5" /> Tracking FMS</TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'database' && <DatabaseTab />}
        {activeTab === 'orderSheet' && <OrderSheetTab />}
        {activeTab === 'approvals' && <ApprovalsTab />}
        {activeTab === 'vendors' && <VendorMasterTab />}
        {activeTab === 'tracking' && <TrackingFMSTab />}
      </div>
    </div>
  );
}
