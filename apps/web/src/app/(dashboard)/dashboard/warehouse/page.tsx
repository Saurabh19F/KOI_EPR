'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Building2,
  Package,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  TrendingUp,
  Boxes,
} from 'lucide-react';

export default function WarehouseDashboardPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: stockSummary } = useQuery({
    queryKey: ['stock-summary', selectedWarehouse],
    queryFn: () => inventoryApi.getStockSummary(selectedWarehouse !== 'all' ? selectedWarehouse : undefined),
  });

  const { data: lowStockAlerts } = useQuery({
    queryKey: ['low-stock-alerts', selectedWarehouse],
    queryFn: () => inventoryApi.getLowStockAlerts(selectedWarehouse !== 'all' ? selectedWarehouse : undefined),
  });

  const { data: recentMovements } = useQuery({
    queryKey: ['recent-movements', selectedWarehouse],
    queryFn: () => inventoryApi.getMovements({
      warehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      limit: 10,
      page: 1,
    }),
  });

  const warehouseList = warehouses?.data || [];
  const summary = stockSummary?.data || {};
  const alerts = lowStockAlerts?.data || [];
  const movements = recentMovements?.data?.items || recentMovements?.data || [];

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Department Dashboard" description="Review stock balances, movements, and low-stock alerts by warehouse.">
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
      </WorkspacePageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Active products in warehouse</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Qty</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Units across all products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(summary.totalValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total inventory valuation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{Array.isArray(alerts) ? alerts.length : 0}</div>
            <p className="text-xs text-muted-foreground">Products below reorder level</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current Qty</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(alerts) ? alerts.slice(0, 8) : []).map((alert: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{alert.productName || alert.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{alert.currentStock ?? alert.quantity ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{alert.reorderLevel ?? alert.minStock ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {(!Array.isArray(alerts) || alerts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No low stock alerts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(movements) ? movements.slice(0, 8) : []).map((mov: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant={mov.type?.includes('in') || mov.type?.includes('receipt') ? 'default' : 'secondary'}>
                        {mov.type?.includes('in') || mov.type?.includes('receipt') ? (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        )}
                        {mov.type?.replace(/_/g, ' ') || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mov.productName || mov.product?.name || '-'}</TableCell>
                    <TableCell className="text-right">{mov.quantity}</TableCell>
                    <TableCell>{mov.createdAt ? new Date(mov.createdAt).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {(!Array.isArray(movements) || movements.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No recent movements
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Warehouses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseList.map((wh: any) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {wh.name}
                    </div>
                  </TableCell>
                  <TableCell>{wh.location || wh.address || '-'}</TableCell>
                  <TableCell className="text-right">{wh.productCount ?? '-'}</TableCell>
                  <TableCell className="text-right">{wh.totalQuantity?.toLocaleString() ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={wh.isActive !== false ? 'default' : 'secondary'}>
                      {wh.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {warehouseList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No warehouses configured
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
