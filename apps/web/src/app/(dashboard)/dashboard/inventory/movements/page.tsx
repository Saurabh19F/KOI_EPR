'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowUpDown,
  ArrowRightLeft,
  ArrowDown,
  ArrowUp,
  Package,
  RefreshCw,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  purchase_receipt: { label: 'Purchase Receipt', color: 'text-green-700', bgColor: 'bg-green-100', icon: ArrowDown },
  sales_issue: { label: 'Sales Issue', color: 'text-red-700', bgColor: 'bg-red-100', icon: ArrowUp },
  transfer_in: { label: 'Transfer In', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: ArrowDown },
  transfer_out: { label: 'Transfer Out', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: ArrowUp },
  adjustment_in: { label: 'Adjustment In', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: ArrowUp },
  adjustment_out: { label: 'Adjustment Out', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: ArrowDown },
  damage: { label: 'Damage', color: 'text-red-700', bgColor: 'bg-red-100', icon: ArrowUp },
  return_in: { label: 'Return In', color: 'text-teal-700', bgColor: 'bg-teal-100', icon: ArrowDown },
  return_out: { label: 'Return Out', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: ArrowUp },
};

export default function MovementsPage() {
  const [warehouse, setWarehouse] = useState<string>('all');
  const [movementType, setMovementType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(dateRange);
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate: startDate.toISOString().split('T')[0], endDate: now.toISOString().split('T')[0] };
  };

  // Fetch movements
  const { data: movementsData, isLoading, refetch } = useQuery({
    queryKey: ['inventory-movements', { page, warehouse, movementType, dateRange }],
    queryFn: () => {
      const { startDate, endDate } = getDateRange();
      return inventoryApi.getMovements({
        page,
        limit: 20,
        ...(warehouse !== 'all' ? { warehouseId: warehouse } : {}),
        ...(movementType !== 'all' ? { movementType } : {}),
        startDate,
        endDate,
      });
    },
  });

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const movements = movementsData?.data?.data || [];

  // Calculate summary stats
  const stats = {
    total: movements.length,
    stockIn: movements.filter((m: any) =>
      ['purchase_receipt', 'transfer_in', 'adjustment_in', 'return_in'].includes(m.movementType)
    ).length,
    stockOut: movements.filter((m: any) =>
      ['sales_issue', 'transfer_out', 'adjustment_out', 'damage', 'return_out'].includes(m.movementType)
    ).length,
    adjustments: movements.filter((m: any) =>
      ['adjustment_in', 'adjustment_out'].includes(m.movementType)
    ).length,
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-500">Track inventory changes and transfers</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Movements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <ArrowUpDown className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stock In</p>
                <p className="text-2xl font-bold text-green-600">{stats.stockIn}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{stats.stockOut}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Adjustments</p>
                <p className="text-2xl font-bold text-purple-600">{stats.adjustments}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Select value={movementType} onValueChange={(v) => { setMovementType(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(MOVEMENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setWarehouse('all');
                setMovementType('all');
                setDateRange('30');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>
            Showing {movements.length} of {movementsData?.data?.total || 0} movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : movements.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement: any) => {
                    const typeConfig = MOVEMENT_TYPE_CONFIG[movement.movementType] || MOVEMENT_TYPE_CONFIG.adjustment_in;
                    const Icon = typeConfig.icon;
                    const isIn = ['purchase_receipt', 'transfer_in', 'adjustment_in', 'return_in'].includes(movement.movementType);

                    return (
                      <TableRow key={movement.movementId}>
                        <TableCell className="text-sm">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">
                                {movement.product?.productName || movement.productName || '-'}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {movement.product?.sku || movement.sku || '-'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {movement.warehouse?.name || movement.warehouseName || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeConfig.bgColor} variant="secondary">
                            <Icon className={`h-3 w-3 mr-1 ${typeConfig.color}`} />
                            <span className={typeConfig.color}>{typeConfig.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          isIn ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIn ? '+' : '-'}{parseFloat(movement.quantity || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <span className={movement.quantityAfter >= movement.quantityBefore ? 'text-green-600' : 'text-red-600'}>
                            {parseFloat(movement.quantityAfter || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {movement.referenceNo || movement.referenceType || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {movement.performedBy || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {movementsData?.data?.totalPages || 1}
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
                    disabled={page >= (movementsData?.data?.totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No movements found</h3>
              <p className="text-gray-500 mt-1">
                Stock movements will appear here once you start recording inventory changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
