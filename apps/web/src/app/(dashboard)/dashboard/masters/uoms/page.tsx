'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function UomsPage() {
  return (
    <MastersCrudPage
      title="Units of Measurement"
      singularName="UOM"
      moduleName="uoms"
      columns={[
        { key: 'uomCode', label: 'Code' },
        { key: 'uomName', label: 'Name' },
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
        { name: 'uomCode', label: 'UOM Code', type: 'text', required: true, placeholder: 'e.g., PCS' },
        { name: 'uomName', label: 'UOM Name', type: 'text', required: true, placeholder: 'e.g., Pieces' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
