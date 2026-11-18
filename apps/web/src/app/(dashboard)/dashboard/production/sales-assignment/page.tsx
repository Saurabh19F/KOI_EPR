'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrderApi, productionApi, inventoryApi, usersApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import { Search, RefreshCw, Factory, ShoppingCart, ArrowRight, Plus, X } from 'lucide-react';

interface UserAssignment {
  userId: string;
  urgent: boolean;
  assignQty: string;
}

export default function SalesAssignmentPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([
    { userId: '', urgent: false, assignQty: '' },
  ]);
  const [productionEndDate, setProductionEndDate] = useState('');
  const [plannerRemarks, setPlannerRemarks] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['sales-orders-for-production', page, search],
    queryFn: () =>
      salesOrderApi.getOrders({ page, limit: 25, status: 'purchase_in_progress', search: search || undefined }).then((res) => res.data),
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

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => adminApi.getDepartments(),
  });
  const productionDeptId = useMemo(() => {
    const depts: any[] = (departmentsData as any)?.data?.data || (departmentsData as any)?.data || [];
    const prod = depts.find((d: any) => d.departmentCode === 'PRODUCTION' || d.department_code === 'PRODUCTION');
    return prod?.departmentId || prod?.department_id || prod?.id || '';
  }, [departmentsData]);

  const { data: usersData } = useQuery({
    queryKey: ['production-users', productionDeptId],
    queryFn: () => usersApi.getUsers({ limit: 100, isActive: true, departmentId: productionDeptId || undefined }),
    enabled: !!productionDeptId,
  });
  const productionUsers: any[] = (usersData as any)?.data?.data || (usersData as any)?.data || [];

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
    mutationFn: async (assignments: any[]) => {
      const results = [];
      for (const data of assignments) {
        results.push(await productionApi.createJob(data));
      }
      return results;
    },
    onSuccess: () => {
      toast.success('Production plans created successfully');
      queryClient.invalidateQueries({ queryKey: ['production-jobs-all'] });
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create production plans');
    },
  });

  const handleAssign = (order: any, item: any) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setUserAssignments([{ userId: '', urgent: false, assignQty: '' }]);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    setProductionEndDate(defaultDate.toISOString().split('T')[0]);
    setPlannerRemarks('');
    setShowAssignDialog(true);
  };

  const closeDialog = () => {
    setShowAssignDialog(false);
    setSelectedOrder(null);
    setSelectedItem(null);
  };

  const addUserRow = () => {
    setUserAssignments((prev) => [...prev, { userId: '', urgent: false, assignQty: '' }]);
  };

  const removeUserRow = (index: number) => {
    setUserAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUserRow = (index: number, field: keyof UserAssignment, value: any) => {
    setUserAssignments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleCreatePlans = () => {
    const validAssignments = userAssignments.filter((a) => a.userId && Number(a.assignQty) > 0);
    if (validAssignments.length === 0) {
      toast.error('Add at least one production user with quantity');
      return;
    }
    if (!productionEndDate) {
      toast.error('Production end date is required');
      return;
    }

    const totalAssigned = validAssignments.reduce((sum, a) => sum + Number(a.assignQty), 0);
    const itemBalance = Number(selectedItem?.quantity || 0) - Number(selectedItem?._assignedQty || 0);
    if (totalAssigned > itemBalance) {
      toast.error(`Total assigned qty (${totalAssigned}) exceeds balance qty (${itemBalance})`);
      return;
    }

    const defaultWarehouse = warehouseList[0];
    const jobs = validAssignments.map((a) => {
      const assignedUser = productionUsers.find((u: any) => u.userId === a.userId);
      return {
        orderNo: selectedOrder.orderNumber || selectedOrder.orderId,
        productId: selectedItem.productId || selectedItem.productCode || '',
        productName: selectedItem.productName || '',
        orderQty: Number(selectedItem.quantity || 0),
        plannedProductionQty: Number(a.assignQty),
        uom: selectedItem.uomName || selectedItem.uom || 'PCS',
        warehouseId: defaultWarehouse?.id || '',
        warehouseName: defaultWarehouse?.name || '',
        partyName: selectedOrder.partyName || selectedOrder.customerName || '',
        remarks: `Assigned to: ${assignedUser?.name || 'User'}${a.urgent ? ' [URGENT]' : ''}. End date: ${productionEndDate}. ${plannerRemarks || ''}`.trim(),
        startDate: new Date().toISOString(),
      };
    });

    createJobMutation.mutate(jobs);
  };

  const assignedCount = orders.filter((o: any) => existingJobs.has(o.orderNumber)).length;
  const unassignedCount = total - assignedCount;

  const itemBalance = Number(selectedItem?.quantity || 0) - Number(selectedItem?._assignedQty || 0);
  const totalAssignedQty = userAssignments.reduce((sum, a) => sum + Number(a.assignQty || 0), 0);
  const remainingQty = itemBalance - totalAssignedQty;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Production User Quantity Assignment" description="SALES ORDER PRODUCTION PLANNING">
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
                <p className="text-sm text-muted-foreground">Total Orders</p>
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
            <CardTitle>Sales Orders</CardTitle>
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
              <p>No sales orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sales Order Qty</TableHead>
                      <TableHead className="text-right">Assigned Qty</TableHead>
                      <TableHead className="text-right">Balance Qty</TableHead>
                      <TableHead>Production Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => {
                      const orderNum = order.orderNumber || order.orderId;
                      const jobs = existingJobs.get(orderNum) || [];
                      const items = order.items || [];
                      if (items.length === 0) {
                        return (
                          <TableRow key={order.orderId}>
                            <TableCell className="text-xs font-medium whitespace-nowrap">{orderNum}</TableCell>
                            <TableCell className="text-xs">{order.partyName || order.customerName || '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">No items</TableCell>
                            <TableCell className="text-xs text-right">—</TableCell>
                            <TableCell className="text-xs text-right">—</TableCell>
                            <TableCell className="text-xs text-right">—</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">No Items</Badge></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        );
                      }
                      return items.map((item: any, idx: number) => {
                        const itemQty = Number(item.quantity || 0);
                        const assignedQty = jobs
                          .filter((j: any) => j.productId === item.productId || j.productName === item.productName)
                          .reduce((sum: number, j: any) => sum + Number(j.plannedProductionQty || 0), 0);
                        const balance = itemQty - assignedQty;
                        const isFullyAssigned = balance <= 0;
                        return (
                          <TableRow key={`${order.orderId}-${idx}`}>
                            {idx === 0 ? (
                              <>
                                <TableCell className="text-xs font-medium whitespace-nowrap" rowSpan={items.length}>{orderNum}</TableCell>
                                <TableCell className="text-xs" rowSpan={items.length}>{order.partyName || order.customerName || '—'}</TableCell>
                              </>
                            ) : null}
                            <TableCell className="text-xs">{item.productName || '—'}</TableCell>
                            <TableCell className="text-xs text-right">{itemQty.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">{assignedQty > 0 ? assignedQty.toLocaleString() : '—'}</TableCell>
                            <TableCell className="text-xs text-right font-semibold" style={{ color: isFullyAssigned ? '#16a34a' : '#dc2626' }}>
                              {balance.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {isFullyAssigned ? (
                                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Assigned</Badge>
                              ) : assignedQty > 0 ? (
                                <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">Partial</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!isFullyAssigned && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssign(order, { ...item, _assignedQty: assignedQty, _balance: balance })}
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
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

      <Dialog open={showAssignDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Assign Production Users
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg bg-purple-50 border border-purple-100 p-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Order</p>
              <p className="text-sm font-bold mt-1">{selectedOrder?.orderNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Product</p>
              <p className="text-sm font-bold mt-1">{selectedItem?.productName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Balance Qty</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{itemBalance}</p>
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Production User Split</h3>
              <Button variant="default" size="sm" onClick={addUserRow} className="bg-blue-700 hover:bg-blue-800">
                <Plus className="mr-1 h-3 w-3" />
                Add User
              </Button>
            </div>

            <div className="space-y-3">
              {userAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={assignment.userId}
                      onValueChange={(v) => updateUserRow(index, 'userId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Production User" />
                      </SelectTrigger>
                      <SelectContent>
                        {productionUsers.map((u: any) => (
                          <SelectItem key={u.userId} value={u.userId}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={assignment.urgent}
                      onCheckedChange={(checked) => updateUserRow(index, 'urgent', !!checked)}
                    />
                    <Label className="text-sm whitespace-nowrap">Urgent</Label>
                  </div>
                  <div className="w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Assign Qty"
                      value={assignment.assignQty}
                      onChange={(e) => updateUserRow(index, 'assignQty', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeUserRow(index)}
                    disabled={userAssignments.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {totalAssignedQty > 0 && (
              <div className="text-sm text-muted-foreground">
                Assigned: <strong>{totalAssignedQty}</strong> / {itemBalance}
                {remainingQty > 0 && <span className="text-amber-600 ml-2">({remainingQty} remaining)</span>}
                {remainingQty < 0 && <span className="text-red-600 ml-2">(exceeds by {Math.abs(remainingQty)})</span>}
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-bold uppercase text-xs tracking-wide">Production End Date *</Label>
              <Input
                type="date"
                value={productionEndDate}
                onChange={(e) => setProductionEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Planner assignment remarks (optional)"
                value={plannerRemarks}
                onChange={(e) => setPlannerRemarks(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              onClick={handleCreatePlans}
              disabled={createJobMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createJobMutation.isPending ? 'Creating...' : 'Create Production Plans'}
            </Button>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
