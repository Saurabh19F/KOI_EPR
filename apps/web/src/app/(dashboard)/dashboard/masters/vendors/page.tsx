'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';
import { mastersApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const uniqueOptions = (values: Array<string | undefined | null>) => {
  const seen = new Set<string>();
  return values
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
};

const responseList = (response: any) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function VendorsPage() {
  const { data: paymentTermsData, refetch: refetchPaymentTerms } = useQuery({
    queryKey: ['vendor-payment-terms-options'],
    queryFn: mastersApi.getPaymentTerms,
    refetchOnMount: 'always',
  });

  const { data: vendorsData, refetch: refetchVendors } = useQuery({
    queryKey: ['vendor-master-dropdown-source'],
    queryFn: () => mastersApi.getVendors({ limit: 500 }),
    refetchOnMount: 'always',
  });

  const compactText = (value: string) => (
    <span className="block min-w-40 max-w-xs truncate" title={value || ''}>
      {value || '-'}
    </span>
  );

  const renderProductCategory = (value: string, row?: any) => {
    const category = value || row?.productCategory || row?.productsSupplied || '';
    return compactText(category);
  };

  const vendors = responseList(vendorsData);
  const paymentTermsMaster = responseList(paymentTermsData);

  const paymentTermsOptions = uniqueOptions([
    ...paymentTermsMaster.map((term: any) => term.termsName || term.name || term.code),
    ...vendors.map((vendor: any) => vendor.paymentTerms),
  ]);

  const purchasePersonOptions = uniqueOptions([
    ...vendors.map((vendor: any) => vendor.purchasePerson),
  ]);

  return (
    <MastersCrudPage
      title="Vendor Master"
      singularName="Vendor"
      moduleName="vendors"
      onBeforeOpenDialog={async () => {
        await Promise.all([
          refetchPaymentTerms(),
          refetchVendors(),
        ]);
      }}
      columns={[
        { key: 'vendorCode', label: 'Code' },
        { key: 'vendorName', label: 'Vendor Name' },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Phone Number' },
        { key: 'email', label: 'Email', render: compactText },
        { key: 'address', label: 'Address', render: compactText },
        { key: 'fssaiNumber', label: 'FSSAI No.' },
        { key: 'gstNumber', label: 'GST No.' },
        { key: 'category', label: 'Product Category', render: renderProductCategory },
        { key: 'productsSupplied', label: 'Products Supplied', render: compactText },
        { key: 'paymentTerms', label: 'Payment Terms' },
        { key: 'purchasePerson', label: 'Purchase Person' },
        {
          key: 'isActive',
          label: 'Status',
          render: (value: boolean) => (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      formFields={[
        { name: 'vendorName', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Akhil Traders' },
        { name: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'e.g., Pawan' },
        { name: 'phone', label: 'Phone Number', type: 'text', placeholder: 'e.g., 9213489811' },
        { name: 'email', label: 'Email', type: 'text', placeholder: 'vendor@example.com' },
        { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Vendor address' },
        { name: 'fssaiNumber', label: 'FSSAI No.', type: 'text', placeholder: 'FSSAI number' },
        { name: 'gstNumber', label: 'GST No.', type: 'text', placeholder: 'GSTIN' },
        { name: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., FMCG, Packing Material' },
        { name: 'productsSupplied', label: 'Products Supplied', type: 'textarea', placeholder: 'e.g., Branded, PVT, Eno, etc.' },
        {
          name: 'paymentTerms',
          label: 'Payment Terms',
          type: 'select',
          placeholder: 'Select Payment Terms',
          options: paymentTermsOptions,
        },
        {
          name: 'purchasePerson',
          label: 'Purchase Person',
          type: 'select',
          placeholder: 'Select Purchase Person',
          options: purchasePersonOptions,
        },
      ]}
    />
  );
}
