'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsApi, usersApi } from '@/lib/api';
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
  Palette,
  Search,
  Calendar,
  User,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sample_created', label: 'Sample Created' },
  { value: 'approval_pending', label: 'Approval Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'revision_required', label: 'Revision Required' },
  { value: 'final_uploaded', label: 'Final Uploaded' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  sample_created: 'bg-purple-100 text-purple-700',
  approval_pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  revision_required: 'bg-red-100 text-red-700',
  final_uploaded: 'bg-teal-100 text-teal-700',
};

export default function DesignerFmsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [designerFilter, setDesignerFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: usersData } = useQuery({
    queryKey: ['designer-users'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['designer-fms', { page, status, search, designerFilter }],
    queryFn: () =>
      labelsApi.getLabels({
        page,
        limit: 20,
        search: search || undefined,
        ...(status !== 'all' ? { status } : {}),
      }),
  });

  const rows = (data?.data?.data || []).filter((label: any) => {
    if (designerFilter === 'all') return true;
    if (designerFilter === 'unassigned') return !label.designerName && !label.designerId;
    return label.designerId === designerFilter || label.designerName === designerFilter;
  });
  const total = rows.length;

  // Get unique designers from data
  const designers = Array.from(
    new Set(
      (data?.data?.data || [])
        .map((l: any) => l.designerName)
        .filter(Boolean)
    )
  ) as string[];

  // Stats
  const allLabels = data?.data?.data || [];
  const stats = {
    total: allLabels.length,
    pending: allLabels.filter((l: any) => l.status === 'pending' || l.status === 'assigned').length,
    inProgress: allLabels.filter((l: any) => l.status === 'in_progress' || l.status === 'sample_created').length,
    awaitingApproval: allLabels.filter((l: any) => l.status === 'approval_pending').length,
    completed: allLabels.filter((l: any) => l.status === 'approved' || l.status === 'final_uploaded').length,
    revision: allLabels.filter((l: any) => l.status === 'revision_required').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designer FMS</h1>
          <p className="text-gray-500">Label artwork design tracking by designer</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/labels">
            <Eye className="h-4 w-4 mr-2" />
            All Labels
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.awaitingApproval}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search product, order..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={designerFilter} onValueChange={(v) => { setDesignerFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Designer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {designers.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setDesignerFilter('all'); setPage(1); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Designer Tasks ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No design tasks found</h3>
              <p className="text-gray-500 mt-1">Label artwork tasks will appear here when assigned</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label Code</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>Planned Date</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((label: any) => (
                    <TableRow key={label.labelId}>
                      <TableCell className="font-mono text-sm">{label.labelCode || '-'}</TableCell>
                      <TableCell>{label.salesEnquiryOrderNo || label.orderNo || '-'}</TableCell>
                      <TableCell className="font-medium">{label.productName || '-'}</TableCell>
                      <TableCell>{label.partyName || '-'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          {label.designerName || 'Unassigned'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {label.plannedDate ? formatDate(label.plannedDate) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {label.delayDays != null && label.delayDays > 0 ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {label.delayDays}d
                          </Badge>
                        ) : (
                          <span className="text-green-600 text-sm">
                            <Clock className="h-3 w-3 inline mr-1" />
                            On track
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[label.status] || 'bg-gray-100 text-gray-700'}>
                          {(label.status || '').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
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
