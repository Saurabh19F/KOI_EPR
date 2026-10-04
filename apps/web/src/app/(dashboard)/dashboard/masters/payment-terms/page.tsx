'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function PaymentTermsPage() {
  return (
    <MastersCrudPage
      title="Payment Terms"
      singularName="Payment Term"
      moduleName="payment-terms"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        {
          key: 'days',
          label: 'Days',
          render: (value: number) => `${value} days`,
        },
        { key: 'description', label: 'Description' },
        {
          key: 'isActive',
          label: 'Status',
          render: (value: boolean) => (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      formFields={[
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., NET30' },
        { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Net 30 Days' },
        { name: 'days', label: 'Days', type: 'number', required: true, placeholder: 'e.g., 30' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
