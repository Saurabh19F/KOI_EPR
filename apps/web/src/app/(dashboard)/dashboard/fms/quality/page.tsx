'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmsApi } from '@/lib/api';
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
  CheckSquare,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'rework_required', label: 'Rework Required' },
  { value: 'rework_done', label: 'Rework Done' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  inspection_scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  rework_required: 'bg-orange-100 text-orange-700',
  rework_done: 'bg-purple-100 text-purple-700',
  completed: 'bg-teal-100 text-teal-700',
};

export default function QualityFmsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    productName: '',
    sku: '',
    vendorName: '',
    inspectorName: '',
    orderedQuantity: '',
    remarks: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quality-fms', { page, status, search }],
    queryFn: () =>
      fmsApi.getQualityTasks({
        page,
        limit: 20,
        ...(status !== 'all' ? { status } : {}),
      }),
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) => fmsApi.createQualityTask(formData),
    onSuccess: () => {
      toast.success('Quality task created');
      queryClient.invalidateQueries({ queryKey: ['quality-fms'] });
      setShowCreate(false);
      setCreateForm({ productName: '', sku: '', vendorName: '', inspectorName: '', orderedQuantity: '', remarks: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create task'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      fmsApi.updateQualityStatus(id, newStatus),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['quality-fms'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
  });

  const rows = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality FMS</h1>
          <p className="text-gray-500">Quality inspection and control tracking</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Quality Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search product, SKU, vendor..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setPage(1); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Tasks ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No quality tasks found</h3>
              <p className="text-gray-500 mt-1">Create a new quality inspection task to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Qty (Ordered)</TableHead>
                      <TableHead>Passed / Rejected</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((task: any) => (
                      <TableRow key={task.taskId}>
                        <TableCell className="font-medium">{task.productName || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{task.sku || '-'}</TableCell>
                        <TableCell>{task.vendorName || '-'}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            {task.inspectorName || 'Unassigned'}
                          </span>
                        </TableCell>
                        <TableCell>{task.orderedQuantity || '-'}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{task.passedQuantity || 0}</span>
                          {' / '}
                          <span className="text-red-600 font-medium">{task.rejectedQuantity || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {task.scheduledDate ? formatDate(task.scheduledDate) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700'}>
                            {(task.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => statusMutation.mutate({ id: task.taskId, newStatus: 'in_progress' })}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => statusMutation.mutate({ id: task.taskId, newStatus: 'passed' })}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pass
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => statusMutation.mutate({ id: task.taskId, newStatus: 'failed' })}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Fail
                                </Button>
                              </>
                            )}
                            {task.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => statusMutation.mutate({ id: task.taskId, newStatus: 'rework_required' })}
                              >
                                Rework
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Quality Inspection Task</DialogTitle>
            <DialogDescription>Create a quality inspection task for a product</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={createForm.productName}
                  onChange={(e) => setCreateForm(f => ({ ...f, productName: e.target.value }))}
                  placeholder="Product name"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={createForm.sku}
                  onChange={(e) => setCreateForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
                <Input
                  value={createForm.vendorName}
                  onChange={(e) => setCreateForm(f => ({ ...f, vendorName: e.target.value }))}
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <Label>Inspector</Label>
                <Input
                  value={createForm.inspectorName}
                  onChange={(e) => setCreateForm(f => ({ ...f, inspectorName: e.target.value }))}
                  placeholder="Inspector name"
                />
              </div>
            </div>
            <div>
              <Label>Ordered Quantity</Label>
              <Input
                type="number"
                value={createForm.orderedQuantity}
                onChange={(e) => setCreateForm(f => ({ ...f, orderedQuantity: e.target.value }))}
                placeholder="Quantity"
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={createForm.remarks}
                onChange={(e) => setCreateForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Any special inspection notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                productName: createForm.productName,
                sku: createForm.sku,
                vendorName: createForm.vendorName,
                inspectorName: createForm.inspectorName,
                orderedQuantity: createForm.orderedQuantity ? Number(createForm.orderedQuantity) : undefined,
                remarks: createForm.remarks,
              })}
              disabled={createMutation.isPending || !createForm.productName}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
