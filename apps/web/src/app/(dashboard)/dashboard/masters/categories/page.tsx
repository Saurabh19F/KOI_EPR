'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function CategoriesPage() {
  return (
    <MastersCrudPage
      title="Categories"
      singularName="Category"
      moduleName="categories"
      columns={[
        { key: 'categoryCode', label: 'Code' },
        { key: 'categoryName', label: 'Name' },
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
        { name: 'categoryCode', label: 'Category Code', type: 'text', required: true, placeholder: 'e.g., BRD' },
        { name: 'categoryName', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g., Bicycles & Rickshaws' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
