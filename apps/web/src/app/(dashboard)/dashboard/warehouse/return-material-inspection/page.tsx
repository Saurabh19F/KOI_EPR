'use client';

import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

export default function ReturnMaterialInspectionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Return Material Inspection</h1>
        <p className="mt-1 text-sm text-slate-500">Inspect and process returned materials</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100">
            <RotateCcw className="h-8 w-8 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-950">Coming Soon</p>
          <p className="mt-1 text-sm text-slate-500">Return material inspection module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
