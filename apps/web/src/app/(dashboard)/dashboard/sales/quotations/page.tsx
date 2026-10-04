'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesOrderApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Mail,
  RefreshCw,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

const STATUS_FILTER = [
  { value: 'all', label: 'All Orders' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'draft', label: 'Draft' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'invoiced', label: 'Invoiced' },
];

function toNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['quotations-list', page, search, statusFilter],
    queryFn: () =>
      salesOrderApi.getOrders({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const orders = ordersData?.data?.data || [];
  const total = ordersData?.data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, reQuotation }: { id: string; reQuotation?: boolean }) =>
      salesOrderApi.sendQuotationEmail(id, reQuotation),
    onSuccess: () => {
      toast.success('Quotation email sent to customer');
      queryClient.invalidateQueries({ queryKey: ['quotations-list'] });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Failed to send email'),
  });

  const handleDownloadSheetExcel = async (orderId: string, orderNumber: string, withRate: boolean) => {
    try {
      const response = await salesOrderApi.downloadSheetExcel(orderId, withRate);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SalesOrder-${withRate ? 'WithRate' : 'WithoutRate'}-${orderNumber}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${withRate ? 'With Rate' : 'Without Rate'} Excel downloaded`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Order List</h1>
          <p className="text-slate-500 mt-1">
            Manage and track sales orders
          </p>
        </div>
        <Link href="/dashboard/sales/orders/new">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Sales Order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 uppercase">Total Sales Orders</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 uppercase">This Page</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 uppercase">Total Value</p>
            <p className="text-2xl font-bold text-emerald-700">
              {orders
                .reduce((s: number, o: any) => s + toNumber(o.totalAmount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 uppercase">Confirmed</p>
            <p className="text-2xl font-bold text-blue-700">
              {orders.filter((o: any) => o.status === 'confirmed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order no, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50">
                  <TableHead className="font-semibold text-xs">Time Stamp</TableHead>
                  <TableHead className="font-semibold text-xs">Quotation No</TableHead>
                  <TableHead className="font-semibold text-xs">Quotation Date</TableHead>
                  <TableHead className="font-semibold text-xs">Customer</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Grand Total</TableHead>
                  <TableHead className="font-semibold text-xs">Currency</TableHead>
                  <TableHead className="font-semibold text-xs">Payment Terms</TableHead>
                  <TableHead className="font-semibold text-xs text-center">With Rate Sales Order</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Without Rate Sales Order</TableHead>
                  <TableHead className="font-semibold text-xs">Quotation Created By</TableHead>
                  <TableHead className="font-semibold text-xs">Buyer Email</TableHead>
                  <TableHead className="font-semibold text-xs">Subject</TableHead>
                  <TableHead className="font-semibold text-xs">Body</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Buyer Code</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8 text-slate-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8 text-slate-500">
                      No quotations found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => (
                    <TableRow
                      key={order.orderId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="text-xs whitespace-nowrap">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.orderDate ? formatDate(order.orderDate) : ''}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        {toNumber(order.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.currencyCode || 'INR'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.paymentTermsName || ''}
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleDownloadSheetExcel(order.orderId, order.orderNumber, true)}
                        >
                          <Download className="h-3 w-3 mr-1" /> With Rate
                        </Button>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleDownloadSheetExcel(order.orderId, order.orderNumber, false)}
                        >
                          <Download className="h-3 w-3 mr-1" /> Without Rate
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.salesPersonName || ''}
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {order.contactEmail || ''}
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {order.quotationSubject || ''}
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {order.quotationBody || ''}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            order.status === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : order.status === 'draft'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {order.status?.replace(/_/g, ' ') || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {order.customerCode || ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => sendEmailMutation.mutate({ id: order.orderId })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Send Quotation Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => sendEmailMutation.mutate({ id: order.orderId, reQuotation: true })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                            title="Send Re-Quotation Email"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <Link href={`/dashboard/sales/${order.orderId}`}>
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                              title="View Order"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-slate-500">
              Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to{' '}
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quotation — {selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Customer:</span>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Buyer Code:</span>
                  <p className="font-medium">{selectedOrder.customerCode || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Grand Total:</span>
                  <p className="font-medium text-emerald-700">
                    {selectedOrder.currencyCode || 'INR'}{' '}
                    {toNumber(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Payment Terms:</span>
                  <p className="font-medium">{selectedOrder.paymentTermsName || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Buyer Email:</span>
                  <p className="font-medium">{selectedOrder.contactEmail || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Created By:</span>
                  <p className="font-medium">{selectedOrder.salesPersonName || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p className="font-medium capitalize">{selectedOrder.status?.replace(/_/g, ' ') || 'draft'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Order Date:</span>
                  <p className="font-medium">{selectedOrder.orderDate ? formatDate(selectedOrder.orderDate) : '-'}</p>
                </div>
              </div>

              <hr />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownloadSheetExcel(selectedOrder.orderId, selectedOrder.orderNumber, true)}>
                  <Download className="h-4 w-4 mr-1" /> With Rate PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadSheetExcel(selectedOrder.orderId, selectedOrder.orderNumber, false)}>
                  <Download className="h-4 w-4 mr-1" /> Without Rate PDF
                </Button>
                <Button size="sm" onClick={() => sendEmailMutation.mutate({ id: selectedOrder.orderId })} disabled={sendEmailMutation.isPending}>
                  <Send className="h-4 w-4 mr-1" /> Send Quotation Email
                </Button>
                <Button variant="secondary" size="sm" onClick={() => sendEmailMutation.mutate({ id: selectedOrder.orderId, reQuotation: true })} disabled={sendEmailMutation.isPending}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Send Re-Quotation
                </Button>
                <Link href={`/dashboard/sales/${selectedOrder.orderId}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" /> View Full Order
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
