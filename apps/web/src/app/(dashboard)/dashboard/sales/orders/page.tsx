'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Ban,
  CheckCircle,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
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
import { salesOrderApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'purchase_in_progress', label: 'Purchase In Progress' },
  { value: 'purchase_completed', label: 'Purchase Completed' },
  { value: 'partially_shipped', label: 'Partially Shipped' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'accountant_review', label: 'Accountant Review' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'cancelled', label: 'Cancelled' },
];

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Order Draft', icon: FileText },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'purchase', label: 'Purchase', icon: ShoppingCart },
  { key: 'dispatch', label: 'Dispatch', icon: Truck },
  { key: 'accountant', label: 'Accountant', icon: ClipboardList },
  { key: 'invoice', label: 'Invoice', icon: Receipt },
];

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(status?: string | null) {
  return status ? status.replace(/_/g, ' ') : '-';
}

function getOrderRows(response: any) {
  return response?.data?.data || [];
}

function getCurrentStep(status?: string) {
  if (status === 'draft') return 'draft';
  if (status === 'confirmed') return 'confirmed';
  if (status === 'purchase_in_progress' || status === 'purchase_completed') return 'purchase';
  if (status === 'partially_shipped' || status === 'shipped' || status === 'delivered') return 'dispatch';
  if (status === 'accountant_review' || status === 'accountant_approved') return 'accountant';
  if (status === 'invoiced' || status === 'closed') return 'invoice';
  return 'draft';
}

function lineMetrics(item: any) {
  const quantity = toNumber(item.quantity);
  const shipped = toNumber(item.shippedQuantity);
  const invoiced = toNumber(item.invoicedQuantity);
  const unitsPerCase = toNumber(item.unitsPerCase || item.unitPerCarton) || 1;
  const cbmPerBox = toNumber(item.cbmPerBox);
  const gstRate = toNumber(item.gstRate);
  const landingRate = toNumber(item.buyingBestLandingRate ?? item.landingCost ?? item.unitPrice);
  const cartons = Math.ceil(quantity / unitsPerCase);
  const gstCost = toNumber(item.gstCost) || landingRate * gstRate / 100;
  const rateWithGst = toNumber(item.rateWithGstCost) || (landingRate + gstCost) * unitsPerCase;
  const finalRate = toNumber(item.finalRate || item.finalPriceInForeignCurrency || item.unitPrice);

  return {
    quantity,
    shipped,
    invoiced,
    pendingDispatch: Math.max(quantity - shipped, 0),
    pendingInvoice: Math.max(shipped - invoiced, 0),
    unitsPerCase,
    cartons,
    cbm: cartons * cbmPerBox,
    landingRate,
    gstCost,
    rateWithGst,
    finalRate,
  };
}

function buildDeliveryNotePayload(order: any) {
  const items = (order.items || [])
    .map((item: any) => {
      const metrics = lineMetrics(item);
      return {
        orderItemId: item.itemId,
        productName: item.productName,
        sku: item.sku,
        hsnCode: item.hsnCode,
        uomName: item.uomName,
        quantity: metrics.pendingDispatch,
      };
    })
    .filter((item: any) => item.quantity > 0);

  if (order.status === 'draft') {
    throw new Error('Confirm the sales order before creating a dispatch.');
  }
  if (!items.length) {
    throw new Error('No pending quantity is available for dispatch.');
  }

  return {
    orderId: order.orderId,
    noteDate: new Date(),
    transporterName: order.transporterName,
    notes: `Dispatch created from Sales Order to Dispatch Master for ${order.orderNumber}`,
    items,
  };
}

