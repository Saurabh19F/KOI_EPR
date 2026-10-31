'use client';

import { Boxes } from 'lucide-react';
import { purchaseOrderApi } from '@/lib/api';
import { WorkflowListPage } from '@/components/workflow/workflow-list-page';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_quality', label: 'Pending Quality' },
  { value: 'quality_done', label: 'Quality Done' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function GrnsPage() {
  return (
    <WorkflowListPage
      title="GRNs"
      subtitle="Goods receipt notes that update inventory from purchase orders"
      queryKey="grns-workflow"
      moduleHref="/dashboard/purchase/orders"
      emptyLabel="No GRNs found"
      icon={Boxes}
      statusOptions={STATUS_OPTIONS}
      fetchRecords={purchaseOrderApi.getGrns}
      getId={(record) => record.grnId}
      getNumber={(record) => record.grnNumber}
      getDate={(record) => record.grnDate || record.createdAt}
      getParty={(record) => record.vendorName}
      getReference={(record) => record.orderId || record.invoiceNumber}
      getAmount={(record) => Number(record.totalAmount || 0)}
    />
  );
}
