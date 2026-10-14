'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function HaulagePage() {
  return (
    <MastersCrudPage
      title="Haulage Charges"
      singularName="Haulage Charge"
      moduleName="haulage"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'vehicleType', label: 'Vehicle Type' },
        {
          key: 'rate',
          label: 'Rate',
          render: (value: number) => value ? `₹${value.toLocaleString()}` : '-',
        },
        {
          key: 'validFrom',
          label: 'Valid From',
          render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
        },
        {
          key: 'validTo',
          label: 'Valid To',
          render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
        },
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
        { name: 'code', label: 'Haulage Code', type: 'text', required: true, placeholder: 'e.g., HAUL001' },
        { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Local Haulage, Long Haul' },
        { name: 'vehicleType', label: 'Vehicle Type', type: 'text', placeholder: 'e.g., truck_20ft, truck_40ft, trailer' },
        { name: 'rate', label: 'Rate', type: 'number', required: true, placeholder: 'Haulage rate' },
        { name: 'validFrom', label: 'Valid From', type: 'date', placeholder: 'Start date' },
        { name: 'validTo', label: 'Valid To', type: 'date', placeholder: 'End date' },
      ]}
    />
  );
}
