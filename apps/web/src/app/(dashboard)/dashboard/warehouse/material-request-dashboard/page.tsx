'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function MaterialRequestDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Material Request Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage material requests across departments</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-slate-950">Coming Soon</p>
          <p className="mt-1 text-sm text-slate-500">Material request dashboard is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
