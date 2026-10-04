'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  ArrowUpRight,
  User,
  Calendar,
  Building,
  Activity,
  Loader2,
  FileText,
  Timer,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useState, use } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  in_progress: { color: 'bg-blue-100 text-blue-700', icon: Play },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  delayed: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  escalated: { color: 'bg-red-100 text-red-700', icon: ArrowUpRight },
};

export default function TaskDetailPage({ params }: Props) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [completeDialog, setCompleteDialog] = useState(false);
  const [escalateDialog, setEscalateDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [escalationReason, setEscalationReason] = useState('');

  const { data: task, isLoading, refetch } = useQuery({
    queryKey: ['fms-task', id],
    queryFn: () => fmsApi.getTasks({ limit: 1 }).then((res) => {
      return { data: { data: [res.data?.data?.find((t: any) => t.taskId === id)] } };
    }),
    enabled: true,
  });

  const actualTask = task?.data?.data?.[0];

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: (data?: any) => fmsApi.completeTask(id, data),
    onSuccess: () => {
      toast.success('Task completed successfully');
      queryClient.invalidateQueries({ queryKey: ['fms-task', id] });
      queryClient.invalidateQueries({ queryKey: ['fms-tasks'] });
      setCompleteDialog(false);
      setNotes('');
      refetch();
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  // Escalate task mutation
  const escalateMutation = useMutation({
    mutationFn: (reason: string) => fmsApi.escalateTask(id, reason),
    onSuccess: () => {
      toast.success('Task escalated');
      queryClient.invalidateQueries({ queryKey: ['fms-task', id] });
      setEscalateDialog(false);
      setEscalationReason('');
      refetch();
    },
    onError: () => {
      toast.error('Failed to escalate task');
    },
  });

  // Start task mutation
  const startMutation = useMutation({
    mutationFn: () => fmsApi.completeTask(id, { status: 'in_progress' }),
    onSuccess: () => {
      toast.success('Task started');
      refetch();
    },
    onError: () => toast.error('Failed to start task'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!actualTask) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Task not found</h3>
        <Button asChild className="mt-4">
          <Link href="/dashboard/fms">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[actualTask.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const taskDueDate = actualTask.dueDate || actualTask.slaDeadline;
  const isOverdue = taskDueDate && new Date(taskDueDate) < new Date() && actualTask.status !== 'completed';
  const timeRemaining = taskDueDate
    ? Math.max(0, Math.ceil((new Date(taskDueDate).getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {actualTask.taskName || actualTask.taskCode}
              </h1>
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {actualTask.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-gray-500">
              Task ID: {actualTask.taskCode || actualTask.taskId?.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {actualTask.status === 'pending' && (
            <Button
              variant="outline"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Task
            </Button>
          )}
          {actualTask.status !== 'completed' && (
            <>
              <Button
                variant="outline"
                onClick={() => setEscalateDialog(true)}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Escalate
              </Button>
              <Button
                onClick={() => setCompleteDialog(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isOverdue && actualTask.status !== 'completed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Task is overdue</p>
                <p className="text-sm">Due date was {formatDate(taskDueDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Task Name</p>
                  <p className="font-medium">{actualTask.taskName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Task Code</p>
                  <p className="font-mono">{actualTask.taskCode || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1">{actualTask.description || 'No description'}</p>
              </div>

              {actualTask.remarks && (
                <div>
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="mt-1">{actualTask.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline / History */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Task Created</p>
                    <p className="text-sm text-gray-500">{formatDate(actualTask.createdAt)}</p>
                  </div>
                </div>

                {actualTask.status === 'in_progress' && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Play className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Task Started</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(actualTask.startedAt || actualTask.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {actualTask.status === 'completed' && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Task Completed</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(actualTask.completedAt)}
                      </p>
                      {actualTask.completionNotes && (
                        <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                          {actualTask.completionNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {actualTask.status === 'escalated' && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Task Escalated</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(actualTask.escalatedAt)}
                      </p>
                      {actualTask.escalationReason && (
                        <p className="text-sm mt-1 p-2 bg-red-50 rounded text-red-700">
                          {actualTask.escalationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">
                    {actualTask.assignedToUser?.name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {formatDate(actualTask.dueDate || actualTask.slaDeadline) || 'No due date'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Timer className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className={`font-medium ${timeRemaining && timeRemaining < 24 ? 'text-orange-600' : ''}`}>
                    {timeRemaining !== null
                      ? timeRemaining > 0
                        ? `${timeRemaining} hours`
                        : 'Overdue'
                      : 'No deadline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">
                    {actualTask.priority || 'normal'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Entity Type</p>
                  <p className="font-medium capitalize">
                    {actualTask.entityType?.replace(/_/g, ' ') || 'Sales Enquiry'}
                  </p>
                </div>
              </div>

              {actualTask.enquiryNumber && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Related Enquiry</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/sales/${actualTask.entityId}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      {actualTask.enquiryNumber}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Info */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">SLA Deadline</p>
                  <p className="font-medium">{formatDate(actualTask.slaDeadline)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Send className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Step</p>
                  <p className="font-medium">{actualTask.stepName || actualTask.stepCode || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>Mark this task as completed</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Completion Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the completion..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => completeMutation.mutate({ notes })}
              isLoading={completeMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Task</DialogTitle>
            <DialogDescription>
              Escalate this task to a manager or supervisor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Escalation *</Label>
              <Textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Explain why this task needs escalation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!escalationReason.trim()) {
                  toast.error('Please provide a reason for escalation');
                  return;
                }
                escalateMutation.mutate(escalationReason);
              }}
              isLoading={escalateMutation.isPending}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
