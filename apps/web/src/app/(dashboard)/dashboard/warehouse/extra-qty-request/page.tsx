'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ExtraQtyRequestPage() {
  return (
    <div className="space-y-4">
      <WorkspacePageHeader title="Extra Qty Request (15%+)" description="Manage requests for quantities exceeding 15% threshold" />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-lg font-bold text-slate-950">Coming Soon</p>
          <p className="mt-1 text-sm text-slate-500">Extra quantity request module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
