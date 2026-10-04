'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Warehouse,
  Boxes,
  RefreshCw,
  DollarSign,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  in_stock: { label: 'In Stock', color: 'text-green-700', bgColor: 'bg-green-100' },
  low_stock: { label: 'Low Stock', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-700', bgColor: 'bg-red-100' },
  overstocked: { label: 'Overstocked', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

export default function StockPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [warehouse, setWarehouse] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    currentStock: number;
    sku: string;
  } | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'increase' as 'increase' | 'decrease',
    quantity: '',
    reason: '',
    remarks: '',
  });

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  });

  // Fetch stock data
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['inventory-stock', { page, warehouse, status, search: debouncedSearch }],
    queryFn: () => inventoryApi.getStock({
      page,
      limit: 20,
      ...(warehouse !== 'all' ? { warehouseId: warehouse } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
  });

  // Fetch stock summary
  const { data: summaryData } = useQuery({
    queryKey: ['inventory-stock-summary', { warehouse }],
    queryFn: () => inventoryApi.getStockSummary(warehouse !== 'all' ? warehouse : undefined),
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-summary'] });
      setAdjustDialog(null);
      setAdjustForm({ type: 'increase', quantity: '', reason: '', remarks: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    },
  });

  const handleAdjust = () => {
    if (!adjustDialog || !adjustForm.quantity || !adjustForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    adjustMutation.mutate({
      productId: adjustDialog.productId,
      warehouseId: warehouse !== 'all' ? warehouse : warehousesData?.data?.[0]?.id,
      quantity: parseFloat(adjustForm.quantity),
      type: adjustForm.type,
      reason: adjustForm.reason,
      remarks: adjustForm.remarks,
    });
  };

  const stocks = stockData?.data?.data || [];
  const summary = summaryData?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
          <p className="text-gray-500">Monitor and manage inventory levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{summary.totalProducts || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">
                  ${(summary.totalValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.lowStockCount || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{summary.outOfStockCount || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={warehouse} onValueChange={(v) => { setWarehouse(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehousesData?.data?.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="overstocked">Overstocked</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setWarehouse('all');
                setStatus('all');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Items</CardTitle>
          <CardDescription>
            Showing {stocks.length} of {stockData?.data?.total || 0} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : stocks.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock: any) => {
                    const stockLevel = parseFloat(stock.currentStock) || 0;
                    const reorderLevel = parseFloat(stock.reorderLevel) || 0;
                    const maxLevel = parseFloat(stock.maxStockLevel) || 0;

                    let stockStatus = 'in_stock';
                    if (stockLevel === 0) stockStatus = 'out_of_stock';
                    else if (stockLevel <= reorderLevel) stockStatus = 'low_stock';
                    else if (stockLevel > maxLevel) stockStatus = 'overstocked';

                    const statusConfig = STATUS_CONFIG[stockStatus] || STATUS_CONFIG.in_stock;

                    return (
                      <TableRow key={stock.stockId}>
                        <TableCell className="font-medium">
                          {stock.productName || stock.product?.productName || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {stock.sku || stock.product?.sku || '-'}
                        </TableCell>
                        <TableCell>
                          {stock.warehouseName || stock.warehouse?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {stockLevel.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {reorderLevel.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.bgColor} variant="secondary">
                            <span className={statusConfig.color}>{statusConfig.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setAdjustDialog({
                                open: true,
                                productId: stock.productId,
                                productName: stock.productName || stock.product?.productName || '',
                                currentStock: stockLevel,
                                sku: stock.sku || stock.product?.sku || '',
                              })
                            }
                          >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {stockData?.data?.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (stockData?.data?.totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No stock items found</h3>
              <p className="text-gray-500 mt-1">
                {search || warehouse !== 'all' || status !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Stock items will appear here when inventory is recorded'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialog?.open || false} onOpenChange={(open) => !open && setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>

          {adjustDialog && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{adjustDialog.productName}</p>
                <p className="text-sm text-gray-500">SKU: {adjustDialog.sku}</p>
                <p className="text-sm text-gray-500">
                  Current Stock: <span className="font-semibold">{adjustDialog.currentStock}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustForm.type}
                  onValueChange={(v) => setAdjustForm({ ...adjustForm, type: v as 'increase' | 'decrease' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase Stock</SelectItem>
                    <SelectItem value="decrease">Decrease Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select
                  value={adjustForm.reason}
                  onValueChange={(v) => setAdjustForm({ ...adjustForm, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged Goods</SelectItem>
                    <SelectItem value="expired">Expired Goods</SelectItem>
                    <SelectItem value="count_correction">Count Correction</SelectItem>
                    <SelectItem value="theft">Theft/Loss</SelectItem>
                    <SelectItem value="returned">Returned Goods</SelectItem>
                    <SelectItem value="received">Goods Received</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  value={adjustForm.remarks}
                  onChange={(e) => setAdjustForm({ ...adjustForm, remarks: e.target.value })}
                  placeholder="Optional remarks"
                />
              </div>

              {adjustForm.quantity && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    New stock level will be:{' '}
                    <span className="font-semibold">
                      {adjustForm.type === 'increase'
                        ? adjustDialog.currentStock + parseFloat(adjustForm.quantity || '0')
                        : Math.max(0, adjustDialog.currentStock - parseFloat(adjustForm.quantity || '0'))}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={adjustMutation.isPending}
            >
              {adjustMutation.isPending ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
