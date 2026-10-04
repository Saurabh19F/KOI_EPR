'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Mail, Building2, Settings, ArrowRight } from 'lucide-react';

const adminModules = [
  {
    title: 'Number Series',
    description: 'Configure automatic numbering patterns for documents and records',
    icon: Hash,
    color: 'bg-blue-500',
    href: '/dashboard/admin/number-series',
  },
  {
    title: 'Email Templates',
    description: 'Manage email templates for automated notifications and communications',
    icon: Mail,
    color: 'bg-purple-500',
    href: '/dashboard/admin/email-templates',
  },
  {
    title: 'Departments',
    description: 'Organize your company structure with departments and teams',
    icon: Building2,
    color: 'bg-green-500',
    href: '/dashboard/admin/departments',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500 mt-1">Configure system-wide settings and organizational structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminModules.map((module) => {
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
                    <span className="text-sm font-medium">Go to settings</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
