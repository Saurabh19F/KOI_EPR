'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash,
  ToggleLeft,
  ToggleRight,
  Download,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface MastersCrudPageProps {
  title: string;
  singularName: string;
  moduleName: string;
  columns: { key: string; label: string; render?: (value: any, row?: any) => React.ReactNode }[];
  onBeforeOpenDialog?: () => void | Promise<void>;
  transformFormData?: (data: Record<string, string>, isEditing: boolean) => Record<string, any>;
  transformItemForEdit?: (item: any) => Record<string, string>;
  formFields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    halfWidth?: boolean;
    disabled?: boolean;
  }[];
}

export function MastersCrudPage({
  title,
  singularName,
  moduleName,
  columns,
  onBeforeOpenDialog,
  transformFormData,
  transformItemForEdit,
  formFields,
}: MastersCrudPageProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/masters/${moduleName}`, {
        params: { page, limit, search: debouncedSearch },
      });
      setItems(response.data.data || response.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast.error(`Failed to load ${title.toLowerCase()}`);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, moduleName]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getItemId = (item: any): string => {
    return item.id || item.categoryId || item.brandId || item.gstRateId || item.uomId || item.zoneId || '';
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => getItemId(item))));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === items.length);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} ${singularName.toLowerCase()}(s)?`)) return;

    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          api.delete(`/masters/${moduleName}/${id}`)
        )
      );

      const failed = results.filter((r) => r.status === 'rejected');
      const succeeded = results.length - failed.length;

      if (succeeded > 0) {
        toast.success(`${succeeded} ${singularName}(s) deleted successfully`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} ${singularName}(s)`);
      }

      setSelectedIds(new Set());
      setSelectAll(false);
      setShowBulkMenu(false);
      fetchData();
    } catch (error) {
      toast.error('Bulk delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk activate/deactivate
  const handleBulkToggleActive = async (activate: boolean) => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          api.patch(`/masters/${moduleName}/${id}`, { isActive: activate })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(`${succeeded} ${singularName}(s) ${activate ? 'activated' : 'deactivated'}`);

      setSelectedIds(new Set());
      setSelectAll(false);
      setShowBulkMenu(false);
      fetchData();
    } catch (error) {
      toast.error('Bulk update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = async (item?: any) => {
    await onBeforeOpenDialog?.();
    if (item) {
      setEditingItem(item);
      setFormData(transformItemForEdit ? transformItemForEdit(item) : item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingField = formFields.find((field) => field.required && !String(formData[field.name] ?? '').trim());
    if (missingField) {
      toast.error(`${missingField.label} is required`);
      return;
    }
    setIsSubmitting(true);

    const id = editingItem ? getItemId(editingItem) : null;
    const dataToSend = transformFormData ? transformFormData(formData, !!editingItem) : formData;

    try {
      if (id) {
        await api.patch(`/masters/${moduleName}/${id}`, dataToSend);
      } else {
        await api.post(`/masters/${moduleName}`, dataToSend);
      }

      toast.success(`${singularName} ${id ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      setFormData({});
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${id ? 'update' : 'create'} ${singularName.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to permanently delete this ${singularName.toLowerCase()}? This action cannot be undone.`)) return;
    const id = getItemId(item);

    try {
      await api.delete(`/masters/${moduleName}/${id}`);
      toast.success(`${singularName} deleted successfully`);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || `Failed to delete ${singularName.toLowerCase()}`;
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">Manage {title.toLowerCase()} master data</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add {singularName}
        </Button>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
            <span className="text-sm text-primary-700 font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              className="text-primary-700 hover:text-primary-800 hover:bg-primary-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectAll(false);
              }}
              className="text-primary-700 hover:text-primary-800 hover:bg-primary-100"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Bulk Actions Menu */}
            {showBulkMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => handleBulkToggleActive(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-gray-50"
                >
                  <ToggleRight className="h-4 w-4 text-green-600" />
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkToggleActive(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-gray-50"
                >
                  <ToggleLeft className="h-4 w-4 text-orange-600" />
                  Deactivate Selected
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleBulkDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-500">
                    No {title.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                items.map((item: any, index: number) => {
                  const itemId = getItemId(item);
                  const isSelected = selectedIds.has(itemId);
                  return (
                    <tr key={itemId || index} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelect(itemId)}
                          aria-label={`Select ${item[columns[0]?.key] || itemId}`}
                        />
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                          {col.render ? col.render(item[col.key], item) : item[col.key] ?? '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDialog(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="text-sm text-slate-500">
            Showing {total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${singularName}` : `Add ${singularName}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-4">
            {formFields.map((field) => (
              <div key={field.name} className={`space-y-2 ${field.halfWidth ? '' : 'col-span-2'}`}>
                <label className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}
                    disabled={field.disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder || field.label}
                    required={field.required}
                    disabled={field.disabled}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder || field.label}
                    required={field.required}
                    disabled={field.disabled}
                  />
                )}
              </div>
            ))}
            <div className="col-span-2 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
