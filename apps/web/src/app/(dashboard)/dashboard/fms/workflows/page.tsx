'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmsApi } from '@/lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Pencil,
  Trash2,
  Workflow,
  Play,
  Square,
  ChevronRight,
  GripVertical,
  User,
  Clock,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  stepName: string;
  description: string;
  assigneeType: 'user' | 'role' | 'department';
  assigneeId: string;
  assigneeName: string;
  slaHours: number;
  slaType: 'hours' | 'days';
  approvalRequired: boolean;
  canSkip: boolean;
  isActive: boolean;
}

interface WorkflowForm {
  id?: string;
  workflowName: string;
  description: string;
  entityType: string;
  isActive: boolean;
  steps: WorkflowStep[];
}

const ENTITY_TYPES = [
  { value: 'sales_enquiry', label: 'Sales Enquiry' },
  { value: 'purchase_quote', label: 'Purchase Quote' },
  { value: 'rate_analysis', label: 'Rate Analysis' },
  { value: 'purchase_order', label: 'Purchase Order' },
];

const EMPTY_STEP: WorkflowStep = {
  id: `step_${Date.now()}`,
  stepName: '',
  description: '',
  assigneeType: 'user',
  assigneeId: '',
  assigneeName: '',
  slaHours: 24,
  slaType: 'hours',
  approvalRequired: false,
  canSkip: false,
  isActive: true,
};

const EMPTY_FORM: WorkflowForm = {
  workflowName: '',
  description: '',
  entityType: '',
  isActive: true,
  steps: [{ ...EMPTY_STEP }],
};

export default function WorkflowDefinitionsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [form, setForm] = useState<WorkflowForm>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch workflows
  const { data, isLoading } = useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: () => fmsApi.getWorkflows(),
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => fmsApi.getTasks(),
  });

  const createMutation = useMutation({
    mutationFn: (data: WorkflowForm) => fmsApi.createWorkflow(data),
    onSuccess: () => {
      toast.success('Workflow created successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-definitions'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create workflow'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkflowForm }) =>
      fmsApi.updateWorkflow(id, data),
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-definitions'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update workflow'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fmsApi.deleteWorkflow(id),
    onSuccess: () => {
      toast.success('Workflow deleted');
      queryClient.invalidateQueries({ queryKey: ['workflow-definitions'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const workflows = data?.data?.data || [];

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingWorkflow(null);
    setForm(EMPTY_FORM);
    setActiveTab('details');
  };

  const openEditDialog = (workflow: any) => {
    setEditingWorkflow(workflow);
    setForm({
      id: workflow.id,
      workflowName: workflow.workflowName,
      description: workflow.description || '',
      entityType: workflow.entityType,
      isActive: workflow.isActive ?? true,
      steps: workflow.steps?.length ? workflow.steps : [{ ...EMPTY_STEP }],
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingWorkflow(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.workflowName) {
      toast.error('Please enter a workflow name');
      return;
    }
    if (!form.entityType) {
      toast.error('Please select an entity type');
      return;
    }

    if (editingWorkflow?.id) {
      updateMutation.mutate({ id: editingWorkflow.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleFieldChange = (field: keyof WorkflowForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Step management
  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, { ...EMPTY_STEP, id: `step_${Date.now()}` }],
    }));
  };

  const removeStep = (stepId: string) => {
    if (form.steps.length <= 1) {
      toast.error('At least one step is required');
      return;
    }
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...form.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setForm((prev) => ({ ...prev, steps: newSteps }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Definitions</h1>
          <p className="text-slate-500 mt-1">Design and manage approval workflows</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Steps</TableHead>
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
              ) : workflows.length ? (
                workflows.map((workflow: any) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{workflow.workflowName}</span>
                      </div>
                      {workflow.description && (
                        <p className="text-xs text-slate-500 mt-1">{workflow.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ENTITY_TYPES.find((e) => e.value === workflow.entityType)?.label || workflow.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3 text-slate-400" />
                        <span>{workflow.steps?.length || 0} steps</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {workflow.isActive ? (
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
                          onClick={() => openEditDialog(workflow)}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this workflow?')) {
                              deleteMutation.mutate(workflow.id);
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
                    <Workflow className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No workflows configured</p>
                    <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Workflow
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="steps">
                Steps ({form.steps.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 m-0">
                <div>
                  <Label>Workflow Name *</Label>
                  <Input
                    value={form.workflowName}
                    onChange={(e) => handleFieldChange('workflowName', e.target.value)}
                    placeholder="e.g., Sales Enquiry Approval"
                  />
                </div>

                <div>
                  <Label>Entity Type *</Label>
                  <Select
                    value={form.entityType}
                    onValueChange={(v) => handleFieldChange('entityType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
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
              </TabsContent>

              {/* Steps Tab */}
              <TabsContent value="steps" className="space-y-4 m-0">
                <div className="space-y-4">
                  {form.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                            <Badge variant="outline">Step {index + 1}</Badge>
                            <Input
                              value={step.stepName}
                              onChange={(e) => updateStep(step.id, { stepName: e.target.value })}
                              placeholder="Step name"
                              className="w-48"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === 0}
                              onClick={() => moveStep(index, 'up')}
                            >
                              <ChevronRight className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === form.steps.length - 1}
                              onClick={() => moveStep(index, 'down')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(step.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Assignee Type</Label>
                            <Select
                              value={step.assigneeType}
                              onValueChange={(v) => updateStep(step.id, { assigneeType: v as 'user' | 'role' | 'department' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="role">Role</SelectItem>
                                <SelectItem value="department">Department</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Assignee</Label>
                            <Input
                              value={step.assigneeName}
                              onChange={(e) => updateStep(step.id, { assigneeName: e.target.value })}
                              placeholder="Enter name or ID"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">SLA (Hours)</Label>
                            <Input
                              type="number"
                              value={step.slaHours}
                              onChange={(e) => updateStep(step.id, { slaHours: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs">Options</Label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={step.approvalRequired}
                                  onChange={(e) => updateStep(step.id, { approvalRequired: e.target.checked })}
                                />
                                Approval
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={step.canSkip}
                                  onChange={(e) => updateStep(step.id, { canSkip: e.target.checked })}
                                />
                                Can Skip
                              </label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" onClick={addStep} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingWorkflow ? 'Update' : 'Create'} Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
