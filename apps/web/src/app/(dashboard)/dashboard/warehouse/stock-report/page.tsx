'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Package,
  Search,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockReportPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-report', selectedWarehouse, search],
    queryFn: () => inventoryApi.getStockSummary(selectedWarehouse !== 'all' ? selectedWarehouse : undefined),
  });

  const { data: valuation } = useQuery({
    queryKey: ['stock-valuation', selectedWarehouse],
    queryFn: () => inventoryApi.getStockValuation(selectedWarehouse !== 'all' ? selectedWarehouse : undefined),
  });

  const warehouseList = warehouses?.data || [];
  const stockItems = stockData?.data?.items || stockData?.data || [];
  const valuationData = valuation?.data || {};

  const filteredItems = Array.isArray(stockItems)
    ? stockItems.filter((item: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          item.productName?.toLowerCase().includes(s) ||
          item.sku?.toLowerCase().includes(s) ||
          item.name?.toLowerCase().includes(s)
        );
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Report</h1>
          <p className="text-muted-foreground">Current stock levels across warehouses</p>
        </div>
        <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredItems.reduce((sum: number, i: any) => sum + (i.quantity || i.currentStock || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(valuationData.totalValue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouseList.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item: any, idx: number) => {
                const qty = item.quantity || item.currentStock || 0;
                const price = item.unitPrice || item.averageCost || 0;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productName || item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.sku || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.warehouseName || '-'}</TableCell>
                    <TableCell className="text-right">{qty.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(qty * price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={qty > (item.reorderLevel || 10) ? 'default' : qty > 0 ? 'secondary' : 'destructive'}>
                        {qty > (item.reorderLevel || 10) ? 'In Stock' : qty > 0 ? 'Low' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {isLoading ? 'Loading stock data...' : 'No stock records found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
