'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Eye,
  Copy,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailTemplateForm {
  id?: string;
  name: string;
  subject: string;
  body: string;
  module: string;
  isActive: boolean;
}

const MODULE_OPTIONS = [
  { value: 'sales_enquiry', label: 'Sales Enquiry' },
  { value: 'purchase_quote', label: 'Purchase Quote' },
  { value: 'rate_analysis', label: 'Rate Analysis' },
  { value: 'task_assignment', label: 'Task Assignment' },
  { value: 'approval', label: 'Approval' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'general', label: 'General' },
];

const VARIABLES_HELP = [
  { variable: '{{customerName}}', description: 'Customer/Vendor name' },
  { variable: '{{enquiryNumber}}', description: 'Enquiry number' },
  { variable: '{{quoteNumber}}', description: 'Quote number' },
  { variable: '{{companyName}}', description: 'Company name' },
  { variable: '{{userName}}', description: 'Current user name' },
  { variable: '{{date}}', description: 'Current date' },
  { variable: '{{link}}', description: 'Link to record' },
];

const EMPTY_FORM: EmailTemplateForm = {
  name: '',
  subject: '',
  body: '',
  module: 'general',
  isActive: true,
};

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateForm | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateForm | null>(null);
  const [form, setForm] = useState<EmailTemplateForm>(EMPTY_FORM);

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => adminApi.getEmailTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: EmailTemplateForm) => adminApi.createEmailTemplate(data),
    onSuccess: () => {
      toast.success('Template created successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create template'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmailTemplateForm }) =>
      adminApi.updateEmailTemplate(id, data),
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEmailTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const templates = data?.data || [];

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
  };

  const openEditDialog = (template: any) => {
    setEditingTemplate(template);
    setForm({
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      module: template.module,
      isActive: template.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openPreview = (template: any) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error('Please enter a template name');
      return;
    }
    if (!form.subject) {
      toast.error('Please enter a subject');
      return;
    }
    if (!form.body) {
      toast.error('Please enter email body');
      return;
    }

    if (editingTemplate?.id) {
      updateMutation.mutate({ id: editingTemplate.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleFieldChange = (field: keyof EmailTemplateForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const copyTemplate = (template: any) => {
    setEditingTemplate(null);
    setForm({
      name: `${template.name} (Copy)`,
      subject: template.subject,
      body: template.body,
      module: template.module,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + variable }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-slate-500 mt-1">Manage email templates for automated notifications</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : templates.length ? (
                templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {MODULE_OPTIONS.find((m) => m.value === template.module)?.label || template.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>
                      {template.isActive ? (
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
                          onClick={() => openPreview(template)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyTemplate(template)}
                          title="Copy"
                        >
                          <Copy className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              deleteMutation.mutate(template.id);
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
                  <TableCell colSpan={5} className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No email templates configured</p>
                    <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Template
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Email Template' : 'Add Email Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., Enquiry Acknowledgement"
                />
              </div>
              <div>
                <Label>Module</Label>
                <Select
                  value={form.module}
                  onValueChange={(v) => handleFieldChange('module', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div>
              <Label>Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                placeholder="e.g., Enquiry {{enquiryNumber}} Received"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Email Body *</Label>
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Insert Variable
                  </Button>
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-10">
                    {VARIABLES_HELP.map((v) => (
                      <button
                        key={v.variable}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded"
                        onClick={() => insertVariable(v.variable)}
                      >
                        <span className="font-mono text-primary-600">{v.variable}</span>
                        <span className="text-slate-500 ml-2">{v.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Textarea
                value={form.body}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                placeholder="Dear {{customerName}},&#10;&#10;Your enquiry {{enquiryNumber}} has been received.&#10;&#10;Best regards,&#10;{{companyName}}"
                rows={12}
                className="font-mono text-sm"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">To:</p>
              <p className="font-medium">customer@example.com</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Subject:</p>
              <p className="font-medium">{previewTemplate?.subject}</p>
            </div>
            <div className="border rounded-lg p-4 min-h-48">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                {previewTemplate?.body}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
