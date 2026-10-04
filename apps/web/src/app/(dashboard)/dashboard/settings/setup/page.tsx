'use client';

import Link from 'next/link';
import {
  Anchor,
  Banknote,
  Boxes,
  Building2,
  CircleDollarSign,
  Flag,
  Globe2,
  Layers,
  MapPin,
  Percent,
  BadgePercent,
  Route,
  Ruler,
  Tag,
} from 'lucide-react';

const setupModules = [
  {
    title: 'Brands',
    description: 'Product brand setup',
    href: '/dashboard/masters/brands',
    icon: Tag,
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    title: 'Categories',
    description: 'Product category setup',
    href: '/dashboard/masters/categories',
    icon: Layers,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  {
    title: 'Segments',
    description: 'Product segment setup',
    href: '/dashboard/masters/segments',
    icon: Boxes,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    title: 'Groups',
    description: 'Component group setup',
    href: '/dashboard/masters/groups',
    icon: Building2,
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    title: 'UOMs',
    description: 'Units of measurement',
    href: '/dashboard/masters/uoms',
    icon: Ruler,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
  },
  {
    title: 'GST Rates',
    description: 'Tax rate setup',
    href: '/dashboard/masters/gst-rates',
    icon: BadgePercent,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    title: 'Payment Terms',
    description: 'Customer and vendor terms',
    href: '/dashboard/masters/payment-terms',
    icon: Banknote,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
  {
    title: 'Zones',
    description: 'Regional zone setup',
    href: '/dashboard/masters/zones',
    icon: Route,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    title: 'Locations',
    description: 'Business location setup',
    href: '/dashboard/masters/locations',
    icon: MapPin,
    bgColor: 'bg-lime-50',
    textColor: 'text-lime-700',
  },
  {
    title: 'Countries',
    description: 'Country master setup',
    href: '/dashboard/masters/countries',
    icon: Flag,
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    title: 'Currencies',
    description: 'Currency master setup',
    href: '/dashboard/masters/currencies',
    icon: CircleDollarSign,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  {
    title: 'Currency Rates',
    description: 'Exchange rate setup',
    href: '/dashboard/masters/currency-rates',
    icon: Percent,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Haulage',
    description: 'Haulage charge setup',
    href: '/dashboard/masters/haulage',
    icon: Globe2,
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
  },
  {
    title: 'Ports',
    description: 'Port master setup',
    href: '/dashboard/masters/ports',
    icon: Anchor,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Setup</h1>
        <p className="text-slate-500 mt-1">Manage configuration masters used across sales, purchase, rates, and reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {setupModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <div className="group bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer h-full border border-gray-100 hover:border-gray-200">
                <div className="flex items-start gap-4">
                  <div className={`${module.bgColor} p-3 rounded-xl group-hover:scale-105 transition-transform`}>
                    <Icon className={`h-5 w-5 ${module.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
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
    </div>
  );
}
