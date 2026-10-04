'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsApi } from '@/lib/api';
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
import {
  Plus,
  Search,
  Eye,
  Tag,
  Palette,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
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

const formatStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function LabelsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    labelId: string | null;
  }>({
    open: false,
    action: '',
    title: '',
    labelId: null,
  });
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['labels', { page, search, status }],
    queryFn: () =>
      labelsApi.getLabels({
        page,
        limit: 20,
        ...(status !== 'all' ? { status } : {}),
        ...(search ? { search } : {}),
      }),
  });

  // Complete label mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => labelsApi.completeLabel(id, data),
    onSuccess: () => {
      toast.success('Label completed');
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to complete'),
  });

  const closeDialog = () => {
    setActionDialog({ open: false, action: '', title: '', labelId: null });
    setRemarks('');
  };

  const getActionButtons = (label: any) => {
    const buttons = [];
    if (label.status === 'assigned' || label.status === 'in_progress') {
      buttons.push(
        <Button
          key="complete"
          variant="default"
          size="sm"
          onClick={() =>
            setActionDialog({
              open: true,
              action: 'complete',
              title: 'Complete Label',
              labelId: label.labelId || label.id,
            })
          }
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Complete
        </Button>
      );
    }
    if (label.delayDays > 0) {
      buttons.push(
        <Badge key="delayed" variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {label.delayDays}d delay
        </Badge>
      );
    }
    return buttons;
  };

  const handleAction = () => {
    if (!actionDialog.labelId) return;
    completeMutation.mutate({
      id: actionDialog.labelId,
      data: { remarks },
    });
  };

  // Calculate stats
  const labels = data?.data?.data || [];
  const stats = {
    total: labels.length,
    pending: labels.filter((l: any) => l.status === 'pending').length,
    inProgress: labels.filter((l: any) => ['assigned', 'in_progress'].includes(l.status)).length,
    delayed: labels.filter((l: any) => l.delayDays > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Label / Artwork Tracking</h1>
          <p className="text-gray-500">Track label design and packaging artwork status</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/labels/new">
            <Plus className="h-4 w-4 mr-2" />
            New Label
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Labels</p>
                <p className="text-2xl font-bold">{data?.data?.total || 0}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Palette className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delayed</p>
                <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
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
                placeholder="Search by label code, party name, or product..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
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
                <SelectValue placeholder="Filter by status" />
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

      {/* Labels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Label List</CardTitle>
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
                    <TableHead>Label Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party / Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.data.map((label: any) => (
                    <TableRow key={label.labelId || label.id}>
                      <TableCell className="font-mono font-medium">
                        {label.labelCode || '-'}
                      </TableCell>
                      <TableCell>{formatDate(label.labelDate)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{label.partyName || '-'}</div>
                          <div className="text-sm text-gray-500">{label.country}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{label.productName || '-'}</div>
                          <div className="text-sm text-gray-500">{label.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          {label.designerName || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {label.plannedDate ? formatDate(label.plannedDate) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {label.delayDays ? (
                          <Badge variant="destructive">{label.delayDays}d</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[label.status] || 'bg-gray-100'}>
                          {formatStatusLabel(label.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {getActionButtons(label)}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/labels/${label.labelId || label.id}`}>
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
                  {data.data.total} labels
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
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No labels found</h3>
              <p className="text-gray-500 mt-1">Create a new label to get started</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/labels/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Label
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>Complete this label artwork</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Completion Details</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add completion notes..."
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
              disabled={completeMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
