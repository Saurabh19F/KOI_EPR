'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TruckIcon, RotateCcw } from 'lucide-react';
import WarehouseGrnPlanPage from '../grn-plan/page';
import TransferRequestsPage from '../transfer-requests/page';
import ProductionReturnsPage from '../production-returns/page';

export default function MaterialMovementPage() {
  const [activeTab, setActiveTab] = useState('grn');

  return (
    <div className="space-y-4">
      <WorkspacePageHeader title="Material Movement" description="Inbound logistics, transfer requests, and production returns" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grn" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inbound GRN
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4" />
            Transfer Requests
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Production Returns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grn" className="mt-4">
          <WarehouseGrnPlanPage />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransferRequestsPage />
        </TabsContent>

        <TabsContent value="returns" className="mt-4">
          <ProductionReturnsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
