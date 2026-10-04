'use client';

import { Landmark } from 'lucide-react';
import { purchaseOrderApi } from '@/lib/api';
import { WorkflowListPage } from '@/components/workflow/workflow-list-page';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'validated', label: 'Validated' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PurchaseInvoicesPage() {
  return (
    <WorkflowListPage
      title="Purchase Invoices"
      subtitle="Vendor bills matched with purchase orders and GRNs"
      queryKey="purchase-invoices-workflow"
      moduleHref="/dashboard/purchase/orders"
      emptyLabel="No purchase invoices found"
      icon={Landmark}
      statusOptions={STATUS_OPTIONS}
      fetchRecords={purchaseOrderApi.getInvoices}
      getId={(record) => record.invoiceId}
      getNumber={(record) => record.invoiceNumber}
      getDate={(record) => record.invoiceDate || record.createdAt}
      getParty={(record) => record.vendorName}
      getReference={(record) => record.orderId || record.grnId}
      getAmount={(record) => Number(record.netAmount || record.totalAmount || 0)}
    />
  );
}
