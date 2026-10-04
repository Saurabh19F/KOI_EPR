'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function FreightRatesPage() {
  return (
    <MastersCrudPage
      title="Freight Rates"
      singularName="Freight Rate"
      moduleName="freight-rates"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'carrier', label: 'Carrier' },
        { key: 'containerType', label: 'Container' },
        {
          key: 'rate20ft',
          label: '20ft Rate',
          render: (value: number) => value ? `₹${value.toLocaleString()}` : '-',
        },
        {
          key: 'rate40ft',
          label: '40ft Rate',
          render: (value: number) => value ? `₹${value.toLocaleString()}` : '-',
        },
        {
          key: 'transitDays',
          label: 'Transit',
          render: (value: number) => value ? `${value} days` : '-',
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
        { name: 'code', label: 'Freight Code', type: 'text', required: true, placeholder: 'e.g., FRT001' },
        { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Sea Freight - Mumbai to Singapore' },
        { name: 'carrier', label: 'Carrier', type: 'text', placeholder: 'e.g., MAERSK, MSC, COSCO' },
        { name: 'containerType', label: 'Container Type', type: 'text', placeholder: 'e.g., 20ft, 40ft, 40hq, LCL' },
        { name: 'rate20ft', label: '20ft Rate', type: 'number', placeholder: 'Rate for 20ft container' },
        { name: 'rate40ft', label: '40ft Rate', type: 'number', placeholder: 'Rate for 40ft container' },
        { name: 'rate40hq', label: '40HQ Rate', type: 'number', placeholder: 'Rate for 40HQ container' },
        { name: 'transitDays', label: 'Transit Days', type: 'number', placeholder: 'Days in transit' },
      ]}
    />
  );
}
