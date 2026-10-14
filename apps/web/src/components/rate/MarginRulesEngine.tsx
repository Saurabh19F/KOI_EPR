'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
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
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Percent,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MarginRule {
  ruleId: string;
  name: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  customerType?: string;
  country?: string;
  currency?: string;
  minMarginPercentage: number;
  maxDiscountPercentage: number;
  approvalRequiredAbove?: number;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
}

interface MarginRulesEngineProps {
  onApplyRule?: (rule: MarginRule, productData: any) => any;
}

const CUSTOMER_TYPES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR', 'EXPORT', 'GOVT'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export function MarginRulesEngine({ onApplyRule }: MarginRulesEngineProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<MarginRule | null>(null);
  const [formData, setFormData] = useState<Partial<MarginRule>>({});

  // Fetch margin rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['margin-rules'],
    queryFn: () => mastersApi.getMarginRules(),
  });

  const rulesList: MarginRule[] = rules?.data || [];

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingRule
        ? mastersApi.updateMarginRule(editingRule.ruleId, data)
        : mastersApi.createMarginRule(data),
    onSuccess: () => {
      toast.success(editingRule ? 'Rule updated' : 'Rule created');
      queryClient.invalidateQueries({ queryKey: ['margin-rules'] });
      closeDialog();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to save'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => mastersApi.deleteMarginRule(ruleId),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['margin-rules'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to delete'),
  });

  const handleNewRule = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      minMarginPercentage: 10,
      maxDiscountPercentage: 5,
      isDefault: false,
      priority: rulesList.length + 1,
      isActive: true,
    });
    setShowDialog(true);
  };

  const handleEditRule = (rule: MarginRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.minMarginPercentage) {
      toast.error('Please fill required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingRule(null);
    setFormData({});
  };

  // Find applicable rule for a product
  const findApplicableRule = (
    product: { categoryId?: string; brandId?: string; country?: string },
    customerType?: string
  ): MarginRule | null => {
    // Priority order: specific > general
    const sortedRules = [...rulesList]
      .filter((r) => r.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const matchesCategory = !rule.categoryId || rule.categoryId === product.categoryId;
      const matchesBrand = !rule.brandId || rule.brandId === product.brandId;
      const matchesCountry = !rule.country || rule.country === product.country;
      const matchesCustomer = !rule.customerType || rule.customerType === customerType;

      if (matchesCategory && matchesBrand && matchesCountry && matchesCustomer) {
        return rule;
      }
    }

    // Return default rule
    return sortedRules.find((r) => r.isDefault) || null;
  };

  // Calculate margin with rule
  const calculateWithMargin = (
    landingCost: number,
    rule: MarginRule
  ): { sellingPrice: number; marginAmount: number; marginPercentage: number } => {
    const minSellingPrice = landingCost / (1 - rule.minMarginPercentage / 100);
    const maxDiscountAmount = minSellingPrice * (rule.maxDiscountPercentage / 100);
    const sellingPrice = minSellingPrice;
    const marginAmount = sellingPrice - landingCost;
    const marginPercentage = (marginAmount / sellingPrice) * 100;

    return { sellingPrice, marginAmount, marginPercentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Margin Rules Engine
          </h3>
          <p className="text-sm text-gray-500">
            Configure margin rules by category, brand, or customer type
          </p>
        </div>
        <Button onClick={handleNewRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Rules Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead className="text-right">Min Margin %</TableHead>
                  <TableHead className="text-right">Max Discount %</TableHead>
                  <TableHead>Approval Above</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesList.length > 0 ? (
                  rulesList.map((rule) => (
                    <TableRow key={rule.ruleId}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-sm text-gray-500">{rule.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.categoryName && (
                            <Badge variant="outline" className="text-xs">
                              {rule.categoryName}
                            </Badge>
                          )}
                          {rule.brandName && (
                            <Badge variant="outline" className="text-xs">
                              {rule.brandName}
                            </Badge>
                          )}
                          {rule.customerType && (
                            <Badge variant="outline" className="text-xs">
                              {rule.customerType}
                            </Badge>
                          )}
                          {rule.country && (
                            <Badge variant="outline" className="text-xs">
                              {rule.country}
                            </Badge>
                          )}
                          {!rule.categoryName && !rule.brandName && !rule.customerType && (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              All Products
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rule.minMarginPercentage}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rule.maxDiscountPercentage}%
                      </TableCell>
                      <TableCell>
                        {rule.approvalRequiredAbove ? (
                          <span className="text-sm">₹{rule.approvalRequiredAbove.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rule.isDefault && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(rule.ruleId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No margin rules configured. Add rules to enforce margin policies.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Margin Rule' : 'Add Margin Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure margin rules for products and customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Category Margin"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Margin % *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.minMarginPercentage || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, minMarginPercentage: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Max Discount %</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.maxDiscountPercentage || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscountPercentage: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Approval Required Above (₹)</Label>
                <Input
                  type="number"
                  value={formData.approvalRequiredAbove || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, approvalRequiredAbove: parseFloat(e.target.value) || undefined })
                  }
                  placeholder="100000"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault || false}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isDefault">Set as default rule</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            {/* Preview */}
            {formData.minMarginPercentage && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Rule Preview</p>
                <p className="text-sm text-blue-700 mt-1">
                  For a product with ₹100 landing cost, minimum selling price would be:
                  <span className="font-bold"> ₹{(100 / (1 - (formData.minMarginPercentage || 0) / 100)).toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MarginRulesEngine;