function buildInvoicePayload(order: any) {
  const items = (order.items || [])
    .map((item: any) => {
      const metrics = lineMetrics(item);
      return {
        orderItemId: item.itemId,
        productName: item.productName,
        productCode: item.productCode,
        sku: item.sku,
        hsnCode: item.hsnCode,
        uomName: item.uomName,
        quantity: metrics.pendingInvoice,
        unitPrice: toNumber(item.unitPrice || metrics.finalRate),
        discountPercent: toNumber(item.discountPercent),
        discountAmount: toNumber(item.discountAmount),
      };
    })
    .filter((item: any) => item.quantity > 0);

  if (!items.length) {
    throw new Error('No dispatched quantity is pending for invoice.');
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    orderId: order.orderId,
    invoiceDate: new Date(),
    dueDate,
    customerId: order.customerId,
    customerName: order.customerName,
    customerCode: order.customerCode,
    customerGstin: order.billingGstin,
    billingAddress: order.billingAddress,
    billingStateCode: order.billingStateCode,
    shippingAddress: order.shippingAddress,
    shippingStateCode: order.shippingStateCode,
    freightAmount: toNumber(order.freightAmount),
    packingAmount: toNumber(order.packingAmount),
    insuranceAmount: toNumber(order.insuranceAmount),
    otherCharges: toNumber(order.otherCharges),
    notes: `Invoice created from Sales Order to Dispatch Master for ${order.orderNumber}`,
    items,
  };
}

export default function SalesOrderDispatchMasterPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['sales-orders-workflow', { page, search, status }],
    queryFn: () =>
      salesOrderApi.getOrders({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }),
  });

  const statsQuery = useQuery({
    queryKey: ['sales-orders-stats'],
    queryFn: () => salesOrderApi.getStats(),
  });

  const selectedOrderQuery = useQuery({
    queryKey: ['sales-order-dispatch-master-detail', selectedOrderId],
    queryFn: () => salesOrderApi.getOrder(selectedOrderId as string),
    enabled: Boolean(selectedOrderId),
  });

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-orders-workflow'] });
    queryClient.invalidateQueries({ queryKey: ['sales-orders-stats'] });
    queryClient.invalidateQueries({ queryKey: ['sales-order-dispatch-master-detail'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-notes-workflow'] });
    queryClient.invalidateQueries({ queryKey: ['sales-invoices-workflow'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.confirmOrder(id),
    onSuccess: () => {
      toast.success('Sales order confirmed');
      invalidateOrders();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to confirm order'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.cancelOrder(id),
    onSuccess: () => {
      toast.success('Sales order cancelled');
      invalidateOrders();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to cancel order'),
  });

  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await salesOrderApi.getOrder(id);
      return salesOrderApi.createDeliveryNote(buildDeliveryNotePayload(response.data));
    },
    onSuccess: (response) => {
      toast.success(`Dispatch ${response.data?.noteNumber || ''} created`);
      invalidateOrders();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to create dispatch'),
  });

  const invoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await salesOrderApi.getOrder(id);
      return salesOrderApi.createInvoice(buildInvoicePayload(response.data));
    },
    onSuccess: (response) => {
      toast.success(`Invoice ${response.data?.invoiceNumber || ''} created`);
      invalidateOrders();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to create invoice'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, reQuotation }: { id: string; reQuotation?: boolean }) =>
      salesOrderApi.sendQuotationEmail(id, reQuotation),
    onSuccess: () => toast.success('Quotation email sent to customer'),
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to send email'),
  });

  const repunchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => salesOrderApi.repunchOrder(id, data),
    onSuccess: () => {
      toast.success('Sales order re-punched successfully');
      invalidateOrders();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to re-punch order'),
  });

  const generatePOsMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.generatePOs(id),
    onSuccess: (response) => {
      const pos = response.data || [];
      if (pos.length > 0) {
        toast.success(`${pos.length} Purchase Order(s) generated successfully`);
      } else {
        toast.success('Purchase orders already exist for this sales order');
      }
      invalidateOrders();
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to generate purchase orders'),
  });

  const handleExportExcel = async (orderId: string, orderNumber: string) => {
    try {
      const response = await salesOrderApi.exportExcel(orderId);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(orderNumber || orderId).replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to export Excel');
    }
  };

  const handleDownloadQuotationPdf = async (orderId: string, orderNumber: string) => {
    try {
      const response = await salesOrderApi.downloadQuotationPdf(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QUOTATION-${orderNumber || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Quotation PDF downloaded');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to download quotation PDF');
    }
  };

  const rows = getOrderRows(ordersQuery.data);
  const total = ordersQuery.data?.data?.total || 0;
  const totalPages = ordersQuery.data?.data?.totalPages || 1;
  const stats = statsQuery.data?.data;
  const selectedOrder = selectedOrderQuery.data?.data;

  const selectedTotals = useMemo(() => {
    const items = selectedOrder?.items || [];
    return items.reduce(
      (acc: any, item: any) => {
        const metrics = lineMetrics(item);
        acc.quantity += metrics.quantity;
        acc.shipped += metrics.shipped;
        acc.pendingDispatch += metrics.pendingDispatch;
        acc.pendingInvoice += metrics.pendingInvoice;
        acc.cbm += metrics.cbm;
        acc.value += toNumber(item.totalAmount);
        return acc;
      },
      { quantity: 0, shipped: 0, pendingDispatch: 0, pendingInvoice: 0, cbm: 0, value: 0 },
    );
  }, [selectedOrder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Order to Dispatch Master</h1>
          <p className="text-gray-500">Track confirmed orders through dispatch, invoice, costing, CBM, haulage, and final rates</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales">
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              Sales Enquiries
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/delivery-notes">
              <Truck className="mr-1.5 h-4 w-4" />
              Delivery Notes
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/invoices">
              <Receipt className="mr-1.5 h-4 w-4" />
              Invoices
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/sales/orders/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Sales Order
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search order, customer, or PO..."
                className="pl-10"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Status Stepper */}
      <Card>
        <CardContent className="pt-6">
          {(() => {
            const selectedOrder = selectedOrderQuery?.data?.data?.data || selectedOrderQuery?.data?.data;
            const activeStep = selectedOrder ? getCurrentStep(selectedOrder.status) : null;
            const activeStepIdx = activeStep ? WORKFLOW_STEPS.findIndex(s => s.key === activeStep) : -1;
            return (
              <div className="flex items-center overflow-x-auto pb-2 gap-2">
                {WORKFLOW_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = activeStepIdx >= 0 && index < activeStepIdx;
                  const isCurrent = activeStepIdx >= 0 && index === activeStepIdx;
                  let circleClass = 'bg-gray-200 text-gray-400';
                  let labelClass = 'text-gray-500';
                  let lineClass = 'bg-gray-200';
                  if (isCompleted) {
                    circleClass = 'bg-green-500 text-white';
                    labelClass = 'text-green-600 font-semibold';
                    lineClass = 'bg-green-500';
                  } else if (isCurrent) {
                    circleClass = 'bg-blue-500 text-white';
                    labelClass = 'text-blue-600 font-semibold';
                  }
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${circleClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs mt-2 whitespace-nowrap ${labelClass}`}>{step.label}</span>
                      </div>
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div className={`w-8 h-1 mx-1 rounded ${isCompleted ? lineClass : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Register</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-16 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : rows.length ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Sales Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>POL / POD</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((order: any) => {
                      const currentStep = getCurrentStep(order.status);
                      const isBusy =
                        confirmMutation.isPending ||
                        cancelMutation.isPending ||
                        dispatchMutation.isPending ||
                        invoiceMutation.isPending ||
                        generatePOsMutation.isPending;

                      return (
                        <TableRow
                          key={order.orderId}
                          className={selectedOrderId === order.orderId ? 'bg-sky-50' : 'hover:bg-slate-50'}
                        >
                          <TableCell>
                            <button
                              type="button"
                              className="text-left font-mono font-semibold text-slate-900 hover:text-primary-700"
                              onClick={() => setSelectedOrderId(order.orderId)}
                            >
                              {order.orderNumber}
                            </button>
                            <div className="mt-1 text-xs text-slate-500">{order.poNumber || order.enquiryId || 'No reference'}</div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{order.customerName || '-'}</TableCell>
                          <TableCell>{formatDate(order.orderDate || order.createdAt)}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {(order.portOfLoading || '-') + ' / ' + (order.portOfDischarge || '-')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {WORKFLOW_STEPS.map((step) => (
                                <span
                                  key={step.key}
                                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                    step.key === currentStep
                                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                                      : 'border-slate-200 bg-white text-slate-500'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              ))}
                            </div>
                            <Badge className={`mt-2 ${getStatusColor(order.status)}`}>{normalizeStatus(order.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(toNumber(order.totalAmount))}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.orderId)}>
                                <ClipboardList className="mr-1 h-3.5 w-3.5" />
                                Master
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadQuotationPdf(order.orderId, order.orderNumber)}
                              >
                                <Download className="mr-1 h-3.5 w-3.5" />
                                Quotation PDF
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportExcel(order.orderId, order.orderNumber)}
                              >
                                <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                                Excel
                              </Button>
                              {!['draft', 'cancelled'].includes(order.status) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={sendEmailMutation.isPending}
                                  onClick={() => sendEmailMutation.mutate({ id: order.orderId })}
                                >
                                  <Mail className="mr-1 h-3.5 w-3.5" />
                                  Email
                                </Button>
                              ) : null}
                              {['confirmed', 'partially_shipped'].includes(order.status) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => repunchMutation.mutate({ id: order.orderId, data: {} })}
                                >
                                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                  Re-Punch
                                </Button>
                              ) : null}
                              {order.status === 'draft' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => confirmMutation.mutate(order.orderId)}
                                >
                                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                  Confirm
                                </Button>
                              ) : null}
                              {!['draft', 'cancelled', 'invoiced', 'delivered', 'closed'].includes(order.status) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => dispatchMutation.mutate(order.orderId)}
                                >
                                  <Truck className="mr-1 h-3.5 w-3.5" />
                                  Dispatch
                                </Button>
                              ) : null}
                              {['partially_shipped', 'shipped', 'delivered'].includes(order.status) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => invoiceMutation.mutate(order.orderId)}
                                >
                                  <Receipt className="mr-1 h-3.5 w-3.5" />
                                  Invoice
                                </Button>
                              ) : null}
                              {!['cancelled', 'invoiced', 'delivered', 'closed'].includes(order.status) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => cancelMutation.mutate(order.orderId)}
                                >
                                  <Ban className="mr-1 h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {total ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, total)} of {total} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No sales orders found</h3>
              <p className="mt-1 text-gray-500">Won enquiries converted to sales orders will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispatch Master Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedOrderId ? (
            <div className="py-10 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">Select a sales order to inspect its dispatch master lines.</p>
            </div>
          ) : selectedOrderQuery.isLoading ? (
            <div className="h-32 rounded bg-gray-100 animate-pulse" />
          ) : selectedOrder ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Order</p>
                  <p className="mt-1 font-mono font-bold text-slate-900">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Buyer / Country</p>
                  <p className="mt-1 font-medium text-slate-900">{selectedOrder.customerName || '-'}</p>
                  <p className="text-xs text-slate-500">{selectedOrder.billingCountry || selectedOrder.shippingCountry || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">PI Number</p>
                  <p className="mt-1 font-mono font-bold text-slate-900">{selectedOrder.piNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Container / CBM Target</p>
                  <p className="mt-1 font-bold text-slate-900">{selectedOrder.containerSize || '-'}</p>
                  <p className="text-xs text-slate-500">
                    {selectedOrder.cbmRequired ? `${Number(selectedOrder.cbmRequired).toFixed(2)} CBM required` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Dispatch Qty</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedTotals.shipped} / {selectedTotals.quantity}
                  </p>
                  <p className="text-xs text-slate-500">{selectedTotals.pendingDispatch} pending</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">CBM Used / Target</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedTotals.cbm.toFixed(2)}
                    {selectedOrder.cbmRequired ? ` / ${Number(selectedOrder.cbmRequired).toFixed(2)}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">{selectedTotals.pendingInvoice} pending invoice</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Value</p>
                  <p className="mt-1 font-bold text-slate-900">{formatCurrency(selectedTotals.value)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Product Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Unit Size</TableHead>
                      <TableHead className="text-right">Units / Case</TableHead>
                      <TableHead className="text-right">Order Qty</TableHead>
                      <TableHead>Purchase Person</TableHead>
                      <TableHead className="text-right">MRP</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="text-right">Landing Cost</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Packing</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Per Pc W/O GST</TableHead>
                      <TableHead className="text-right">GST Cost</TableHead>
                      <TableHead className="text-right">Rate / Box</TableHead>
                      <TableHead className="text-right">Rate With GST</TableHead>
                      <TableHead className="text-right">Foreign Price</TableHead>
                      <TableHead className="text-right">Rate / Carton</TableHead>
                      <TableHead className="text-right">CBM / Box</TableHead>
                      <TableHead className="text-right">CBM Cost</TableHead>
                      <TableHead className="text-right">Haulage</TableHead>
                      <TableHead className="text-right">Final Rate</TableHead>
                      <TableHead className="text-right">Pending Dispatch</TableHead>
                      <TableHead className="text-right">Pending Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrder.items || []).map((item: any) => {
                      const metrics = lineMetrics(item);
                      return (
                        <TableRow key={item.itemId}>
                          <TableCell className="min-w-[170px] font-mono text-xs">{item.productCode || item.sku || '-'}</TableCell>
                          <TableCell>{item.categoryName || '-'}</TableCell>
                          <TableCell className="min-w-[220px] font-medium text-slate-900">{item.productName || '-'}</TableCell>
                          <TableCell>{item.unitSize || '-'}</TableCell>
                          <TableCell className="text-right">{metrics.unitsPerCase}</TableCell>
                          <TableCell className="text-right font-semibold">{metrics.quantity}</TableCell>
                          <TableCell>{item.purchasePersonName || '-'}</TableCell>
                          <TableCell className="text-right">{toNumber(item.mrp).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.gstRate).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{metrics.landingRate.toFixed(2)}</TableCell>
                          <TableCell>{item.uomName || item.unitBasis || '-'}</TableCell>
                          <TableCell>{item.packingType || '-'}</TableCell>
                          <TableCell>{item.location || selectedOrder.portOfLoading || '-'}</TableCell>
                          <TableCell className="text-right">{toNumber(item.perPcRateWithoutGst || metrics.landingRate).toFixed(4)}</TableCell>
                          <TableCell className="text-right">{metrics.gstCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.totalRatePerBox || metrics.landingRate * metrics.unitsPerCase).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{metrics.rateWithGst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.finalPriceInForeignCurrency || metrics.finalRate).toFixed(4)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.ratePerCarton || metrics.rateWithGst).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.cbmPerBox).toFixed(4)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.cbmCostPerBoxInSelectedCurrency).toFixed(4)}</TableCell>
                          <TableCell className="text-right">{toNumber(item.haulage).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">{metrics.finalRate.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{metrics.pendingDispatch}</TableCell>
                          <TableCell className="text-right">{metrics.pendingInvoice}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownloadQuotationPdf(selectedOrder.orderId, selectedOrder.orderNumber)}>
                  <Download className="mr-2 h-4 w-4" />
                  Quotation PDF
                </Button>
                <Button variant="outline" onClick={() => handleExportExcel(selectedOrder.orderId, selectedOrder.orderNumber)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                {!['draft', 'cancelled'].includes(selectedOrder.status) ? (
                  <Button
                    variant="outline"
                    onClick={() => sendEmailMutation.mutate({ id: selectedOrder.orderId })}
                    disabled={sendEmailMutation.isPending}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Quotation Email
                  </Button>
                ) : null}
                {['confirmed', 'partially_shipped'].includes(selectedOrder.status) ? (
                  <Button
                    variant="outline"
                    onClick={() => sendEmailMutation.mutate({ id: selectedOrder.orderId, reQuotation: true })}
                    disabled={sendEmailMutation.isPending}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Re-Quotation Email
                  </Button>
                ) : null}
                {selectedOrder.status === 'draft' ? (
                  <Button onClick={() => confirmMutation.mutate(selectedOrder.orderId)} disabled={confirmMutation.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Order
                  </Button>
                ) : null}
                {['confirmed', 'partially_shipped'].includes(selectedOrder.status) ? (
                  <Button
                    variant="outline"
                    onClick={() => repunchMutation.mutate({ id: selectedOrder.orderId, data: {} })}
                    disabled={repunchMutation.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-Punch
                  </Button>
                ) : null}
                {!['draft', 'cancelled', 'invoiced', 'delivered', 'closed'].includes(selectedOrder.status) ? (
                  <Button variant="outline" onClick={() => dispatchMutation.mutate(selectedOrder.orderId)} disabled={dispatchMutation.isPending}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Create Dispatch
                  </Button>
                ) : null}
                {selectedTotals.pendingInvoice > 0 ? (
                  <Button variant="outline" onClick={() => invoiceMutation.mutate(selectedOrder.orderId)} disabled={invoiceMutation.isPending}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500">Unable to load selected order.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
