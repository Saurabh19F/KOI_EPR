'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Search, MapPin, Package, Layers, RefreshCw } from 'lucide-react';

export default function FloorStockPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: stockData, isLoading, refetch } = useQuery({
    queryKey: ['floor-stock'],
    queryFn: () => inventoryApi.getStock({ limit: 2000 }),
  });

  const warehouseList: any[] = warehouses?.data || [];
  const allStock: any[] = stockData?.data?.data || stockData?.data || [];

  const locationGroups = useMemo(() => {
    const map = new Map<string, {
      location: string;
      warehouseId: string;
      warehouseName: string;
      items: { productId: string; productName: string; sku: string; qty: number; category: string }[];
      totalQty: number;
    }>();

    for (const item of allStock) {
      const bin = item.binLocation || 'Inward-Staging';
      const whId = item.warehouseId || '';
      const whName = warehouseList.find((w: any) => w.id === whId)?.name || whId;
      const key = `${whId}::${bin}`;
      const qty = Math.round(Number(item.currentStock || 0));

      if (!map.has(key)) {
        map.set(key, {
          location: bin,
          warehouseId: whId,
          warehouseName: whName,
          items: [],
          totalQty: 0,
        });
      }
      const group = map.get(key)!;
      group.items.push({
        productId: item.productId || item.sku,
        productName: item.productName || '',
        sku: item.sku || '',
        qty,
        category: item.category || 'Raw',
      });
      group.totalQty += qty;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.warehouseName !== b.warehouseName) return a.warehouseName.localeCompare(b.warehouseName);
      return a.location.localeCompare(b.location);
    });
  }, [allStock, warehouseList]);

  const filtered = useMemo(() => {
    let result = locationGroups;
    if (filterWarehouse !== 'all') {
      result = result.filter((g) => g.warehouseId === filterWarehouse);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.location.toLowerCase().includes(s) ||
          g.warehouseName.toLowerCase().includes(s) ||
          g.items.some((i) => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)),
      );
    }
    return result;
  }, [locationGroups, filterWarehouse, search]);

  const totalPages = Math.ceil(filtered.length / limit);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const totalLocations = locationGroups.length;
  const totalItems = allStock.length;
  const totalQty = locationGroups.reduce((sum, g) => sum + g.totalQty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Floor / Location Stock</h1>
          <p className="text-muted-foreground">
            Stock aggregated by physical floor location and bin rack
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><MapPin className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Locations</p>
                <p className="text-2xl font-bold">{totalLocations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Package className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2"><Layers className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Location-wise Stock</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search location or product..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[220px]"
                />
              </div>
              <Select value={filterWarehouse} onValueChange={(v) => { setFilterWarehouse(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouseList.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="mb-2 h-10 w-10" />
              <p>No stock found at any location</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paged.map((group, idx) => (
                  <div key={`${group.warehouseId}-${group.location}-${idx}`} className="rounded-lg border">
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-bold">{group.location}</span>
                        <Badge variant="outline">{group.warehouseName}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{group.items.length} items</span>
                        <span className="ml-3 font-bold text-primary">{group.totalQty.toLocaleString()} qty</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Product ID</TableHead>
                          <TableHead className="text-xs">Product Name</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, i) => (
                          <TableRow key={`${item.productId}-${i}`}>
                            <TableCell className="text-xs font-medium">{item.sku || item.productId}</TableCell>
                            <TableCell className="text-xs">{item.productName}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">{item.qty.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {paged.length} of {filtered.length} locations
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
