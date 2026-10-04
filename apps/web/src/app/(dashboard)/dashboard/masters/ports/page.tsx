'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function PortsPage() {
  return (
    <MastersCrudPage
      title="Ports"
      singularName="Port"
      moduleName="ports"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'state', label: 'State' },
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
        { name: 'code', label: 'Port Code', type: 'text', required: true, placeholder: 'e.g., INBOM' },
        { name: 'name', label: 'Port Name', type: 'text', required: true, placeholder: 'e.g., Mumbai Port' },
        { name: 'type', label: 'Type', type: 'text', placeholder: 'e.g., Sea/Air/Inland' },
        { name: 'state', label: 'State', type: 'text', placeholder: 'e.g., Maharashtra' },
      ]}
    />
  );
}
