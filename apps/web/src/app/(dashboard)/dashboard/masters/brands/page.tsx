'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function BrandsPage() {
  return (
    <MastersCrudPage
      title="Brands"
      singularName="Brand"
      moduleName="brands"
      columns={[
        { key: 'brandCode', label: 'Code' },
        { key: 'brandName', label: 'Name' },
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
        { name: 'brandCode', label: 'Brand Code', type: 'text', required: true, placeholder: 'e.g., HERO' },
        { name: 'brandName', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Hero Cycles' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
