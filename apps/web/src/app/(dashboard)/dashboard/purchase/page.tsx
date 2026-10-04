'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, salesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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
  Eye,
  Truck,
  Calendar,
  Plus,
  Search,
  Send,
  CheckCircle,
  DollarSign,
  Package,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  UserX,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'vendor_quote_pending', label: 'Vendor Quote Pending' },
  { value: 'rate_finalized', label: 'Rates Finalized' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  vendor_quote_pending: 'bg-orange-100 text-orange-700',
  rate_finalized: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function PurchasePage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const userRoles = currentUser?.roles?.map((r) => (r.roleCode || r.roleName || '').toUpperCase()) || [];
  const isPurchaseManager = userRoles.includes('PURCHASE_MANAGER') || userRoles.includes('ADMIN') || userRoles.includes('MANAGEMENT') || currentUser?.isSuperAdmin;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    quoteId: string | null;
  }>({
    open: false,
    action: '',
    title: '',
    quoteId: null,
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'enquiries' | 'unassigned' | 'requotes' | 'completed'>('pending');
  const [selectedRequoteEnquiry, setSelectedRequoteEnquiry] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; enquiry: any | null; items: any[] }>({ open: false, enquiry: null, items: [] });
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});

  const queryStatus = status !== 'all'
    ? status
    : (activeTab === 'pending' ? 'draft,under_review,vendor_quote_pending,revised' : 'submitted,rate_finalized,sent_to_costing,approved,rejected');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-quotes', { page, status: queryStatus, search, activeTab }],
    queryFn: () =>
      purchaseApi.getQuotes({
        page,
        limit: 20,
        status: queryStatus,
        ...(search ? { search } : {}),
      }),
    enabled: activeTab !== 'enquiries',
  });

  const PENDING_PURCHASE_STATUSES = 'submitted,purchase_assigned,purchase_in_progress,vendor_quote_pending,draft';
  const REQUOTE_STATUSES = 'mis_requote_required,requote_required,revised';
  const COMPLETED_PURCHASE_STATUSES = 'purchase_completed,mis_review,mis_approved,rate_calculation,approval_pending,quotation_created,quotation_sent,won,lost,approved';

  const { data: enquiriesData, isLoading: isEnquiriesLoading } = useQuery({
    queryKey: ['sales-enquiries-for-purchase', { page, search, status: PENDING_PURCHASE_STATUSES }],
    queryFn: () =>
      salesApi.getEnquiries({
        page,
        limit: 20,
        status: PENDING_PURCHASE_STATUSES,
        ...(search ? { search } : {}),
      }),
    enabled: activeTab === 'enquiries',
  });

  const { data: assignedEnquiriesStats } = useQuery({
    queryKey: ['assigned-sales-enquiries-count'],
    queryFn: () => salesApi.getEnquiries({ page: 1, limit: 100, status: PENDING_PURCHASE_STATUSES }),
  });

  const { data: requotesData, isLoading: isRequotesLoading } = useQuery({
    queryKey: ['sales-requotes-for-purchase', { page, search, status: REQUOTE_STATUSES }],
    queryFn: () =>
      salesApi.getEnquiries({
        page,
        limit: 20,
        status: REQUOTE_STATUSES,
        ...(search ? { search } : {}),
      }),
    enabled: activeTab === 'requotes',
  });

  const { data: requotesStats } = useQuery({
    queryKey: ['sales-requotes-count'],
    queryFn: () => salesApi.getEnquiries({ page: 1, limit: 100, status: REQUOTE_STATUSES }),
  });

  const { data: unassignedData, isLoading: isUnassignedLoading } = useQuery({
    queryKey: ['unassigned-enquiries', { page, search }],
    queryFn: () =>
      salesApi.getEnquiries({
        page,
        limit: 20,
        unassigned: true,
        ...(search ? { search } : {}),
      }),
    enabled: activeTab === 'unassigned',
  });

  const { data: unassignedStats } = useQuery({
    queryKey: ['unassigned-enquiries-count'],
    queryFn: () => salesApi.getEnquiries({ page: 1, limit: 1, unassigned: true }),
  });

  const { data: purchaseUsersData } = useQuery({
    queryKey: ['purchase-users-lookup'],
    queryFn: () => salesApi.getPurchaseUsers(),
  });

  const assignMutation = useMutation({
    mutationFn: async (assignments: { itemId: string; purchasePersonId: string }[]) => {
      await Promise.all(
        assignments.map(({ itemId, purchasePersonId }) =>
          salesApi.updateEnquiryItem(itemId, { purchasePersonId })
        )
      );
    },
    onSuccess: () => {
      toast.success('Purchase person assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['unassigned-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-enquiries-count'] });
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries-for-purchase'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-sales-enquiries-count'] });
      setAssignDialog({ open: false, enquiry: null, items: [] });
      setAssignSelections({});
    },
    onError: () => toast.error('Failed to assign purchase person'),
  });

  const selfAssignMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const myId = currentUser?.userId;
      if (!myId) throw new Error('Not logged in');
      await Promise.all(
        itemIds.map((itemId) => salesApi.updateEnquiryItem(itemId, { purchasePersonId: myId }))
      );
    },
    onSuccess: () => {
      toast.success('Assigned to you successfully');
      queryClient.invalidateQueries({ queryKey: ['unassigned-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-enquiries-count'] });
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries-for-purchase'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-sales-enquiries-count'] });
    },
    onError: () => toast.error('Failed to self-assign'),
  });

  // Submit quote mutation
  const sendMutation = useMutation({
    mutationFn: (id: string) => purchaseApi.submitQuote(id),
    onSuccess: () => {
      toast.success('Quote submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-quotes'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to submit quote'),
  });

  // Approve quote mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      purchaseApi.approveQuote(id, remarks),
    onSuccess: () => {
      toast.success('Quote approved');
      queryClient.invalidateQueries({ queryKey: ['purchase-quotes'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to approve'),
  });

  const closeDialog = () => {
    setActionDialog({ open: false, action: '', title: '', quoteId: null });
    setRemarks('');
  };

  const getActionButtons = (quote: any) => {
    const buttons = [];
    switch (quote.status) {
      case 'draft':
        buttons.push(
          <Button
            key="send"
            variant="default"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'send',
                title: 'Submit Quote',
                quoteId: quote.quoteId || quote.id,
              })
            }
          >
            <Send className="h-4 w-4 mr-1" />
            Submit
          </Button>
        );
        break;
      case 'quote_received':
      case 'compared':
        buttons.push(
          <Button
            key="approve"
            variant="default"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'approve',
                title: 'Approve Quote',
                quoteId: quote.quoteId || quote.id,
              })
            }
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
        );
        break;
    }
    return buttons;
  };

  const handleAction = () => {
    if (!actionDialog.quoteId) return;
    switch (actionDialog.action) {
      case 'send':
        sendMutation.mutate(actionDialog.quoteId);
        break;
      case 'approve':
        approveMutation.mutate({ id: actionDialog.quoteId, remarks });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Quotes</h1>
          <p className="text-gray-500">Manage purchase quotes generated from Sales Enquiries</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase/new">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Quotes</p>
                <p className="text-2xl font-bold">{data?.data?.total || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data?.data?.data?.filter((q: any) => ['draft', 'under_review', 'vendor_quote_pending', 'revised'].includes(q.status)).length || 0}
                </p>
              </div>
              <Send className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rates Received</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data?.data?.data?.filter((q: any) => q.status === 'rate_finalized').length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.data?.data?.filter((q: any) => q.status === 'approved').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by quote number..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setPage(1); setStatus('all'); }}>
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pending Quotes
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            Assigned Sales Enquiries
            {assignedEnquiriesStats?.data?.total ? (
              <Badge className="bg-emerald-600 text-white text-[10px] ml-1 px-1.5 py-0.2">
                {assignedEnquiriesStats.data.total}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-amber-600" />
            Unassigned
            {unassignedStats?.data?.total ? (
              <Badge className="bg-amber-500 text-white text-[10px] ml-1 px-1.5 py-0.2 animate-pulse">
                {unassignedStats.data.total}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="requotes" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-red-500" />
            Requotes
            {requotesStats?.data?.total ? (
              <Badge className="bg-red-500 text-white text-[10px] ml-1 px-1.5 py-0.2 animate-pulse">
                {requotesStats.data.total}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Quotes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Table View */}
      {activeTab === 'requotes' ? (
        <Card className="border-red-100">
          <CardHeader className="bg-red-50/50 border-b border-red-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <RefreshCw className="h-5 w-5 text-red-500" />
                Requote Enquiries (Sent Back from MIS / Rate Calculation)
              </div>
              <Badge className="bg-red-100 text-red-700 border-red-200">
                Action Required from Purchase
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isRequotesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : requotesData?.data?.data?.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50/30">
                      <TableHead className="font-semibold text-slate-700">Enquiry Ref.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer / Buyer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items to Requote</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Requote Remarks</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requotesData.data.data.map((enquiry: any) => {
                      const requoteItemsCount = enquiry.items?.filter((it: any) => it.purchaseStatus === 'requote_required' || it.purchaseStatus === 'rejected').length || enquiry.items?.length || 0;
                      return (
                        <TableRow key={enquiry.enquiryOrderId || enquiry.enquiryId} className="hover:bg-red-50/40 transition-colors border-slate-100">
                          <TableCell className="font-mono font-semibold text-slate-900">
                            {enquiry.enquiryOrderNo || enquiry.enquiryNumber || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-slate-900 text-sm block">
                                {enquiry.buyerName || '-'}
                              </span>
                              {enquiry.buyerCode && (
                                <span className="text-xs text-slate-500 font-mono">
                                  {enquiry.buyerCode}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              {requoteItemsCount} item(s) flagged
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="shadow-none border-none text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-red-100 text-red-700">
                              {enquiry.status?.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-xs text-slate-600 italic line-clamp-2" title={enquiry.remarks || 'Requote requested by MIS / Rate calculation'}>
                              {enquiry.remarks || 'Requote requested by MIS / Rate calculation'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-red-200 hover:bg-red-50 text-red-700"
                                onClick={() => setSelectedRequoteEnquiry(enquiry)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View Flagged Items
                              </Button>
                              <Button asChild variant="default" size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white">
                                <Link href={`/dashboard/purchase/new?enquiryId=${enquiry.enquiryOrderId || enquiry.enquiryId}`}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                  Update & Resubmit
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, requotesData.data.total)} of{' '}
                    {requotesData.data.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= requotesData.data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                <h3 className="text-lg font-medium text-gray-900">No requotes pending</h3>
                <p className="text-gray-500 mt-1">
                  Enquiries flagged for requote by MIS or Rate Calculation will automatically appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'unassigned' ? (
        <Card className="border-amber-100">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <UserX className="h-5 w-5 text-amber-500" />
                Unassigned Enquiries (No Purchase Person)
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                Assign Purchase Person
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isUnassignedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : unassignedData?.data?.data?.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/30">
                      <TableHead className="font-semibold text-slate-700">Enquiry Ref.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer / Buyer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Unassigned Items</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Created By</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedData.data.data.map((enquiry: any) => {
                      const unassignedItems = enquiry.items?.filter((it: any) => !it.assignedPurchaseUserId && !it.purchasePersonId) || [];
                      return (
                        <TableRow key={enquiry.enquiryOrderId || enquiry.enquiryId} className="hover:bg-amber-50/40 transition-colors border-slate-100">
                          <TableCell className="font-mono font-semibold text-slate-900">
                            {enquiry.enquiryOrderNo || enquiry.enquiryNumber || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-slate-900 text-sm block">
                                {enquiry.buyerName || '-'}
                              </span>
                              {enquiry.buyerCode && (
                                <span className="text-xs text-slate-500 font-mono">
                                  {enquiry.buyerCode}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              {unassignedItems.length} item(s)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(enquiry.status)}>
                              {enquiry.status?.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              {enquiry.createdByUser?.name || enquiry.salesPersonName || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                disabled={selfAssignMutation.isPending}
                                onClick={() => {
                                  const itemIds = unassignedItems.map((it: any) => it.itemId || it.id);
                                  selfAssignMutation.mutate(itemIds);
                                }}
                              >
                                <User className="h-3.5 w-3.5 mr-1" />
                                Take
                              </Button>
                              {isPurchaseManager && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() => {
                                    setAssignDialog({ open: true, enquiry, items: unassignedItems });
                                    setAssignSelections({});
                                  }}
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                                  Assign
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, unassignedData.data.total)} of{' '}
                    {unassignedData.data.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= unassignedData.data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                <h3 className="text-lg font-medium text-gray-900">All items are assigned</h3>
                <p className="text-gray-500 mt-1">
                  No enquiry items without a purchase person. All good!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'enquiries' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Assigned Sales Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEnquiriesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : enquiriesData?.data?.data?.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Enquiry Ref.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer / Buyer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Creator / Owner</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiriesData.data.data.map((enquiry: any) => (
                      <TableRow key={enquiry.enquiryOrderId || enquiry.enquiryId} className="hover:bg-slate-50/85 transition-colors border-slate-100">
                        <TableCell className="font-mono font-semibold text-slate-900">
                          {enquiry.enquiryOrderNo || enquiry.enquiryNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-slate-900 text-sm block">
                              {enquiry.buyerName || '-'}
                            </span>
                            {enquiry.buyerCode && (
                              <span className="text-xs text-slate-500 font-mono">
                                {enquiry.buyerCode}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {enquiry.itemCount !== undefined ? enquiry.itemCount : (enquiry.items?.length || 0)} items
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enquiry.status)}>
                            {enquiry.status?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {enquiry.createdByUser?.name || enquiry.salesPersonName || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="h-8">
                              <Link href={`/dashboard/sales/${enquiry.enquiryOrderId || enquiry.enquiryId}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View Details
                              </Link>
                            </Button>
                            <Button asChild variant="default" size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                              <Link href={`/dashboard/purchase/new?enquiryId=${enquiry.enquiryOrderId || enquiry.enquiryId}`}>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Create Quote
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, enquiriesData.data.total)} of{' '}
                    {enquiriesData.data.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= enquiriesData.data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No assigned sales enquiries found</h3>
                <p className="text-gray-500 mt-1">
                  Sales enquiries assigned to you will automatically appear here as soon as they are created or submitted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Quotes Table */
        <Card>
          <CardHeader>
            <CardTitle>Quote List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : data?.data?.data?.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Enquiry Ref.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer / Party</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items</TableHead>
                      <TableHead className="font-semibold text-slate-700">Total Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.data.map((quote: any) => (
                      <TableRow key={quote.quoteId || quote.id} className="hover:bg-slate-50/85 transition-colors border-slate-100">
                        <TableCell className="font-mono font-semibold text-slate-900">
                          {quote.enquiryOrderNo || quote.enquiryRef || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(quote.quoteDate || quote.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium text-slate-700 text-sm">
                            <Truck className="h-4 w-4 text-emerald-500 shrink-0" />
                            {quote.partyName || quote.vendor?.vendorName || quote.vendorName || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                            {quote.items?.length || 0} items
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900">
                            {quote.grandTotal ? `₹${Number(quote.grandTotal).toLocaleString('en-IN')}` : '₹0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {getActionButtons(quote)}
                            <Button asChild variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700 transition-colors h-8">
                              <Link href={`/dashboard/purchase/${quote.quoteId || quote.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.data.total)} of{' '}
                    {data.data.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No purchase quotes found</h3>
                <p className="text-gray-500 mt-1">
                  {status === 'all' && !search
                    ? 'Quotes will appear here when created from enquiries'
                    : 'Try adjusting your filters'}
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/purchase/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Quote
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'send' &&
                'Submit this purchase quote for pricing calculation and review'}
              {actionDialog.action === 'approve' && 'Approve this purchase quote'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                sendMutation.isPending || approveMutation.isPending
              }
            >
              {actionDialog.action === 'send' && (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quote
                </>
              )}
              {actionDialog.action === 'approve' && (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Requote Flagged Items Detail Dialog */}
      <Dialog open={!!selectedRequoteEnquiry} onOpenChange={(open) => !open && setSelectedRequoteEnquiry(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <RefreshCw className="h-5 w-5 text-red-500" />
              Requote Details - {selectedRequoteEnquiry?.enquiryOrderNo || selectedRequoteEnquiry?.enquiryNumber}
            </DialogTitle>
            <DialogDescription>
              Buyer: <strong>{selectedRequoteEnquiry?.buyerName || '-'}</strong> | Status: <span className="uppercase font-semibold text-red-600">{selectedRequoteEnquiry?.status?.replace(/_/g, ' ')}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                MIS / Rate Calculation Requote Remarks:
              </h4>
              <p className="text-sm text-red-900 font-medium italic">
                "{selectedRequoteEnquiry?.remarks || 'Requote requested from MIS / Rate calculation phase.'}"
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Enquiry Line Items & Status
              </h4>
              <div className="border border-slate-200 rounded-md overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Requote Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequoteEnquiry?.items && selectedRequoteEnquiry.items.length > 0 ? (
                      selectedRequoteEnquiry.items.map((item: any) => {
                        const isFlagged = item.purchaseStatus === 'requote_required' || item.purchaseStatus === 'rejected';
                        return (
                          <TableRow key={item.itemId || item.id} className={isFlagged ? 'bg-red-50/50' : ''}>
                            <TableCell className="font-medium text-xs">
                              {item.productName || item.product?.productName || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">
                              {item.sku || item.product?.sku || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-center font-semibold">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isFlagged ? 'destructive' : 'secondary'}
                                className="text-[10px] uppercase font-bold"
                              >
                                {item.purchaseStatus || 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-4">
                          All items in this enquiry are requested for requoting.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button variant="outline" onClick={() => setSelectedRequoteEnquiry(null)}>
              Close
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href={`/dashboard/purchase/new?enquiryId=${selectedRequoteEnquiry?.enquiryOrderId || selectedRequoteEnquiry?.enquiryId}`}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Costs & Resubmit Quote
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Purchase Person Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => { if (!open) { setAssignDialog({ open: false, enquiry: null, items: [] }); setAssignSelections({}); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <UserPlus className="h-5 w-5 text-amber-500" />
              Assign Purchase Person - {assignDialog.enquiry?.enquiryOrderNo || assignDialog.enquiry?.enquiryNumber}
            </DialogTitle>
            <DialogDescription>
              Buyer: <strong>{assignDialog.enquiry?.buyerName || '-'}</strong> — Select a purchase person for each unassigned item below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800 font-medium">
                These items have no purchase person assigned. Select a person for each item, or use "Apply to all" to assign the same person to every item.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-md p-3 border">
              <Label className="text-xs font-semibold whitespace-nowrap">Apply to all:</Label>
              <select
                className="flex-1 text-sm border rounded px-2 py-1.5"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const all: Record<string, string> = {};
                    assignDialog.items.forEach((item: any) => {
                      all[item.itemId || item.id] = e.target.value;
                    });
                    setAssignSelections(all);
                  }
                }}
              >
                <option value="">Select purchase person...</option>
                {purchaseUsersData?.data?.map((u: any) => (
                  <option key={u.userId} value={u.userId}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-xs">
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Assign To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignDialog.items.map((item: any) => (
                    <TableRow key={item.itemId || item.id}>
                      <TableCell className="font-medium text-xs">
                        {item.productName || item.manualProductName || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {item.sku || '-'}
                      </TableCell>
                      <TableCell>
                        <select
                          className="text-xs border rounded px-2 py-1.5 w-full"
                          value={assignSelections[item.itemId || item.id] || ''}
                          onChange={(e) => setAssignSelections(prev => ({ ...prev, [item.itemId || item.id]: e.target.value }))}
                        >
                          <option value="">Select...</option>
                          {purchaseUsersData?.data?.map((u: any) => (
                            <option key={u.userId} value={u.userId}>{u.name}</option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button variant="outline" onClick={() => { setAssignDialog({ open: false, enquiry: null, items: [] }); setAssignSelections({}); }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={assignMutation.isPending || Object.values(assignSelections).filter(Boolean).length === 0}
              onClick={() => {
                const assignments = Object.entries(assignSelections)
                  .filter(([, userId]) => userId)
                  .map(([itemId, purchasePersonId]) => ({ itemId, purchasePersonId }));
                if (assignments.length > 0) {
                  assignMutation.mutate(assignments);
                }
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {assignMutation.isPending ? 'Assigning...' : `Assign (${Object.values(assignSelections).filter(Boolean).length} items)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
