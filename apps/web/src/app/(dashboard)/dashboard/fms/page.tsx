'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  ArrowUpRight,
  User,
  Calendar,
} from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'escalated', label: 'Escalated' },
];

export default function FmsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [completingTask, setCompletingTask] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['fms-tasks', { page, status }],
    queryFn: () => fmsApi.getTasks({
      page,
      limit: 20,
      ...(status !== 'all' ? { status } : {}),
    }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['fms-dashboard-stats'],
    queryFn: () => fmsApi.getDashboardStats(),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => fmsApi.completeTask(id, data),
    onSuccess: () => {
      toast.success('Task completed successfully');
      queryClient.invalidateQueries({ queryKey: ['fms-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fms-dashboard-stats'] });
      setCompletingTask(null);
      setCompletionNotes('');
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fmsApi.escalateTask(id, reason),
    onSuccess: () => {
      toast.success('Task escalated');
      queryClient.invalidateQueries({ queryKey: ['fms-tasks'] });
    },
    onError: () => {
      toast.error('Failed to escalate task');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'delayed':
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FMS Tasks</h1>
          <p className="text-gray-500">Workflow task management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold">{statsData?.data?.totalTasks || 0}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{statsData?.data?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delayed</p>
                <p className="text-2xl font-bold text-red-600">{statsData?.data?.delayed || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statsData?.data?.completed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setStatus('all'); setPage(1); }}>
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
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
                    <TableHead>Task ID</TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.data.map((task: any) => (
                    <TableRow key={task.taskId}>
                      <TableCell className="font-mono text-sm">
                        {task.taskCode || task.taskId?.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span>{task.taskName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          {task.assignedToUser?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(task.dueDate || task.slaDeadline)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {task.status !== 'completed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCompletingTask(task)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt('Enter escalation reason:');
                                  if (reason) {
                                    escalateMutation.mutate({ id: task.taskId, reason });
                                  }
                                }}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/fms/${task.taskId}`}>
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
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="text-gray-500 mt-1">Tasks will appear here based on your workflow</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Task Dialog */}
      <Dialog open={!!completingTask} onOpenChange={() => setCompletingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{completingTask?.taskName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Task ID: {completingTask?.taskCode || completingTask?.taskId}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Completion Notes (Optional)</Label>
              <textarea
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add any notes about the completion..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                completeMutation.mutate({
                  id: completingTask.taskId,
                  data: completionNotes ? { notes: completionNotes } : undefined,
                });
              }}
              isLoading={completeMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
