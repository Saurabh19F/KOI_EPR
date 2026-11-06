'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivingPlanApi, inventoryApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, RefreshCw, MapPin, Truck, Package, CheckCircle } from 'lucide-react';

const OFFLOADING_AREAS = [
  'Dock A',
  'Dock B',
  'Dock C',
  'Bay 1',
  'Bay 2',
  'Bay 3',
  'Yard Area',
  'Cold Storage Bay',
  'Hazmat Zone',
  'Overflow Area',
];

export default function OffloadingPlanPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({
    offloadingLocation: '',
    offloadingNotes: '',
  });
  const [assignedLocations, setAssignedLocations] = useState<Map<string, string>>(new Map());
  const queryClient = useQueryClient();

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehouses?.data || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['offloading-plans', page, search],
    queryFn: () =>
      receivingPlanApi.getPlans({
        page,
        limit: 25,
        search: search || undefined,
        status: 'pending',
      }).then((res) => res.data),
  });

  const plans = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      receivingPlanApi.updatePlan(id, data),
    onSuccess: (_res, vars) => {
      toast.success('Offloading location assigned');
      setAssignedLocations((prev) => {
        const next = new Map(prev);
        next.set(vars.id, assignForm.offloadingLocation);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['offloading-plans'] });
      setShowAssignDialog(false);
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to assign location');
    },
  });

  const handleAssign = (plan: any) => {
    setSelectedPlan(plan);
    setAssignForm({
      offloadingLocation: plan.offloadingLocation || assignedLocations.get(plan.planId || plan.id) || '',
      offloadingNotes: plan.offloadingNotes || '',
    });
    setShowAssignDialog(true);
  };

  const handleSaveAssignment = () => {
    if (!assignForm.offloadingLocation) {
      toast.error('Please select an offloading location');
      return;
    }
    const planId = selectedPlan.planId || selectedPlan.id;
    updateMutation.mutate({
      id: planId,
      data: {
        offloadingLocation: assignForm.offloadingLocation,
        offloadingNotes: assignForm.offloadingNotes || undefined,
      },
    });
  };

  const locationUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const plan of plans) {
      const loc = plan.offloadingLocation || assignedLocations.get(plan.planId || plan.id);
      if (loc) {
        usage.set(loc, (usage.get(loc) || 0) + 1);
      }
    }
    return usage;
  }, [plans, assignedLocations]);

  const assignedCount = plans.filter((p: any) =>
    p.offloadingLocation || assignedLocations.has(p.planId || p.id)
  ).length;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Offloading Location Planning" description="Assign dock, bay, and offloading areas to incoming shipments">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Truck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Shipments</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><MapPin className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Location Assigned</p>
                <p className="text-2xl font-bold">{assignedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><Package className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold">{Math.max(0, total - assignedCount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {locationUsage.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(locationUsage.entries()).map(([loc, count]) => (
                <Badge key={loc} variant="outline" className="text-sm px-3 py-1">
                  <MapPin className="mr-1 h-3 w-3" />
                  {loc}: {count} shipment{count > 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Incoming Shipments</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PO, product..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="mb-2 h-10 w-10" />
              <p>No pending shipments to plan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Expected Date</TableHead>
                      <TableHead className="text-right">Expected Qty</TableHead>
                      <TableHead>Offloading Location</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan: any) => {
                      const planId = plan.planId || plan.id;
                      const loc = plan.offloadingLocation || assignedLocations.get(planId);
                      return (
                        <TableRow key={planId}>
                          <TableCell className="text-xs font-medium whitespace-nowrap">{plan.poNumber || '—'}</TableCell>
                          <TableCell>
                            <div className="text-sm">{plan.productName || plan.productId || '—'}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {plan.warehouseName || warehouseList.find((w: any) => w.id === plan.warehouseId)?.name || '—'}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {plan.expectedDate ? new Date(plan.expectedDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {Number(plan.expectedQty || plan.allocatedQty || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {loc ? (
                              <Badge variant="default" className="text-xs gap-1">
                                <CheckCircle className="h-3 w-3" /> {loc}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssign(plan)}
                            >
                              <MapPin className="mr-1 h-3 w-3" />
                              {loc ? 'Change' : 'Assign'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {plans.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAssignDialog} onOpenChange={(open) => { if (!open) { setShowAssignDialog(false); setSelectedPlan(null); } }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Assign Offloading Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedPlan && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm space-y-1">
                <div>PO: <strong>{selectedPlan.poNumber || '—'}</strong></div>
                <div>Product: <strong>{selectedPlan.productName || selectedPlan.productId || '—'}</strong></div>
                <div>Qty: <strong>{Number(selectedPlan.expectedQty || selectedPlan.allocatedQty || 0).toLocaleString()}</strong></div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-semibold">Offloading Location *</Label>
              <Select value={assignForm.offloadingLocation} onValueChange={(v) => setAssignForm(f => ({ ...f, offloadingLocation: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area / dock / bay" />
                </SelectTrigger>
                <SelectContent>
                  {OFFLOADING_AREAS.map((area) => {
                    const count = locationUsage.get(area) || 0;
                    return (
                      <SelectItem key={area} value={area}>
                        {area} {count > 0 ? `(${count} assigned)` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Notes</Label>
              <Input
                value={assignForm.offloadingNotes}
                onChange={(e) => setAssignForm(f => ({ ...f, offloadingNotes: e.target.value }))}
                placeholder="Special handling, equipment needed..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignDialog(false); setSelectedPlan(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Assign Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
