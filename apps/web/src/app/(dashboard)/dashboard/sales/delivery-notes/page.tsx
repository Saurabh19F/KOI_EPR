'use client';

import { Truck } from 'lucide-react';
import { salesOrderApi } from '@/lib/api';
import { WorkflowListPage } from '@/components/workflow/workflow-list-page';

export default function DeliveryNotesPage() {
  return (
    <WorkflowListPage
      title="Delivery Notes"
      subtitle="Dispatch documents created against sales orders"
      queryKey="delivery-notes-workflow"
      moduleHref="/dashboard/sales/orders"
      emptyLabel="No delivery notes found"
      icon={Truck}
      fetchRecords={salesOrderApi.getDeliveryNotes}
      getId={(record) => record.noteId}
      getNumber={(record) => record.noteNumber}
      getDate={(record) => record.noteDate || record.createdAt}
      getParty={(record) => record.customerName}
      getReference={(record) => record.orderId || record.eWayBillNumber}
      getAmount={(record) => Number(record.totalAmount || 0)}
    />
  );
}
