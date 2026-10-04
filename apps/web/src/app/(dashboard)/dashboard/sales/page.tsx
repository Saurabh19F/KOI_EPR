'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi, usersApi } from '@/lib/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, ShoppingCart, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'punched', label: 'Punched' },
  { value: 'verified', label: 'Verified' },
  { value: 'purchase_pending', label: 'Purchase Pending' },
  { value: 'rate_pending', label: 'Rate Pending' },
  { value: 'approval_pending', label: 'Approval Pending' },
  { value: 'quotation_created', label: 'Quotation Created' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [createdBy, setCreatedBy] = useState('all');
  const [page, setPage] = useState(1);

  const { data: usersData } = useQuery({
    queryKey: ['users-list-sales'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['enquiries', { page, search, status, createdBy }],
    queryFn: () => salesApi.getEnquiries({
      page,
      limit: 20,
      search: search || undefined,
      ...(status !== 'all' ? { status } : {}),
      ...(createdBy !== 'all' ? { createdBy } : {}),
    }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => salesApi.convertToSalesOrder(id),
    onSuccess: (response) => {
      toast.success(`Sales order ${response.data?.orderNumber || ''} is ready`);
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-workflow'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create sales order';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Enquiries</h1>
          <p className="text-gray-500">Manage sales enquiry workflow</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <Plus className="h-4 w-4 mr-2" />
            New Enquiry
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by enquiry number..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={createdBy} onValueChange={(v) => { setCreatedBy(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Creator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {usersData?.data?.data?.map((user: any) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.name} ({user.userCode || 'N/A'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setCreatedBy('all'); setPage(1); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enquiry List</CardTitle>
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
                  <TableRow>
                    <TableHead>Enquiry No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.data.map((enquiry: any) => (
                    <TableRow key={enquiry.enquiryOrderId || enquiry.enquiryId}>
                      <TableCell className="font-mono font-medium">
                        {enquiry.enquiryOrderNo || enquiry.enquiryNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>{enquiry.customer?.customerName || enquiry.customerName || '-'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          {enquiry.createdByUser?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{enquiry.itemCount || 0} items</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(enquiry.status)}>
                          {enquiry.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {enquiry.status === 'won' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={convertMutation.isPending}
                              onClick={() => convertMutation.mutate(enquiry.enquiryOrderId || enquiry.enquiryId)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Create SO
                            </Button>
                          ) : null}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/sales/${enquiry.enquiryOrderId || enquiry.enquiryId}`}>
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

              {/* Pagination */}
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
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No enquiries found</h3>
              <p className="text-gray-500 mt-1">Get started by creating your first enquiry</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/sales/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Enquiry
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
