'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, Boxes, ArrowRight, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const inventoryModules = [
  {
    title: 'Stock Overview',
    description: 'View current stock levels across all warehouses and locations',
    icon: Package,
    color: 'bg-blue-500',
    href: '/dashboard/inventory/stock',
  },
  {
    title: 'Warehouse Management',
    description: 'Manage warehouses, zones, and storage locations',
    icon: Warehouse,
    color: 'bg-green-500',
    href: '/dashboard/inventory/warehouses',
  },
  {
    title: 'Stock Movements',
    description: 'Track stock in/out, transfers, and adjustments',
    icon: Boxes,
    color: 'bg-purple-500',
    href: '/dashboard/inventory/movements',
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-slate-500 mt-1">Manage stock levels, warehouses, and inventory operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {inventoryModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full group">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {module.description}
                  </CardDescription>
                  <div className="flex items-center gap-1 text-primary-600 group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">Open</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">1,248</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600 mt-1">23</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Warehouses</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">5</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Stock Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">$2.4M</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
