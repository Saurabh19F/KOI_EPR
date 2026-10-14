'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Search, Package, X, GripVertical } from 'lucide-react';

export interface LineItem {
  id: string;
  lineNo: number;
  productId?: string;
  sku?: string;
  productCode?: string;
  productName: string;
  productDescription?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  unitSize?: string;
  unitPerCarton?: number;
  uom?: string;
  unitBasis?: string;
  packingType?: string;
  packingSize?: number;
  cbmPerBox?: number;
  unitsPerCase?: number;
  totalCbm?: number;
  quantity: number;
  moq?: number;
  mrp?: number;
  expectedRate?: number;
  buyingPrice?: number;
  sellingRate?: number;
  gstPercent?: number;
  freight?: number;
  otherCost?: number;
  gstCost?: number;
  landingCost?: number;
  totalValue?: number;
  marginAmount?: number;
  marginPercent?: number;
  specialRequirement?: string;
  remarks?: string;
  // Additional fields
  unitPrice?: number;
  discount?: number;
  taxAmount?: number;
  netAmount?: number;
  deliveryDate?: string;
  status?: string;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
  showPricing?: boolean;
  currency?: string;
  showExpectedRate?: boolean;
  showPurchasePrice?: boolean;
  showSellingRate?: boolean;
  showMargin?: boolean;
  currencySymbol?: string;
}

export function LineItemsEditor({
  items,
  onChange,
  readOnly = false,
  showPricing = true,
  currency = 'INR',
  showExpectedRate = false,
  showPurchasePrice = false,
  showSellingRate = false,
  showMargin = false,
  currencySymbol = '₹',
}: LineItemsEditorProps) {
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => mastersApi.getProducts({ search: searchTerm, limit: 50 }),
    enabled: isProductDialogOpen,
  });

  // Fetch categories for display
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mastersApi.getCategories(),
  });

  const products = productsData?.data?.data || [];

  const addItem = (product?: any) => {
    const newItem: LineItem = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lineNo: items.length + 1,
      productId: product?.productId || '',
      sku: product?.sku || '',
      productCode: product?.productCode || '',
      productName: product?.productName || '',
      productDescription: product?.description || '',
      categoryId: product?.categoryId || '',
      categoryName: product?.category?.categoryName || '',
      brandId: product?.brandId || '',
      brandName: product?.brand?.brandName || '',
      uom: product?.uom?.uomCode || product?.uomCode || '',
      unitBasis: product?.unitBasis || '',
      packingSize: product?.packingSize,
      cbmPerBox: product?.cbmPerBox,
      unitsPerCase: product?.unitsPerCase,
      totalCbm: product?.totalCbm,
      mrp: product?.mrp,
      buyingPrice: product?.buyingPrice,
      landingCost: product?.landingCost,
      quantity: 1,
      totalValue: 0,
    };
    onChange([...items, newItem]);
    setIsProductDialogOpen(false);
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Recalculate total
        if (showPricing) {
          const qty = updated.quantity || 0;
          const rate = updated.unitPrice || updated.expectedRate || updated.buyingPrice || 0;
          const discount = updated.discount || 0;
          const subtotal = qty * rate * (1 - discount / 100);
          const taxPercent = updated.gstPercent || 0;
          const taxAmount = subtotal * (taxPercent / 100);
          updated.taxAmount = taxAmount;
          updated.netAmount = subtotal + taxAmount;
          updated.totalValue = subtotal + taxAmount;
        }
        return updated;
      }
      return item;
    });
    onChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    // Renumber items
    const renumbered = filtered.map((item, index) => ({
      ...item,
      lineNo: index + 1,
    }));
    onChange(renumbered);
  };

  const openEditDialog = (item: LineItem) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editingItem) {
      updateItem(editingItem.id, editingItem);
    }
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      quantity: acc.quantity + (item.quantity || 0),
      totalValue: acc.totalValue + (item.totalValue || item.netAmount || 0),
      taxAmount: acc.taxAmount + (item.taxAmount || 0),
    }),
    { quantity: 0, totalValue: 0, taxAmount: 0 }
  );

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return `${currencySymbol} ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900">Line Items</h3>
          <Badge variant="secondary">{items.length} items</Badge>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsProductDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        )}
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              {showPricing && (
                <>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </>
              )}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showPricing ? 8 : 5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Package className="h-8 w-8" />
                    <p>No items added yet</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsProductDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Item
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {item.lineNo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {item.sku || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      {item.productDescription && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {item.productDescription}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.categoryName || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="w-20 text-right h-8"
                      value={item.quantity || 0}
                      onChange={(e) =>
                        !readOnly && updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })
                      }
                      disabled={readOnly}
                    />
                  </TableCell>
                  {showPricing && (
                    <>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="w-28 text-right h-8"
                          value={item.unitPrice || item.expectedRate || item.buyingPrice || ''}
                          onChange={(e) =>
                            !readOnly &&
                            updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                          disabled={readOnly}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.netAmount || item.totalValue)}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Totals Footer */}
        {items.length > 0 && showPricing && (
          <div className="border-t bg-slate-50 px-4 py-3">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Quantity:</span>
                  <span className="font-medium">{totals.quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax Amount:</span>
                  <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(totals.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
          </DialogHeader>

          <div className="p-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, SKU, or code..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <TableRow key={product.productId} className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => addItem(product)}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {product.sku}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{product.productName}</p>
                        {product.description && (
                          <p className="text-xs text-slate-500 truncate max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{product.category?.categoryName || '-'}</TableCell>
                      <TableCell>{product.brand?.brandName || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.mrp)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Product</Label>
                  <Input value={editingItem.productName} disabled />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={editingItem.sku || ''} disabled />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={editingItem.categoryName || ''} disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={editingItem.quantity || 0}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={editingItem.unitPrice || editingItem.buyingPrice || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={editingItem.discount || 0}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, discount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    value={editingItem.gstPercent || 0}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, gstPercent: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>MRP</Label>
                  <Input
                    type="number"
                    value={editingItem.mrp || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, mrp: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CBM</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={editingItem.cbmPerBox || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, cbmPerBox: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <Label>Units per Case</Label>
                  <Input
                    type="number"
                    value={editingItem.unitsPerCase || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, unitsPerCase: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Special Requirements</Label>
                <Input
                  value={editingItem.specialRequirement || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, specialRequirement: e.target.value })
                  }
                  placeholder="Any special requirements..."
                />
              </div>

              <div>
                <Label>Remarks</Label>
                <Input
                  value={editingItem.remarks || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSave}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
