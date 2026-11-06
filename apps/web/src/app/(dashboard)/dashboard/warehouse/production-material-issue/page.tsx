'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Factory } from 'lucide-react';

export default function ProductionMaterialIssuePage() {
  return (
    <div className="space-y-4">
      <WorkspacePageHeader title="Production Material Issue" description="Issue materials to production floor" />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-100">
            <Factory className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-slate-950">Coming Soon</p>
          <p className="mt-1 text-sm text-slate-500">Production material issue module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
