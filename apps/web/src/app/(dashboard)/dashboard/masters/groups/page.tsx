'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function GroupsPage() {
  return (
    <MastersCrudPage
      title="Component Groups"
      singularName="Group"
      moduleName="groups"
      columns={[
        { key: 'groupCode', label: 'Code' },
        { key: 'groupName', label: 'Name' },
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
        { name: 'groupCode', label: 'Group Code', type: 'text', required: true, placeholder: 'e.g., GRP' },
        { name: 'groupName', label: 'Group Name', type: 'text', required: true, placeholder: 'e.g., Group Components' },
        { name: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
      ]}
    />
  );
}
