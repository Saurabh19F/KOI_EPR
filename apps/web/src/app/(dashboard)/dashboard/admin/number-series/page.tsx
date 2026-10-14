'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Hash, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface NumberSeriesForm {
  id?: string;
  module: string;
  prefix: string;
  suffix: string;
  startingNumber: number;
  currentNumber: number;
  padding: number;
  isActive: boolean;
  description: string;
}

const MODULE_OPTIONS = [
  { value: 'sales_enquiry', label: 'Sales Enquiry' },
  { value: 'purchase_quote', label: 'Purchase Quote' },
  { value: 'rate_analysis', label: 'Rate Analysis' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'sales_order', label: 'Sales Order' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'purchase_invoice', label: 'Purchase Invoice' },
  { value: 'grn', label: 'GRN' },
  { value: 'challan', label: 'Delivery Challan' },
];

const EMPTY_FORM: NumberSeriesForm = {
  module: '',
  prefix: '',
  suffix: '',
  startingNumber: 1,
  currentNumber: 1,
  padding: 4,
  isActive: true,
  description: '',
};

export default function NumberSeriesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<NumberSeriesForm | null>(null);
  const [form, setForm] = useState<NumberSeriesForm>(EMPTY_FORM);

  // Fetch number series
  const { data, isLoading } = useQuery({
    queryKey: ['number-series'],
    queryFn: () => adminApi.getNumberSeries(),
  });

  const createMutation = useMutation({
    mutationFn: (data: NumberSeriesForm) => adminApi.createNumberSeries(data),
    onSuccess: () => {
      toast.success('Number series created successfully');
      queryClient.invalidateQueries({ queryKey: ['number-series'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create number series'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NumberSeriesForm }) =>
      adminApi.updateNumberSeries(id, data),
    onSuccess: () => {
      toast.success('Number series updated successfully');
      queryClient.invalidateQueries({ queryKey: ['number-series'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update number series'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNumberSeries(id),
    onSuccess: () => {
      toast.success('Number series deleted');
      queryClient.invalidateQueries({ queryKey: ['number-series'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminApi.resetNumberSeries(id),
    onSuccess: () => {
      toast.success('Number series reset successfully');
      queryClient.invalidateQueries({ queryKey: ['number-series'] });
    },
    onError: () => toast.error('Failed to reset'),
  });

  const seriesList = data?.data || [];

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSeries(null);
    setForm(EMPTY_FORM);
  };

  const openEditDialog = (series: any) => {
    setEditingSeries(series);
    setForm({
      id: series.id,
      module: series.module,
      prefix: series.prefix || '',
      suffix: series.suffix || '',
      startingNumber: series.startingNumber,
      currentNumber: series.currentNumber,
      padding: series.padding,
      isActive: series.isActive ?? true,
      description: series.description || '',
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingSeries(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.module) {
      toast.error('Please select a module');
      return;
    }
    if (!form.prefix) {
      toast.error('Please enter a prefix');
      return;
    }

    if (editingSeries?.id) {
      updateMutation.mutate({ id: editingSeries.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleFieldChange = (field: keyof NumberSeriesForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generatePreview = (s: NumberSeriesForm) => {
    const num = String(s.currentNumber).padStart(s.padding, '0');
    return `${s.prefix}${num}${s.suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Number Series</h1>
          <p className="text-slate-500 mt-1">Configure automatic numbering for documents</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Series
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Starting</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : seriesList.length ? (
                seriesList.map((series: any) => (
                  <TableRow key={series.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {MODULE_OPTIONS.find((m) => m.value === series.module)?.label || series.module}
                        </span>
                      </div>
                      {series.description && (
                        <p className="text-xs text-slate-500 mt-1">{series.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{series.prefix || '-'}</TableCell>
                    <TableCell>{series.startingNumber}</TableCell>
                    <TableCell>{series.currentNumber}</TableCell>
                    <TableCell className="font-mono text-primary-600">
                      {generatePreview(series)}
                    </TableCell>
                    <TableCell>
                      {series.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resetMutation.mutate(series.id)}
                          title="Reset to starting number"
                        >
                          <RefreshCw className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(series)}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this number series?')) {
                              deleteMutation.mutate(series.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Hash className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No number series configured</p>
                    <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Series
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSeries ? 'Edit Number Series' : 'Add Number Series'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Module *</Label>
              <Select
                value={form.module}
                onValueChange={(v) => handleFieldChange('module', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prefix *</Label>
                <Input
                  value={form.prefix}
                  onChange={(e) => handleFieldChange('prefix', e.target.value.toUpperCase())}
                  placeholder="ENQ"
                  className="uppercase font-mono"
                />
              </div>
              <div>
                <Label>Suffix</Label>
                <Input
                  value={form.suffix}
                  onChange={(e) => handleFieldChange('suffix', e.target.value.toUpperCase())}
                  placeholder="/24-25"
                  className="uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Starting Number</Label>
                <Input
                  type="number"
                  value={form.startingNumber}
                  onChange={(e) => handleFieldChange('startingNumber', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div>
                <Label>Current Number</Label>
                <Input
                  type="number"
                  value={form.currentNumber}
                  onChange={(e) => handleFieldChange('currentNumber', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div>
                <Label>Padding</Label>
                <Input
                  type="number"
                  value={form.padding}
                  onChange={(e) => handleFieldChange('padding', parseInt(e.target.value) || 4)}
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Preview</p>
              <p className="font-mono text-lg font-semibold text-primary-600">
                {generatePreview(form) || 'ENQ0001'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSeries ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
