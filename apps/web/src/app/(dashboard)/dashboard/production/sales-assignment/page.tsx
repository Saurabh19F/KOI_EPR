'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrderApi, productionApi, inventoryApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, RefreshCw, Factory, ShoppingCart, ArrowRight, Plus } from 'lucide-react';

export default function SalesAssignmentPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    productId: '',
    productName: '',
    orderQty: '',
    plannedProductionQty: '',
    uom: '',
    warehouseId: '',
  });
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['sales-orders-for-production', page, search],
    queryFn: () =>
      salesOrderApi.getOrders({ page, limit: 25, status: 'confirmed', search: search || undefined }).then((res) => res.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['production-jobs-all'],
    queryFn: () => productionApi.getJobs({ limit: 500 }).then((res) => res.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehouses?.data || [];

  const orders = ordersData?.data || [];
  const total = ordersData?.total || 0;
  const totalPages = ordersData?.totalPages || 1;

  const existingJobs = useMemo(() => {
    const jobs = (jobsData as any)?.data || jobsData || [];
    const jobsByOrder = new Map<string, any[]>();
    for (const job of (Array.isArray(jobs) ? jobs : [])) {
      if (job.orderNo) {
        if (!jobsByOrder.has(job.orderNo)) jobsByOrder.set(job.orderNo, []);
        jobsByOrder.get(job.orderNo)!.push(job);
      }
    }
    return jobsByOrder;
  }, [jobsData]);

  const createJobMutation = useMutation({
    mutationFn: (data: any) => productionApi.createJob(data),
    onSuccess: () => {
      toast.success('Production job created from sales order');
      queryClient.invalidateQueries({ queryKey: ['production-jobs-all'] });
      setShowAssignDialog(false);
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create production job');
    },
  });

  const handleAssign = (order: any) => {
    setSelectedOrder(order);
    const items = order.items || [];
    const firstItem = items[0] || {};
    setAssignForm({
      productId: firstItem.productId || '',
      productName: firstItem.productName || firstItem.description || '',
      orderQty: String(firstItem.quantity || order.totalQty || ''),
      plannedProductionQty: String(firstItem.quantity || order.totalQty || ''),
      uom: firstItem.uom || 'PCS',
      warehouseId: '',
    });
    setShowAssignDialog(true);
  };

  const handleCreateJob = () => {
    if (!assignForm.productId && !assignForm.productName) {
      toast.error('Product is required');
      return;
    }
    if (!assignForm.warehouseId) {
      toast.error('Production warehouse is required');
      return;
    }
    const qty = Number(assignForm.orderQty);
    const planned = Number(assignForm.plannedProductionQty);
    if (!qty || qty <= 0) {
      toast.error('Order quantity must be greater than zero');
      return;
    }
    createJobMutation.mutate({
      orderNo: selectedOrder.orderNumber || selectedOrder.orderId,
      productId: assignForm.productId,
      productName: assignForm.productName,
      orderQty: qty,
      plannedProductionQty: planned || qty,
      uom: assignForm.uom || 'PCS',
      warehouseId: assignForm.warehouseId,
      partyName: selectedOrder.partyName || selectedOrder.customerName || '',
    });
  };

  const assignedCount = orders.filter((o: any) => existingJobs.has(o.orderNumber)).length;
  const unassignedCount = total - assignedCount;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Production Assignment from Sales" description="Create production jobs directly from confirmed sales orders">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Sales Orders</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Factory className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned to Production</p>
                <p className="text-2xl font-bold">{assignedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><ArrowRight className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Assignment</p>
                <p className="text-2xl font-bold">{unassignedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Confirmed Sales Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order, party..."
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
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="mb-2 h-10 w-10" />
              <p>No confirmed sales orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Production</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => {
                      const orderNum = order.orderNumber || order.orderId;
                      const jobs = existingJobs.get(orderNum) || [];
                      const hasJob = jobs.length > 0;
                      return (
                        <TableRow key={order.orderId || order.id}>
                          <TableCell className="text-xs font-medium whitespace-nowrap">{orderNum}</TableCell>
                          <TableCell className="text-xs">{order.partyName || order.customerName || '—'}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-xs">{order.items?.length || 0} items</TableCell>
                          <TableCell className="text-xs text-right">
                            {(order.items || []).reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {Number(order.totalAmount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            {hasJob ? (
                              <Badge variant="default" className="text-xs">
                                {jobs.length} job{jobs.length > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssign(order)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              {hasJob ? 'Add Job' : 'Assign'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {orders.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAssignDialog} onOpenChange={(open) => { if (!open) { setShowAssignDialog(false); setSelectedOrder(null); } }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              Create Production Job — {selectedOrder?.orderNumber || 'Order'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedOrder?.partyName && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                Party: <strong>{selectedOrder.partyName || selectedOrder.customerName}</strong>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Product ID</Label>
                <Input value={assignForm.productId} onChange={(e) => setAssignForm(f => ({ ...f, productId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Product Name *</Label>
                <Input value={assignForm.productName} onChange={(e) => setAssignForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Order Qty *</Label>
                <Input type="number" min={0} value={assignForm.orderQty} onChange={(e) => setAssignForm(f => ({ ...f, orderQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Planned Qty</Label>
                <Input type="number" min={0} value={assignForm.plannedProductionQty} onChange={(e) => setAssignForm(f => ({ ...f, plannedProductionQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">UOM</Label>
                <Input value={assignForm.uom} onChange={(e) => setAssignForm(f => ({ ...f, uom: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Production Warehouse *</Label>
              <Select value={assignForm.warehouseId} onValueChange={(v) => setAssignForm(f => ({ ...f, warehouseId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select production warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseList.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignDialog(false); setSelectedOrder(null); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? 'Creating...' : 'Create Production Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
