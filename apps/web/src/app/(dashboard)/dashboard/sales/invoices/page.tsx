'use client';

import { Receipt } from 'lucide-react';
import { salesOrderApi } from '@/lib/api';
import { WorkflowListPage } from '@/components/workflow/workflow-list-page';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'validated', label: 'Validated' },
  { value: 'e_invoiced', label: 'E-Invoiced' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SalesInvoicesPage() {
  return (
    <WorkflowListPage
      title="Sales Invoices"
      subtitle="Customer billing created from sales orders and dispatches"
      queryKey="sales-invoices-workflow"
      moduleHref="/dashboard/sales/orders"
      emptyLabel="No sales invoices found"
      icon={Receipt}
      statusOptions={STATUS_OPTIONS}
      fetchRecords={salesOrderApi.getInvoices}
      downloadPdf={salesOrderApi.downloadInvoicePdf}
      getId={(record) => record.invoiceId}
      getNumber={(record) => record.invoiceNumber}
      getDate={(record) => record.invoiceDate || record.createdAt}
      getParty={(record) => record.customerName}
      getReference={(record) => record.orderId || record.deliveryNoteId}
      getAmount={(record) => Number(record.totalAmount || 0)}
    />
  );
}
