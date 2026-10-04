'use client';

import Link from 'next/link';
import {
  Package,
  Users,
  Truck,
  Globe,
  PackageCheck,
} from 'lucide-react';

const masterModules = [
  {
    title: 'Products',
    description: 'Manage product catalog, SKU generation, and pricing',
    href: '/dashboard/masters/products',
    icon: Package,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Customers',
    description: 'Manage customer database with buyer codes',
    href: '/dashboard/masters/customers',
    icon: Users,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    title: 'Vendors',
    description: 'Manage supplier, packaging, logistics, and trading vendors',
    href: '/dashboard/masters/vendors',
    icon: Truck,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    title: 'Packing',
    description: 'Manage packing types, units per case, CBM, and vendors',
    href: '/dashboard/masters/packing',
    icon: PackageCheck,
    color: 'bg-cyan-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
];

export default function MastersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Masters</h1>
        <p className="text-slate-500 mt-1">Manage master data and configuration</p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {masterModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <div className="group bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer h-full border border-gray-100 hover:border-gray-200">
                <div className="flex items-start gap-4">
                  <div className={`${module.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${module.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <Globe className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Master Data</h3>
            <p className="text-sm text-primary-700 mt-1">
              Master data is the foundation of your ERP system. Products, customers, and vendors
              are used across all modules including Sales, Purchase, and Rate Analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
