'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { XCircle, Search, RefreshCw, Eye, AlertTriangle, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  packing_issue: 'Packing Issue',
  expired: 'Expired',
  bet_ctn: 'Bet CTN',
  bent_ctn: 'Bent CTN',
  shortage_pcs_ctn: 'Shortage in PCS and CTN',
  different_item_as_po: 'Different Item as PO',
  infected: 'Infected',
  impacted: 'Impacted',
  infection_in_material: 'Infection in Material',
  moisture_damage: 'Moisture Damage',
  others: 'Others',
  short_kg: 'Short KG',
};

export default function RejectActionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [actionType, setActionType] = useState('');
  const [purchaseRemarks, setPurchaseRemarks] = useState('');
  const [replacementVendor, setReplacementVendor] = useState('');
  const [replacementEta, setReplacementEta] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reject-actions', page, search, status],
    queryFn: () =>
      qualityApi.getRejectActions({
        page,
        limit: 20,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }).then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      qualityApi.updateRejectAction(id, data),
    onSuccess: () => {
      toast.success('Reject action updated');
      queryClient.invalidateQueries({ queryKey: ['reject-actions'] });
      setSelectedAction(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update');
    },
  });

  const actions = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const pendingCount = actions.filter((a: any) => a.status === 'pending').length;
  const inProgressCount = actions.filter((a: any) => a.status === 'in_progress').length;
  const totalRejectedQty = actions.reduce((sum: number, a: any) => sum + Number(a.rejectedQty || 0), 0);

  const openAction = (item: any) => {
    setSelectedAction(item);
    setActionType(item.actionType || 'packing_issue');
    setPurchaseRemarks(item.purchaseRemarks || '');
    setReplacementVendor(item.replacementVendor || '');
    setReplacementEta(item.replacementEta ? new Date(item.replacementEta).toISOString().split('T')[0] : '');
  };

  const handleUpdate = () => {
    if (!selectedAction) return;
    const payload: any = {
      actionType,
      purchaseRemarks,
      status: 'in_progress',
    };
    updateMutation.mutate({ id: selectedAction.actionId, data: payload });
  };

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Reject Actions" description="Track rejected material actions and resolutions">
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Action</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2"><Package className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rejected Qty</p>
                <p className="text-2xl font-bold">{totalRejectedQty}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Reject Action List</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search actions..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <XCircle className="mb-2 h-10 w-10" />
              <p>No reject actions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Rejected Qty</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((item: any) => {
                    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                    return (
                      <TableRow key={item.actionId}>
                        <TableCell className="font-medium">{item.actionNumber}</TableCell>
                        <TableCell>{item.productName || '—'}</TableCell>
                        <TableCell>{item.vendorName || '—'}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{Number(item.rejectedQty || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ACTION_TYPE_LABELS[item.actionType] || item.actionType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={item.status === 'pending' ? 'default' : 'outline'}
                            onClick={() => openAction(item)}
                          >
                            {item.status === 'pending' ? (
                              <>Take Action</>
                            ) : (
                              <><Eye className="mr-1 h-3 w-3" />View</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {actions.length} of {total} actions
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
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

      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Reject Action — {selectedAction.actionNumber}</h2>
              <button onClick={() => setSelectedAction(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{selectedAction.productName}</span>
                <span className="text-muted-foreground">GRN Ref:</span>
                <span className="font-medium">{selectedAction.referenceNo || '—'}</span>
                <span className="text-muted-foreground">Rejected Qty:</span>
                <span className="font-medium text-red-600">{Number(selectedAction.rejectedQty)}</span>
                <span className="text-muted-foreground">QC Remarks:</span>
                <span className="font-medium">{selectedAction.qualityRemarks || '—'}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-sm">Purchase Decision</h3>

              <div>
                <label className="text-sm font-medium mb-1 block">Action Type</label>
                <Select value={actionType} onValueChange={setActionType} disabled={selectedAction.status === 'completed'}>
                  <SelectTrigger style={{ backgroundColor: selectedAction.status !== 'completed' ? '#fcfeff' : undefined }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="packing_issue">Packing Issue</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="bet_ctn">Bet CTN</SelectItem>
                    <SelectItem value="bent_ctn">Bent CTN</SelectItem>
                    <SelectItem value="shortage_pcs_ctn">Shortage in PCS and CTN</SelectItem>
                    <SelectItem value="different_item_as_po">Different Item as PO</SelectItem>
                    <SelectItem value="infected">Infected</SelectItem>
                    <SelectItem value="impacted">Impacted</SelectItem>
                    <SelectItem value="infection_in_material">Infection in Material</SelectItem>
                    <SelectItem value="moisture_damage">Moisture Damage</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                    <SelectItem value="short_kg">Short KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {false && (
                <div className="space-y-3 rounded-md border p-3 bg-gray-50">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Replacement Vendor</label>
                    <Input
                      value={replacementVendor}
                      onChange={(e) => setReplacementVendor(e.target.value)}
                      placeholder="Vendor name"
                      disabled={selectedAction.status === 'completed'}
                      style={{ backgroundColor: '#fcfeff' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expected Delivery</label>
                    <Input
                      type="date"
                      value={replacementEta}
                      onChange={(e) => setReplacementEta(e.target.value)}
                      disabled={selectedAction.status === 'completed'}
                      style={{ backgroundColor: '#fcfeff' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Purchase Remarks</label>
                <Textarea
                  value={purchaseRemarks}
                  onChange={(e) => setPurchaseRemarks(e.target.value)}
                  placeholder="Add remarks for this reject action..."
                  rows={3}
                  disabled={selectedAction.status === 'completed'}
                  style={{ backgroundColor: '#fcfeff' }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedAction(null)}>Cancel</Button>
              {selectedAction.status !== 'completed' && (
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Update & Process'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
