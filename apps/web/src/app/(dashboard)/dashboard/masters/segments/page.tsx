'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function SegmentsPage() {
  return (
    <MastersCrudPage
      title="Segments"
      singularName="Segment"
      moduleName="segments"
      columns={[
        { key: 'segmentCode', label: 'Code' },
        { key: 'segmentName', label: 'Name' },
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
        { name: 'segmentCode', label: 'Segment Code', type: 'text', required: true, placeholder: 'e.g., SS' },
        { name: 'segmentName', label: 'Segment Name', type: 'text', required: true, placeholder: 'e.g., Small Size' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
