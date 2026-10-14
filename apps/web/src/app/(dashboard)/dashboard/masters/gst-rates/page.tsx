'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function GstRatesPage() {
  return (
    <MastersCrudPage
      title="GST Rates"
      singularName="GST Rate"
      moduleName="gst-rates"
      columns={[
        { key: 'gstCode', label: 'Code' },
        { key: 'gstName', label: 'Name' },
        {
          key: 'gstPercent',
          label: 'Rate (%)',
          render: (value: number) => `${value}%`,
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
        { name: 'gstCode', label: 'GST Code', type: 'text', required: true, placeholder: 'e.g., GST5' },
        { name: 'gstName', label: 'GST Name', type: 'text', required: true, placeholder: 'e.g., 5% GST' },
        { name: 'gstPercent', label: 'Rate (%)', type: 'number', required: true, placeholder: 'e.g., 5' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
