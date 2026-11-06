'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Send,
  Truck,
  CheckCircle,
  XCircle,
  PackageOpen,
  Calendar,
  Building2,
  FileText,
  Package,
  IndianRupee,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Draft', icon: FileText },
  submitted: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Submitted', icon: Send },
  dispatched: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Dispatched', icon: Truck },
  completed: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Completed', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled', icon: XCircle },
};

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string; icon: any; className: string }[]> = {
  draft: [
    { label: 'Submit to Vendor', nextStatus: 'submitted', icon: Send, className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ],
  submitted: [
    { label: 'Mark as Dispatched', nextStatus: 'dispatched', icon: Truck, className: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { label: 'Cancel', nextStatus: 'cancelled', icon: XCircle, className: 'border-red-300 text-red-700 hover:bg-red-50' },
  ],
  dispatched: [
    { label: 'Mark as Completed', nextStatus: 'completed', icon: CheckCircle, className: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number | string | null | undefined) {
  const val = Number(amount || 0);
  return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
}

export default function ReturnMaterialNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rmnId = params.id as string;

  const [remarksDialog, setRemarksDialog] = useState<{ open: boolean; status: string; label: string }>({
    open: false, status: '', label: '',
  });
  const [remarks, setRemarks] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rmn-detail', rmnId],
    queryFn: () => purchaseOrderApi.getReturnMaterialNote(rmnId),
  });

  const rmn = data?.data;

  const statusMutation = useMutation({
    mutationFn: ({ status, remarks: r }: { status: string; remarks?: string }) =>
      purchaseOrderApi.updateReturnMaterialNoteStatus(rmnId, status, r),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rmn-detail', rmnId] });
      setRemarksDialog({ open: false, status: '', label: '' });
      setRemarks('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const handleAction = (nextStatus: string, label: string) => {
    if (nextStatus === 'cancelled') {
      setRemarksDialog({ open: true, status: nextStatus, label });
    } else {
      statusMutation.mutate({ status: nextStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !rmn) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Failed to load Return Material Note.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[rmn.status] || STATUS_CONFIG.draft;
  const actions = STATUS_ACTIONS[rmn.status] || [];
  const StatusIcon = statusInfo.icon;

  const STATUS_STEPS = [
    { key: 'draft', label: 'Draft', icon: FileText },
    { key: 'submitted', label: 'Submitted', icon: Send },
    { key: 'dispatched', label: 'Dispatched', icon: Truck },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === rmn.status);
  const isCancelled = rmn.status === 'cancelled';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/purchase/return-material-notes')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{rmn.rmnNumber}</h1>
              <Badge className={`${statusInfo.color} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {rmn.vendorName} &bull; {rmn.poNumber || 'No PO'}
            </p>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.nextStatus}
                  size="sm"
                  variant={action.nextStatus === 'cancelled' ? 'outline' : 'default'}
                  className={action.className}
                  onClick={() => handleAction(action.nextStatus, action.label)}
                  disabled={statusMutation.isPending}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {statusMutation.isPending ? 'Updating...' : action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-0 overflow-x-auto py-2 sm:justify-center">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = currentStepIdx > i;
                const isCurrent = currentStepIdx === i;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${
                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
                      }`}>{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 mt-[-16px] ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="py-4 text-center">
            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">This return material note has been cancelled.</p>
            {rmn.notes && <p className="text-xs text-red-600 mt-1">Reason: {rmn.notes}</p>}
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor & PO Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Vendor Name</p>
                <p className="text-sm font-medium text-slate-900">{rmn.vendorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">GSTIN</p>
                <p className="text-sm font-medium text-slate-900">{rmn.vendorGstin || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">PO Number</p>
                <p className="text-sm font-medium text-blue-700">{rmn.poNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">RMN Date</p>
                <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(rmn.rmnDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product & Amount Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              Product & Return Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Product</p>
              <p className="text-sm font-medium text-slate-900">{rmn.productName || '-'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Return Qty</p>
                <p className="text-lg font-bold text-orange-600">{Number(rmn.returnQty || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Unit Price</p>
                <p className="text-sm font-medium text-slate-900 flex items-center gap-0.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Number(rmn.unitPrice || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="text-lg font-bold text-slate-900">{formatAmount(rmn.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reason & Notes */}
      {(rmn.reason || rmn.notes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageOpen className="h-4 w-4 text-slate-500" />
              Return Reason & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rmn.reason && (
              <div>
                <p className="text-xs text-slate-500">Reason for Return</p>
                <p className="text-sm text-slate-900 bg-orange-50 border border-orange-200 rounded-md p-3 mt-1">{rmn.reason}</p>
              </div>
            )}
            {rmn.notes && (
              <div>
                <p className="text-xs text-slate-500">Notes</p>
                <p className="text-sm text-slate-700 mt-1">{rmn.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel Remarks Dialog */}
      <Dialog open={remarksDialog.open} onOpenChange={(open) => { if (!open) setRemarksDialog({ open: false, status: '', label: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Return Material Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">Are you sure you want to cancel <strong>{rmn.rmnNumber}</strong>? Please provide a reason.</p>
            <Textarea
              placeholder="Enter cancellation reason..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksDialog({ open: false, status: '', label: '' })}>
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => statusMutation.mutate({ status: remarksDialog.status, remarks })}
              disabled={statusMutation.isPending || !remarks.trim()}
            >
              {statusMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
