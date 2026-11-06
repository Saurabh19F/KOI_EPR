'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle,
  ClipboardList,
  Lock,
  RotateCcw,
  Save,
  Search,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { orderReviewApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const EDITABLE_BG = '#fcfeff';

export default function OrderReviewPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [draftData, setDraftData] = useState<Record<string, any>>({});
  const [cancelReason, setCancelReason] = useState('');
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [finalDispatchDates, setFinalDispatchDates] = useState<Record<string, string>>({});
  const [grossWeights, setGrossWeights] = useState<Record<string, string>>({});
  const [itemFilter, setItemFilter] = useState<Record<string, string>>({});
  const [stageModal, setStageModal] = useState<{ type: string; item: any; orderId: string } | null>(null);
  const [stageForm, setStageForm] = useState<{ purchasePerson: string; targetDate: string; remark: string; done: boolean; na: boolean }>({ purchasePerson: '', targetDate: '', remark: '', done: false, na: false });
  const [taskModal, setTaskModal] = useState<{ item: any; orderId: string } | null>(null);
  const [taskForm, setTaskForm] = useState<{ action: string; priority: string; targetDate: string; assignees: { departmentId: string; userId: string }[] }>({ action: '', priority: 'normal', targetDate: '', assignees: [{ departmentId: '', userId: '' }] });
  const [remarkModal, setRemarkModal] = useState<{ item: any; orderId: string } | null>(null);
  const [remarkText, setRemarkText] = useState('');

  // ──── Orders list ────
  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ['order-review-orders'],
    queryFn: () => orderReviewApi.getOrders({}),
  });
  const orders: any[] = ordersRes?.data || [];

  // ──── Batch items for selected orders ────
  const { data: batchRes, isLoading: batchLoading } = useQuery({
    queryKey: ['order-review-batch', selectedOrderIds],
    queryFn: () => orderReviewApi.getBatchOrderItems(selectedOrderIds),
    enabled: reviewOpen && selectedOrderIds.length > 0,
  });
  const batchItems: Record<string, any> = batchRes?.data || {};

  // ──── Lifecycle journey ────
  const { data: lifecycleRes } = useQuery({
    queryKey: ['order-review-lifecycle', selectedOrderIds],
    queryFn: () => orderReviewApi.getOrderLifecycle(selectedOrderIds),
    enabled: reviewOpen && selectedOrderIds.length > 0,
  });
  const lifecycle: any = lifecycleRes?.data || null;

  // ──── Users for purchase person dropdown ────
  const { data: usersRes } = useQuery({
    queryKey: ['order-review-lookup-users'],
    queryFn: () => orderReviewApi.getLookupUsers(),
    enabled: reviewOpen,
  });
  const usersList: any[] = (usersRes?.data as any)?.data || (usersRes?.data as any) || [];

  const { data: deptsRes } = useQuery({
    queryKey: ['order-review-lookup-departments'],
    queryFn: () => orderReviewApi.getLookupDepartments(),
    enabled: reviewOpen,
  });
  const departmentsList: any[] = (deptsRes?.data as any)?.data || (deptsRes?.data as any) || [];

  const openStageModal = (type: string, item: any, orderId: string) => {
    const stageData = draftData[item.itemId]?.stages?.[type] || item.reviewData?.stages?.[type] || {};
    setStageForm({
      purchasePerson: stageData.purchasePerson || item.purchasePersonName || '',
      targetDate: stageData.targetDate || '',
      remark: stageData.remark || '',
      done: stageData.done || false,
      na: stageData.na || false,
    });
    setStageModal({ type, item, orderId });
  };

  const saveStage = () => {
    if (!stageModal) return;
    const { type, item, orderId } = stageModal;
    const existing = draftData[item.itemId] || {};
    const stages = existing.stages || item.reviewData?.stages || {};
    updateDraftField(item.itemId, 'stages', {
      ...stages,
      [type]: { ...stageForm },
    });
    setStageModal(null);
    const stageNames: Record<string, string> = { stock: 'Stock', packing: 'Packing Material', labels: 'Labels', production: 'Production' };
    toast.success(`${stageNames[type] || type} stage updated — Save Draft to persist`);
  };

  const openTaskModal = (item: any, orderId: string) => {
    const tasks = draftData[item.itemId]?.tasks || item.reviewData?.tasks || [];
    setTaskForm({ action: '', priority: 'normal', targetDate: '', assignees: [{ departmentId: '', userId: '' }] });
    setTaskModal({ item, orderId });
  };

  const saveTask = () => {
    if (!taskModal) return;
    const { item } = taskModal;
    const existing = draftData[item.itemId] || {};
    const tasks = existing.tasks || item.reviewData?.tasks || [];
    const validAssignees = taskForm.assignees.filter(a => a.departmentId && a.userId);
    updateDraftField(item.itemId, 'tasks', [
      ...tasks,
      { action: taskForm.action, priority: taskForm.priority, targetDate: taskForm.targetDate, assignees: validAssignees, createdAt: new Date().toISOString() },
    ]);
    setTaskModal(null);
    toast.success('Task added — Save Draft to persist');
  };

  const openRemarkModal = (item: any, orderId: string) => {
    const existing = draftData[item.itemId]?.itemRemark || item.reviewData?.itemRemark || '';
    setRemarkText(existing);
    setRemarkModal({ item, orderId });
  };

  const saveRemark = () => {
    if (!remarkModal) return;
    updateDraftField(remarkModal.item.itemId, 'itemRemark', remarkText);
    setRemarkModal(null);
    toast.success('Remark saved — Save Draft to persist');
  };

  // ──── Derived ────
  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const s = search.toLowerCase();
    return orders.filter((o: any) =>
      o.orderNumber?.toLowerCase().includes(s) ||
      o.customerName?.toLowerCase().includes(s) ||
      o.salesPersonName?.toLowerCase().includes(s)
    );
  }, [orders, search]);

  const selectedOrders = orders.filter((o: any) => selectedOrderIds.includes(o.orderId));

  // ──── Handlers ────
  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const openSelected = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Select at least one order');
      return;
    }
    setReviewOpen(true);
  };

  const backToSelection = () => {
    setReviewOpen(false);
    setDraftData({});
    setFinalDispatchDates({});
    setGrossWeights({});
  };

  // ──── Mutations ────
  const saveDraftMutation = useMutation({
    mutationFn: (orderId: string) => {
      const orderItems = batchItems[orderId]?.items || [];
      const items = orderItems
        .filter((item: any) => !item.isCancelled && !item.isLocked)
        .map((item: any) => ({
          itemId: item.itemId,
          lineNumber: item.lineNumber,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          categoryName: item.categoryName,
          soQuantity: item.quantity,
          unitCbm: draftData[item.itemId]?.reviewCbmPerCtn ?? item.cbmPerBox,
          unitWeight: item.weight,
          purchasePersonName: item.purchasePersonName,
          ...(item.reviewData || {}),
          ...draftData[item.itemId],
          finalDispatch: finalDispatchDates[orderId] || item.reviewData?.finalDispatch || '',
        }));
      return orderReviewApi.saveDraft(orderId, items);
    },
    onSuccess: () => {
      toast.success('Draft saved');
      queryClient.invalidateQueries({ queryKey: ['order-review-batch'] });
    },
    onError: () => toast.error('Failed to save draft'),
  });

  const submitMutation = useMutation({
    mutationFn: ({ orderId, itemIds }: { orderId: string; itemIds: string[] }) =>
      orderReviewApi.submitFinal(orderId, itemIds),
    onSuccess: (res) => {
      const results = res?.data?.results || [];
      const locked = results.filter((r: any) => r.isLocked).length;
      toast.success(`Submitted ${results.length} items${locked ? ` (${locked} now locked)` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['order-review-batch'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Submission failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, itemId, reason }: { orderId: string; itemId: string; reason: string }) =>
      orderReviewApi.cancelItem(orderId, itemId, reason),
    onSuccess: () => {
      toast.success('Item cancelled');
      setCancelItemId(null);
      setCancelOrderId(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['order-review-batch'] });
    },
    onError: () => toast.error('Failed to cancel item'),
  });

  const closeOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderReviewApi.closeOrder(orderId),
    onSuccess: () => {
      toast.success('Order closed');
      queryClient.invalidateQueries({ queryKey: ['order-review-batch'] });
    },
  });

  const reopenOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderReviewApi.reopenOrder(orderId, 'Reopened for review'),
    onSuccess: () => {
      toast.success('Order reopened');
      queryClient.invalidateQueries({ queryKey: ['order-review-batch'] });
    },
  });

  // ──── Draft helpers ────
  const updateDraftField = (itemId: string, field: string, value: any) => {
    setDraftData(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value },
    }));
  };

  const getFieldValue = (item: any, field: string) => {
    return draftData[item.itemId]?.[field] ?? item.reviewData?.[field] ?? '';
  };

  // ──── Order progress ────
  const getOrderProgress = (orderId: string) => {
    const data = batchItems[orderId];
    if (!data) return { percent: 0, stage: 'Loading...' };
    const items: any[] = data.items || [];
    if (items.length === 0) return { percent: 0, stage: 'No items' };

    const active = items.filter((i: any) => !i.isCancelled);
    if (active.length === 0) return { percent: 100, stage: 'All Cancelled' };

    const withPO = active.filter((i: any) => i.reviewData?.poNumber || draftData[i.itemId]?.poNumber).length;
    const submitted = active.filter((i: any) => i.submissionCount > 0).length;
    const locked = active.filter((i: any) => i.isLocked).length;

    if (locked === active.length) return { percent: 100, stage: 'Complete' };
    if (submitted === active.length) return { percent: 80, stage: 'Submitted' };
    if (withPO === active.length) return { percent: 60, stage: 'PO Assigned' };
    if (withPO > 0) return { percent: 40, stage: 'PO In Progress' };
    return { percent: 20, stage: 'Indent / PO Pending' };
  };

  const hasUnsavedChanges = (orderId: string) => {
    const orderItems = batchItems[orderId]?.items || [];
    return orderItems.some((item: any) => draftData[item.itemId] && Object.keys(draftData[item.itemId]).length > 0);
  };

  const getReviewState = (orderId: string) => {
    const data = batchItems[orderId];
    if (!data) return 'Loading...';
    const items: any[] = data.items || [];
    if (items.length === 0) return 'No Items';
    const locked = items.filter((i: any) => i.isLocked).length;
    if (locked === items.length) return 'Final Submitted';
    const submitted = items.filter((i: any) => i.submissionCount > 0).length;
    if (submitted > 0) return 'Partially Submitted';
    if (Object.keys(draftData).length > 0) return 'Saved in Draft';
    return 'New';
  };

  const getOrderStats = (orderId: string) => {
    const data = batchItems[orderId];
    if (!data) return null;
    const items: any[] = data.items || [];
    const active = items.filter((i: any) => !i.isCancelled);
    const cancelled = items.filter((i: any) => i.isCancelled).length;
    let totalCarton = 0, totalAutoCbm = 0, totalNetWt = 0, totalGrossWt = 0;
    active.forEach((item: any) => {
      const qty = Number(draftData[item.itemId]?.reviewQuantity ?? item.reviewData?.reviewQuantity ?? item.quantity ?? 0);
      const unitCbm = Number(draftData[item.itemId]?.reviewCbmPerCtn ?? item.reviewData?.reviewCbmPerCtn ?? item.cbmPerBox ?? 0);
      const unitWt = Number(item.weight || 0);
      totalCarton += qty;
      totalAutoCbm += qty * unitCbm;
      totalNetWt += qty * unitWt;
      totalGrossWt += qty * unitWt + (item.categoryName ? 2 : 0);
    });
    return { cartonQuantity: totalCarton, autoCbm: totalAutoCbm.toFixed(3), netWeight: totalNetWt.toFixed(0), grossWeight: totalGrossWt.toFixed(0), tasksAssigned: 0, cancelledItems: cancelled };
  };

  const getItemProgress = (item: any) => {
    if (item.isCancelled) return 0;
    if (item.isLocked) return 100;
    let p = 0;
    if (item.reviewData?.reviewQuantity || draftData[item.itemId]?.reviewQuantity) p += 20;
    if (item.reviewData?.poNumber || draftData[item.itemId]?.poNumber) p += 20;
    if (item.reviewData?.indentDate || draftData[item.itemId]?.indentDate) p += 20;
    if (item.submissionCount > 0) p += 20;
    if (item.reviewData?.expectedDeliveryDate || draftData[item.itemId]?.expectedDeliveryDate) p += 20;
    return p;
  };

  const filterItems = (items: any[], orderId: string) => {
    const q = (itemFilter[orderId] || '').toLowerCase();
    if (!q) return items;
    return items.filter((i: any) =>
      i.productName?.toLowerCase().includes(q) ||
      i.productCode?.toLowerCase().includes(q) ||
      i.categoryName?.toLowerCase().includes(q)
    );
  };

  const overallProgress = useMemo(() => {
    if (!reviewOpen || selectedOrderIds.length === 0) return { percent: 0, stage: '' };
    const progresses = selectedOrderIds.map(getOrderProgress);
    const avg = Math.round(progresses.reduce((s, p) => s + p.percent, 0) / progresses.length);
    const stages = [...new Set(progresses.map(p => p.stage))];
    return { percent: avg, stage: stages.length === 1 ? stages[0] : `${stages[0]} +` };
  }, [reviewOpen, selectedOrderIds, batchItems, draftData]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <WorkspacePageHeader title={<>Order Review & Dispatch Planning</>} description="Review sales orders, fill dispatch data, and submit for processing">
        {reviewOpen && (
          <Button variant="outline" onClick={backToSelection}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Selection
          </Button>
        )}
      </WorkspacePageHeader>

      {!reviewOpen ? (
        /* ──── ORDER SELECTION ──── */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Select Orders
              </CardTitle>
              <span className="text-sm text-primary font-medium">
                {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Order ID, Party Name or Sales Person..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Selected chips */}
            {selectedOrderIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedOrders.map((order: any) => (
                  <Badge
                    key={order.orderId}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20"
                  >
                    {order.orderNumber}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleOrder(order.orderId); }}
                      className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Order list */}
            <div className="border rounded-lg max-h-[400px] overflow-y-auto divide-y">
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No orders found</div>
              ) : (
                filteredOrders.map((order: any) => {
                  const isSelected = selectedOrderIds.includes(order.orderId);
                  return (
                    <div
                      key={order.orderId}
                      onClick={() => toggleOrder(order.orderId)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border-2 flex-shrink-0',
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{order.orderNumber}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {order.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.customerName} &middot; {formatDate(order.orderDate)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                        <div>{order.salesPersonName || '-'}</div>
                        <div className="text-[10px]">Sales Person</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Open Selected button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={openSelected}
                disabled={selectedOrderIds.length === 0}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                OPEN SELECTED &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ──── REVIEW PANEL ──── */
        <>
          {/* Combined header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-amber-500 text-white border-0">Attention Required</Badge>
                  <span className="text-slate-400 text-xs">
                    Synced {new Date().toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mt-2">
                  {selectedOrderIds.length} Order{selectedOrderIds.length !== 1 ? 's' : ''} Selected
                </h2>
                <p className="text-slate-300 text-sm">
                  {selectedOrders.map((o: any) => o.customerName).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')}
                </p>
              </div>
              {/* Order Progress */}
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">Order Progress</div>
                <div className="text-3xl font-bold">{overallProgress.percent}%</div>
                <div className="w-32 bg-slate-700 rounded-full h-2 mt-1 ml-auto">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${overallProgress.percent}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{overallProgress.stage}</div>
              </div>
            </div>

            {/* Order details grid */}
            <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Order Date</div>
                <div className="text-sm font-medium mt-0.5">
                  {selectedOrders.length > 1
                    ? 'Multiple'
                    : formatDate(selectedOrders[0]?.orderDate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Buyer Code</div>
                <div className="text-sm font-medium mt-0.5">{selectedOrders[0]?.customerCode || selectedOrders[0]?.buyerCode || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Buyer Name</div>
                <div className="text-sm font-medium mt-0.5">{selectedOrders[0]?.customerName || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Sales Person</div>
                <div className="text-sm font-medium mt-0.5">{selectedOrders[0]?.salesPersonName || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Purchase Person</div>
                <div className="text-sm font-medium mt-0.5">
                  {(() => {
                    const firstOrderItems = batchItems[selectedOrderIds[0]]?.items;
                    if (!firstOrderItems?.length) return '-';
                    const names = [...new Set(firstOrderItems.map((i: any) => i.purchasePersonName).filter(Boolean))];
                    return names.length > 0 ? names.join(', ') : '-';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ──── ORDER SUMMARY GROUP ──── */}
          {lifecycle?.summary && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-600 border-l-4 border-emerald-600 pl-2">
                      Order Summary Group
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    Group / Ungroup
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Total Products', value: lifecycle.summary.totalProducts ?? 0, editable: false },
                    { label: 'Total Carton', value: lifecycle.summary.totalCarton ?? 0, editable: true },
                    { label: 'Total Auto CBM', value: lifecycle.summary.totalAutoCbm != null ? Number(lifecycle.summary.totalAutoCbm).toFixed(3) : '0.000', editable: false },
                    { label: 'Total Net Weight', value: lifecycle.summary.totalNetWeight != null ? Number(lifecycle.summary.totalNetWeight).toFixed(2) : '0.00', editable: false },
                    { label: 'Gross Weight', value: lifecycle.summary.grossWeight != null ? Number(lifecycle.summary.grossWeight).toFixed(2) : '0.00', editable: false },
                    { label: 'Units Produced', value: lifecycle.summary.unitsProduced ?? 0, editable: false },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border rounded-lg p-3 text-center"
                      style={stat.editable ? { backgroundColor: EDITABLE_BG } : undefined}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                        {stat.label}
                      </div>
                      <div className="text-xl font-bold">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ──── ORDER LIFECYCLE JOURNEY ──── */}
          {lifecycle?.stages && lifecycle.stages.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-violet-600 border-l-4 border-violet-600 pl-2">
                    Order Lifecycle Journey
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pipeline stages */}
                <div className="flex items-stretch gap-0 overflow-x-auto">
                  {lifecycle.stages.map((stage: any, idx: number) => (
                    <div key={stage.name} className="flex items-stretch flex-1 min-w-[140px]">
                      <div
                        className={cn(
                          'flex-1 border rounded-lg p-3 text-center relative',
                          stage.status === 'Complete'
                            ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700'
                            : 'bg-muted/30 border-border'
                        )}
                      >
                        <div className="text-xs font-bold mb-1">{stage.name}</div>
                        <Badge
                          variant={stage.status === 'Complete' ? 'default' : 'destructive'}
                          className={cn(
                            'text-[10px] px-2 py-0',
                            stage.status === 'Complete'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-red-500 hover:bg-red-600'
                          )}
                        >
                          {stage.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{stage.detail || '-'}</div>
                      </div>
                      {idx < lifecycle.stages.length - 1 && (
                        <div className="flex items-center px-1 text-muted-foreground text-lg font-bold select-none">
                          &rarr;
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Total Stages</div>
                    <div className="text-lg font-bold">{lifecycle.totalStages}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Completed</div>
                    <div className="text-lg font-bold text-emerald-600">{lifecycle.completedStages}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Remaining</div>
                    <div className="text-lg font-bold text-amber-600">{lifecycle.remainingStages}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Started Date</div>
                    <div className="text-sm font-medium">{lifecycle.startedDate ? formatDate(lifecycle.startedDate) : '-'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Order Scope</div>
                    <div className="text-sm font-medium">{lifecycle.orderScope || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order-level planning — Final Dispatch */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600 border-l-4 border-blue-600 pl-2">
                  Order-Level Planning
                </div>
              </div>
              <CardTitle className="text-lg">Final Dispatch</CardTitle>
              <p className="text-sm text-muted-foreground">
                Final target date and remark for each selected Order.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedOrders.map((order: any) => (
                <div key={order.orderId} className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        ORDER {order.orderNumber} &middot;{' '}
                        <span className="text-muted-foreground font-normal">ITEM-WISE REVIEW TRACKING</span>
                      </div>
                      <div className="flex items-center gap-6 mt-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                            Final Dispatch Date
                          </span>
                          <Input
                            type="date"
                            className="h-8 w-44"
                            value={finalDispatchDates[order.orderId] || ''}
                            onChange={e => setFinalDispatchDates(prev => ({
                              ...prev, [order.orderId]: e.target.value,
                            }))}
                          />
                          {!finalDispatchDates[order.orderId] && (
                            <span className="text-xs text-red-500 mt-0.5 block">Date not set</span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                            Gross Weight
                          </span>
                          <Select
                            value={grossWeights[order.orderId] || '3000'}
                            onValueChange={val => setGrossWeights(prev => ({
                              ...prev, [order.orderId]: val,
                            }))}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3000">3,000 kg</SelectItem>
                              <SelectItem value="5000">5,000 kg</SelectItem>
                              <SelectItem value="10000">10,000 kg</SelectItem>
                              <SelectItem value="15000">15,000 kg</SelectItem>
                              <SelectItem value="20000">20,000 kg</SelectItem>
                              <SelectItem value="25000">25,000 kg</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="bg-teal-700 hover:bg-teal-800 text-white flex-shrink-0"
                      onClick={() => saveDraftMutation.mutate(order.orderId)}
                      disabled={saveDraftMutation.isPending}
                    >
                      Update Final Dispatch
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Item-wise review tables per order */}
          {batchLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading items for {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''}...
              </CardContent>
            </Card>
          ) : (
            selectedOrders.map((order: any) => {
              const orderData = batchItems[order.orderId] || { items: [], closure: null };
              const isClosed = orderData.closure?.status === 'closed';

              const stats = getOrderStats(order.orderId);
              const reviewState = getReviewState(order.orderId);
              const dirty = hasUnsavedChanges(order.orderId);
              const visibleItems = filterItems(orderData.items, order.orderId);

              return (
                <Card key={order.orderId}>
                  <CardHeader className="pb-3 space-y-3">
                    {/* Title row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Item Wise Details</CardTitle>
                        <Badge variant={dirty ? 'destructive' : 'secondary'} className="text-xs">
                          {dirty ? 'Unsaved changes' : 'No unsaved changes'}
                        </Badge>
                        {isClosed && <Badge variant="destructive">CLOSED</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter product, SKU, buyer..."
                            className="pl-8 h-8 w-56 text-xs"
                            value={itemFilter[order.orderId] || ''}
                            onChange={e => setItemFilter(prev => ({ ...prev, [order.orderId]: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Summary stats row */}
                    {stats && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 border-t">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Carton Quantity</div>
                          <div className="text-lg font-bold">{stats.cartonQuantity.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Auto CBM</div>
                          <div className="text-lg font-bold">{stats.autoCbm}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Net Weight</div>
                          <div className="text-lg font-bold">{Number(stats.netWeight).toLocaleString()} kg</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Gross Weight</div>
                          <div className="text-lg font-bold">{Number(stats.grossWeight).toLocaleString()} kg</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Tasks Assigned</div>
                          <div className="text-lg font-bold">{stats.tasksAssigned}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Cancelled Items</div>
                          <div className="text-lg font-bold">{stats.cancelledItems}</div>
                        </div>
                      </div>
                    )}

                    {/* Review state + order info + actions */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Review State</span>
                          <div className="text-sm font-semibold">{reviewState}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.orderNumber} &mdash; {order.customerName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveDraftMutation.mutate(order.orderId)}
                          disabled={saveDraftMutation.isPending || isClosed}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save Draft
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const submittable = orderData.items
                              .filter((i: any) => !i.isCancelled && !i.isLocked)
                              .map((i: any) => i.itemId);
                            if (submittable.length === 0) {
                              toast.error('No items available for submission');
                              return;
                            }
                            submitMutation.mutate({ orderId: order.orderId, itemIds: submittable });
                          }}
                          disabled={submitMutation.isPending || isClosed}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Final Submit
                        </Button>
                        {isClosed ? (
                          <Button size="sm" variant="outline" onClick={() => reopenOrderMutation.mutate(order.orderId)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => closeOrderMutation.mutate(order.orderId)}>
                            <Ban className="h-3 w-3 mr-1" /> Close Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-[10px] uppercase tracking-wider">
                            <TableHead className="whitespace-nowrap">Product / Description</TableHead>
                            <TableHead className="whitespace-nowrap">UOM</TableHead>
                            <TableHead className="whitespace-nowrap">Purchaser</TableHead>
                            <TableHead className="whitespace-nowrap" style={{ backgroundColor: EDITABLE_BG }}>Review Carton</TableHead>
                            <TableHead className="whitespace-nowrap" style={{ backgroundColor: EDITABLE_BG }}>CBM Per CTN</TableHead>
                            <TableHead className="whitespace-nowrap">Total Net CBM</TableHead>
                            <TableHead className="whitespace-nowrap">Net Weight</TableHead>
                            <TableHead className="whitespace-nowrap">Stock</TableHead>
                            <TableHead className="whitespace-nowrap">Packing Material</TableHead>
                            <TableHead className="whitespace-nowrap">Labels</TableHead>
                            <TableHead className="whitespace-nowrap">Production</TableHead>
                            <TableHead className="whitespace-nowrap">Location</TableHead>
                            <TableHead className="whitespace-nowrap">Type of Transfer</TableHead>
                            <TableHead className="whitespace-nowrap">Transfer Details</TableHead>
                            <TableHead className="whitespace-nowrap">Task Assignment</TableHead>
                            <TableHead className="whitespace-nowrap">Remark</TableHead>
                            <TableHead className="whitespace-nowrap">Progress</TableHead>
                            <TableHead className="whitespace-nowrap">Inspect</TableHead>
                            <TableHead className="whitespace-nowrap">Cancel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleItems.map((item: any) => {
                            const isEditable = !item.isCancelled && !item.isLocked && !isClosed;
                            const qty = Number(getFieldValue(item, 'reviewQuantity') || item.quantity || 0);
                            const unitCbm = Number(getFieldValue(item, 'reviewCbmPerCtn') || item.cbmPerBox || 0);
                            const totalNetCbm = qty && unitCbm ? (qty * unitCbm).toFixed(3) : '-';
                            const unitWt = Number(item.weight || 0);
                            const netWt = qty && unitWt ? (qty * unitWt).toFixed(0) : '-';
                            const progress = getItemProgress(item);

                            return (
                              <TableRow
                                key={item.itemId}
                                className={item.isCancelled ? 'opacity-40 line-through' : ''}
                              >
                                {/* Product / Description */}
                                <TableCell className="min-w-[200px]">
                                  <div className="font-medium text-sm">{item.productName}</div>
                                  <div className="text-[10px] text-muted-foreground">{item.productCode}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Item Review {item.submissionCount || 0}/2 &middot; {item.isLocked ? 'completed' : '0 completed'}
                                  </div>
                                  {item.categoryName && (
                                    <div className="text-[10px] text-blue-600">Packing: {item.categoryName}</div>
                                  )}
                                </TableCell>

                                {/* UOM */}
                                <TableCell className="text-xs whitespace-nowrap">
                                  {item.uom || item.unit || '-'}
                                </TableCell>

                                {/* Purchaser */}
                                <TableCell className="text-xs whitespace-nowrap">
                                  {item.purchasePersonName || '-'}
                                </TableCell>

                                {/* Review Carton (editable) */}
                                <TableCell style={{ backgroundColor: isEditable ? EDITABLE_BG : undefined }}>
                                  {isEditable ? (
                                    <div>
                                      <Input
                                        type="number"
                                        className="h-7 w-20 text-xs"
                                        value={getFieldValue(item, 'reviewQuantity') || item.quantity || ''}
                                        onChange={e => updateDraftField(item.itemId, 'reviewQuantity', Number(e.target.value))}
                                      />
                                      <div className="text-[10px] text-muted-foreground mt-0.5">Original Qty: {item.quantity}</div>
                                    </div>
                                  ) : (
                                    <div>
                                      <span>{getFieldValue(item, 'reviewQuantity') || item.quantity || '-'}</span>
                                      <div className="text-[10px] text-muted-foreground">Original Qty: {item.quantity}</div>
                                    </div>
                                  )}
                                </TableCell>

                                {/* CBM Per CTN (editable) */}
                                <TableCell style={{ backgroundColor: isEditable ? EDITABLE_BG : undefined }}>
                                  {isEditable ? (
                                    <div>
                                      <Input
                                        type="number"
                                        step="0.0001"
                                        className="h-7 w-24 text-xs"
                                        value={getFieldValue(item, 'reviewCbmPerCtn') || item.cbmPerBox || ''}
                                        onChange={e => updateDraftField(item.itemId, 'reviewCbmPerCtn', Number(e.target.value))}
                                      />
                                      <div className="text-[10px] text-muted-foreground mt-0.5">Original: {item.cbmPerBox ?? '-'}</div>
                                    </div>
                                  ) : (
                                    <div>
                                      <span>{getFieldValue(item, 'reviewCbmPerCtn') || (item.cbmPerBox ?? '-')}</span>
                                      <div className="text-[10px] text-muted-foreground">Original: {item.cbmPerBox ?? '-'}</div>
                                    </div>
                                  )}
                                </TableCell>

                                {/* Total Net CBM */}
                                <TableCell className="text-xs">
                                  <div>{totalNetCbm}</div>
                                  <div className="text-[10px] text-muted-foreground">Carton &times; CBM Per CTN</div>
                                </TableCell>

                                {/* Net Weight */}
                                <TableCell>
                                  {netWt !== '-' ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs whitespace-nowrap">
                                      {Number(netWt).toLocaleString()} kg
                                    </Badge>
                                  ) : '-'}
                                </TableCell>

                                {/* Stock */}
                                <TableCell className="text-center">
                                  {(() => {
                                    const sd = draftData[item.itemId]?.stages?.stock || item.reviewData?.stages?.stock;
                                    const hasData = sd?.na || sd?.targetDate || sd?.remark;
                                    return (
                                      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => openStageModal('stock', item, order.orderId)}>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 accent-emerald-600"
                                            checked={sd?.done || false}
                                            disabled={sd?.na}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                              const existing = draftData[item.itemId] || {};
                                              const stages = existing.stages || item.reviewData?.stages || {};
                                              updateDraftField(item.itemId, 'stages', { ...stages, stock: { ...(stages.stock || {}), done: e.target.checked } });
                                            }}
                                          />
                                          {hasData ? (
                                            <Badge
                                              variant="outline"
                                              className={cn('text-[10px] whitespace-nowrap', sd?.na
                                                ? 'bg-slate-100 text-slate-500 border-slate-300'
                                                : sd?.done
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}
                                            >
                                              {sd?.na ? 'N/A' : sd?.done ? `Done${sd?.targetDate ? ' · ' + sd.targetDate : ''}` : sd?.targetDate || ''}
                                            </Badge>
                                          ) : (
                                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); openStageModal('stock', item, order.orderId); }}>Details</Button>
                                          )}
                                        </div>
                                        {hasData && !sd?.na && sd?.remark && <div className="text-[10px] text-muted-foreground">{sd.remark}</div>}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Packing Material */}
                                <TableCell className="text-center">
                                  {(() => {
                                    const sd = draftData[item.itemId]?.stages?.packing || item.reviewData?.stages?.packing;
                                    const hasData = sd?.na || sd?.targetDate || sd?.remark;
                                    return (
                                      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => openStageModal('packing', item, order.orderId)}>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 accent-emerald-600"
                                            checked={sd?.done || false}
                                            disabled={sd?.na}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                              const existing = draftData[item.itemId] || {};
                                              const stages = existing.stages || item.reviewData?.stages || {};
                                              updateDraftField(item.itemId, 'stages', { ...stages, packing: { ...(stages.packing || {}), done: e.target.checked } });
                                            }}
                                          />
                                          {hasData ? (
                                            <Badge
                                              variant="outline"
                                              className={cn('text-[10px] whitespace-nowrap', sd?.na
                                                ? 'bg-slate-100 text-slate-500 border-slate-300'
                                                : sd?.done
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}
                                            >
                                              {sd?.na ? 'N/A' : sd?.done ? `Done${sd?.targetDate ? ' · ' + sd.targetDate : ''}` : sd?.targetDate || ''}
                                            </Badge>
                                          ) : (
                                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); openStageModal('packing', item, order.orderId); }}>Details</Button>
                                          )}
                                        </div>
                                        {hasData && !sd?.na && sd?.remark && <div className="text-[10px] text-muted-foreground">{sd.remark}</div>}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Labels */}
                                <TableCell className="text-center">
                                  {(() => {
                                    const sd = draftData[item.itemId]?.stages?.labels || item.reviewData?.stages?.labels;
                                    const hasData = sd?.na || sd?.targetDate || sd?.remark;
                                    return (
                                      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => openStageModal('labels', item, order.orderId)}>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 accent-emerald-600"
                                            checked={sd?.done || false}
                                            disabled={sd?.na}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                              const existing = draftData[item.itemId] || {};
                                              const stages = existing.stages || item.reviewData?.stages || {};
                                              updateDraftField(item.itemId, 'stages', { ...stages, labels: { ...(stages.labels || {}), done: e.target.checked } });
                                            }}
                                          />
                                          {hasData ? (
                                            <Badge
                                              variant="outline"
                                              className={cn('text-[10px] whitespace-nowrap', sd?.na
                                                ? 'bg-slate-100 text-slate-500 border-slate-300'
                                                : sd?.done
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}
                                            >
                                              {sd?.na ? 'N/A' : sd?.done ? `Done${sd?.targetDate ? ' · ' + sd.targetDate : ''}` : sd?.targetDate || ''}
                                            </Badge>
                                          ) : (
                                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); openStageModal('labels', item, order.orderId); }}>Details</Button>
                                          )}
                                        </div>
                                        {hasData && !sd?.na && sd?.remark && <div className="text-[10px] text-muted-foreground">{sd.remark}</div>}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Production (right side) */}
                                <TableCell className="text-center">
                                  {(() => {
                                    const sd = draftData[item.itemId]?.stages?.production || item.reviewData?.stages?.production;
                                    const hasData = sd?.na || sd?.targetDate || sd?.remark;
                                    return (
                                      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => openStageModal('production', item, order.orderId)}>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 accent-emerald-600"
                                            checked={sd?.done || false}
                                            disabled={sd?.na}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                              const existing = draftData[item.itemId] || {};
                                              const stages = existing.stages || item.reviewData?.stages || {};
                                              updateDraftField(item.itemId, 'stages', { ...stages, production: { ...(stages.production || {}), done: e.target.checked } });
                                            }}
                                          />
                                          {hasData ? (
                                            <Badge
                                              variant="outline"
                                              className={cn('text-[10px] whitespace-nowrap', sd?.na
                                                ? 'bg-slate-100 text-slate-500 border-slate-300'
                                                : sd?.done
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}
                                            >
                                              {sd?.na ? 'N/A' : sd?.done ? `Done${sd?.targetDate ? ' · ' + sd.targetDate : ''}` : sd?.targetDate || ''}
                                            </Badge>
                                          ) : (
                                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); openStageModal('production', item, order.orderId); }}>Details</Button>
                                          )}
                                        </div>
                                        {hasData && !sd?.na && sd?.remark && <div className="text-[10px] text-muted-foreground">{sd.remark}</div>}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Location */}
                                <TableCell className="text-xs">&mdash;</TableCell>

                                {/* Type of Transfer */}
                                <TableCell>
                                  <Select defaultValue="none">
                                    <SelectTrigger className="h-7 w-28 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Transfer</SelectItem>
                                      <SelectItem value="internal">Internal</SelectItem>
                                      <SelectItem value="external">External</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>

                                {/* Transfer Details */}
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">Select transfer type</TableCell>

                                {/* Task Assignment */}
                                <TableCell>
                                  {(() => {
                                    const tasks = draftData[item.itemId]?.tasks || item.reviewData?.tasks || [];
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 whitespace-nowrap text-blue-600" onClick={() => openTaskModal(item, order.orderId)}>
                                          + Add Task
                                        </Button>
                                        {tasks.length > 0 && (
                                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                            {tasks.length} task{tasks.length > 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Remark */}
                                <TableCell>
                                  {(() => {
                                    const remark = draftData[item.itemId]?.itemRemark || item.reviewData?.itemRemark || '';
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 whitespace-nowrap text-orange-600" onClick={() => openRemarkModal(item, order.orderId)}>
                                          {remark ? 'Edit Remark' : '+ Add Remark'}
                                        </Button>
                                        {remark && (
                                          <div className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={remark}>{remark}</div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </TableCell>

                                {/* Progress */}
                                <TableCell className="text-xs font-medium text-center">{progress}%</TableCell>

                                {/* Inspect */}
                                <TableCell>
                                  <Button variant="link" size="sm" className="h-6 text-[10px] px-1">Inspect</Button>
                                </TableCell>

                                {/* Cancel */}
                                <TableCell>
                                  {isEditable ? (
                                    <Select
                                      onValueChange={(val) => {
                                        if (val === 'cancel') {
                                          setCancelItemId(item.itemId);
                                          setCancelOrderId(order.orderId);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-7 w-24 text-xs">
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="cancel">Cancel</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    item.isCancelled ? (
                                      <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
                                    ) : item.isLocked ? (
                                      <Badge variant="secondary" className="text-[10px]"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                                    ) : '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </>
      )}

      {/* Stage update modal */}
      {stageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[440px] max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Update {{ stock: 'Stock', packing: 'Packing Material', labels: 'Labels', production: 'Production' }[stageModal.type] || stageModal.type}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stageModal.item.productName} &bull; Date frozen; apply changes, then Save Draft
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setStageModal(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Mark as N/A — hidden for stock and production */}
              {stageModal.type !== 'production' && stageModal.type !== 'stock' && (
              <div>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer" style={{ backgroundColor: '#fcfeff', border: '1px solid #fcfeff' }}>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={stageForm.na}
                    onChange={e => setStageForm(prev => ({ ...prev, na: e.target.checked, done: e.target.checked ? false : prev.done }))}
                  />
                  <span className="font-semibold text-slate-700">Mark as N/A</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-1">N/A does not require a person, target date, status or remark.</p>
              </div>
              )}

              {/* Mark as Done */}
              <label className={cn('flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer', stageForm.na ? 'opacity-40 pointer-events-none' : '')} style={{ backgroundColor: '#fcfeff', border: '1px solid #fcfeff' }}>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={stageForm.done}
                  disabled={stageForm.na}
                  onChange={e => setStageForm(prev => ({ ...prev, done: e.target.checked }))}
                />
                <span className="font-semibold text-emerald-800">Mark as Done</span>
              </label>

              {/* Person */}
              <div className={cn('space-y-1.5', stageForm.na ? 'opacity-40 pointer-events-none' : '')}>
                <label className="text-sm font-semibold">{{ stock: 'Purchase Person', packing: 'Purchase Person', labels: 'Purchase Person', production: 'Production Person' }[stageModal.type] || 'Purchase Person'} <span className="text-red-500">*</span></label>
                <Select
                  value={stageForm.purchasePerson}
                  onValueChange={val => setStageForm(prev => ({ ...prev, purchasePerson: val }))}
                  disabled={stageForm.na}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${{ stock: 'purchase', packing: 'purchase', labels: 'purchase', production: 'production' }[stageModal.type] || 'purchase'} person`} />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList.map((u: any) => (
                      <SelectItem key={u.userId} value={u.name || u.email}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Names are loaded from Setting &rarr; {{ stock: 'Purchase', packing: 'Purchase', labels: 'Purchase', production: 'Production' }[stageModal.type] || 'Purchase'}.</p>
              </div>

              {/* Target Date */}
              <div className={cn('space-y-1.5', stageForm.na ? 'opacity-40 pointer-events-none' : '')}>
                <label className="text-sm font-semibold">Target Date <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={stageForm.targetDate}
                  disabled={stageForm.na}
                  onChange={e => setStageForm(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>

              {/* Remark */}
              <div className={cn('space-y-1.5', stageForm.na ? 'opacity-40 pointer-events-none' : '')}>
                <label className="text-sm font-semibold">Remark</label>
                <Textarea
                  rows={3}
                  value={stageForm.remark}
                  disabled={stageForm.na}
                  onChange={e => setStageForm(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="Add work details or remark..."
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setStageModal(null)}>Cancel</Button>
              <Button onClick={saveStage} disabled={!stageForm.na && (!stageForm.purchasePerson || !stageForm.targetDate)}>
                Save Stage
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Item Remark modal */}
      {remarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[480px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-600 tracking-wide uppercase">Item Remark</p>
                  <CardTitle className="text-lg mt-1">{remarkModal.item.productName}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setRemarkModal(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Remark</label>
                <Textarea
                  rows={6}
                  value={remarkText}
                  onChange={e => setRemarkText(e.target.value)}
                  placeholder="Add remark..."
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setRemarkModal(null)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={saveRemark}>
                Save Remark
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Task Assignment / Action Plan modal */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[520px] max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 tracking-wide uppercase">Action Plan</p>
                  <CardTitle className="text-lg mt-1">{taskModal.item.productName}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTaskModal(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              {/* Task / Action Required */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Task / Action Required <span className="text-red-500">*</span></label>
                <Textarea
                  rows={4}
                  value={taskForm.action}
                  onChange={e => setTaskForm(prev => ({ ...prev, action: e.target.value }))}
                  placeholder="What specific action needs to be completed?"
                />
              </div>

              {/* Priority + Target Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Priority</label>
                  <Select value={taskForm.priority} onValueChange={val => setTaskForm(prev => ({ ...prev, priority: val }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Target Due Date <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={taskForm.targetDate}
                    onChange={e => setTaskForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Select a target date to assign this task.</p>
                </div>
              </div>

              {/* Department Assignees */}
              <div className="border rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wide text-slate-700">Department Assignees</label>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-600 h-auto p-0 text-xs"
                    onClick={() => setTaskForm(prev => ({ ...prev, assignees: [...prev.assignees, { departmentId: '', userId: '' }] }))}
                  >
                    + Add Person
                  </Button>
                </div>
                <div className="h-px bg-slate-200" />
                {taskForm.assignees.map((assignee, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={assignee.departmentId}
                      onValueChange={val => {
                        const updated = [...taskForm.assignees];
                        updated[idx] = { departmentId: val, userId: '' };
                        setTaskForm(prev => ({ ...prev, assignees: updated }));
                      }}
                    >
                      <SelectTrigger className="h-9 flex-1 bg-white">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsList.map((d: any) => (
                          <SelectItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={assignee.userId}
                      onValueChange={val => {
                        const updated = [...taskForm.assignees];
                        updated[idx] = { ...updated[idx], userId: val };
                        setTaskForm(prev => ({ ...prev, assignees: updated }));
                      }}
                    >
                      <SelectTrigger className="h-9 flex-1 bg-white">
                        <SelectValue placeholder="Select person..." />
                      </SelectTrigger>
                      <SelectContent>
                        {usersList.map((u: any) => (
                          <SelectItem key={u.userId} value={u.userId}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (taskForm.assignees.length <= 1) return;
                        const updated = taskForm.assignees.filter((_, i) => i !== idx);
                        setTaskForm(prev => ({ ...prev, assignees: updated }));
                      }}
                      disabled={taskForm.assignees.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setTaskModal(null)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={saveTask}
                disabled={!taskForm.action || !taskForm.targetDate}
              >
                Apply Task
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel dialog */}
      {cancelItemId && cancelOrderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Cancel Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Cancellation reason..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setCancelItemId(null); setCancelOrderId(null); setCancelReason(''); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cancelMutation.mutate({ orderId: cancelOrderId!, itemId: cancelItemId!, reason: cancelReason })}
                  disabled={!cancelReason}
                >
                  Confirm Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
