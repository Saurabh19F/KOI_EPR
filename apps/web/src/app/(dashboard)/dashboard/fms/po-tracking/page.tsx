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
  PackageSearch,
  Truck,
  Calendar,
  MapPin,
  Ship,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'po_created', label: 'PO Created' },
  { value: 'vendor_confirmed', label: 'Vendor Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'at_port', label: 'At Port' },
  { value: 'customs_clearance', label: 'Customs Clearance' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'received', label: 'Received' },
  { value: 'delayed', label: 'Delayed' },
];

const STATUS_COLORS: Record<string, string> = {
  po_created: 'bg-gray-100 text-gray-700',
  vendor_confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-yellow-100 text-yellow-700',
  ready_to_ship: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-cyan-100 text-cyan-700',
  at_port: 'bg-orange-100 text-orange-700',
  customs_clearance: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  received: 'bg-teal-100 text-teal-700',
  delayed: 'bg-red-100 text-red-700',
};

const TRACKING_STEPS = [
  { key: 'po_created', label: 'PO' },
  { key: 'vendor_confirmed', label: 'Confirmed' },
  { key: 'in_production', label: 'Production' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'in_transit', label: 'Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'received', label: 'Received' },
];

function getStepIndex(status: string) {
  const idx = TRACKING_STEPS.findIndex(s => s.key === status);
  if (status === 'ready_to_ship') return 2.5;
  if (status === 'at_port' || status === 'customs_clearance') return 4.5;
  if (status === 'delayed') return -1;
  return idx >= 0 ? idx : 0;
}

export default function PoTrackingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    purchaseOrderNo: '',
    vendorName: '',
    buyerName: '',
    containerNumber: '',
    blNumber: '',
    portOfLoading: '',
    portOfDischarge: '',
    expectedDispatchDate: '',
    expectedArrivalDate: '',
    remarks: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['po-tracking', { page, status }],
    queryFn: () =>
      fmsApi.getPoTracking({
        page,
        limit: 20,
        ...(status !== 'all' ? { status } : {}),
      }),
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) => fmsApi.createPoTracking(formData),
    onSuccess: () => {
      toast.success('PO tracking entry created');
      queryClient.invalidateQueries({ queryKey: ['po-tracking'] });
      setShowCreate(false);
      setCreateForm({
        purchaseOrderNo: '', vendorName: '', buyerName: '', containerNumber: '',
        blNumber: '', portOfLoading: '', portOfDischarge: '', expectedDispatchDate: '',
        expectedArrivalDate: '', remarks: '',
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create tracking'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      fmsApi.updatePoTrackingStatus(id, newStatus),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['po-tracking'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const rows = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Get next possible status for a given status
  const getNextStatus = (current: string) => {
    const order = ['po_created', 'vendor_confirmed', 'in_production', 'ready_to_ship', 'shipped', 'in_transit', 'at_port', 'customs_clearance', 'delivered', 'received'];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PO Tracking</h1>
          <p className="text-gray-500">Track purchase orders from creation to receipt</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Tracking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search PO number, vendor..."
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
          <CardTitle>Tracking Entries ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <PackageSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No tracking entries</h3>
              <p className="text-gray-500 mt-1">Create a PO tracking entry to monitor shipments</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Container / B/L</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Dispatch</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Delay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((entry: any) => {
                      const next = getNextStatus(entry.status);
                      return (
                        <TableRow key={entry.trackingId}>
                          <TableCell className="font-mono text-sm">{entry.trackingNumber || '-'}</TableCell>
                          <TableCell className="font-medium">{entry.purchaseOrderNo || '-'}</TableCell>
                          <TableCell>{entry.vendorName || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {entry.containerNumber && (
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3 text-gray-400" />
                                  {entry.containerNumber}
                                </span>
                              )}
                              {entry.blNumber && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Ship className="h-3 w-3 text-gray-400" />
                                  {entry.blNumber}
                                </span>
                              )}
                              {!entry.containerNumber && !entry.blNumber && '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.portOfLoading || entry.portOfDischarge ? (
                              <span className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                {entry.portOfLoading || '?'} → {entry.portOfDischarge || '?'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {entry.actualDispatchDate
                                ? formatDate(entry.actualDispatchDate)
                                : entry.expectedDispatchDate
                                  ? formatDate(entry.expectedDispatchDate)
                                  : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {entry.expectedArrivalDate ? formatDate(entry.expectedArrivalDate) : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.delayDays != null && entry.delayDays > 0 ? (
                              <Badge className="bg-red-100 text-red-700">{entry.delayDays}d late</Badge>
                            ) : (
                              <span className="text-green-600 text-sm">On time</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-700'}>
                              {(entry.status || '').replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {next && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => statusMutation.mutate({ id: entry.trackingId, newStatus: next })}
                                disabled={statusMutation.isPending}
                              >
                                → {next.replace(/_/g, ' ')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
            <DialogTitle>New PO Tracking Entry</DialogTitle>
            <DialogDescription>Track a purchase order through the supply chain</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PO Number *</Label>
                <Input
                  value={createForm.purchaseOrderNo}
                  onChange={(e) => setCreateForm(f => ({ ...f, purchaseOrderNo: e.target.value }))}
                  placeholder="PO-2026-001"
                />
              </div>
              <div>
                <Label>Vendor *</Label>
                <Input
                  value={createForm.vendorName}
                  onChange={(e) => setCreateForm(f => ({ ...f, vendorName: e.target.value }))}
                  placeholder="Vendor name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buyer Name</Label>
                <Input
                  value={createForm.buyerName}
                  onChange={(e) => setCreateForm(f => ({ ...f, buyerName: e.target.value }))}
                  placeholder="Buyer/Customer"
                />
              </div>
              <div>
                <Label>Container Number</Label>
                <Input
                  value={createForm.containerNumber}
                  onChange={(e) => setCreateForm(f => ({ ...f, containerNumber: e.target.value }))}
                  placeholder="CONT-123456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>B/L Number</Label>
                <Input
                  value={createForm.blNumber}
                  onChange={(e) => setCreateForm(f => ({ ...f, blNumber: e.target.value }))}
                  placeholder="Bill of Lading"
                />
              </div>
              <div>
                <Label>Port of Loading</Label>
                <Input
                  value={createForm.portOfLoading}
                  onChange={(e) => setCreateForm(f => ({ ...f, portOfLoading: e.target.value }))}
                  placeholder="Loading port"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Port of Discharge</Label>
                <Input
                  value={createForm.portOfDischarge}
                  onChange={(e) => setCreateForm(f => ({ ...f, portOfDischarge: e.target.value }))}
                  placeholder="Discharge port"
                />
              </div>
              <div>
                <Label>Expected Dispatch</Label>
                <Input
                  type="date"
                  value={createForm.expectedDispatchDate}
                  onChange={(e) => setCreateForm(f => ({ ...f, expectedDispatchDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expected Arrival</Label>
                <Input
                  type="date"
                  value={createForm.expectedArrivalDate}
                  onChange={(e) => setCreateForm(f => ({ ...f, expectedArrivalDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={createForm.remarks}
                onChange={(e) => setCreateForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Any tracking notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                purchaseOrderNo: createForm.purchaseOrderNo,
                vendorName: createForm.vendorName,
                buyerName: createForm.buyerName,
                containerNumber: createForm.containerNumber || undefined,
                blNumber: createForm.blNumber || undefined,
                portOfLoading: createForm.portOfLoading || undefined,
                portOfDischarge: createForm.portOfDischarge || undefined,
                expectedDispatchDate: createForm.expectedDispatchDate || undefined,
                expectedArrivalDate: createForm.expectedArrivalDate || undefined,
                remarks: createForm.remarks || undefined,
              })}
              disabled={createMutation.isPending || !createForm.purchaseOrderNo || !createForm.vendorName}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
