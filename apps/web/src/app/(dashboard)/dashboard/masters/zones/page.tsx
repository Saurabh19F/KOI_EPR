'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function ZonesPage() {
  return (
    <MastersCrudPage
      title="Zones"
      singularName="Zone"
      moduleName="zones"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'region', label: 'Region' },
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
        { name: 'code', label: 'Zone Code', type: 'text', required: true, placeholder: 'e.g., NORTH' },
        { name: 'name', label: 'Zone Name', type: 'text', required: true, placeholder: 'e.g., North Zone' },
        { name: 'region', label: 'Region', type: 'text', placeholder: 'e.g., North, South, East, West' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
