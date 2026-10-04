'use client';

import { useEffect, useState } from 'react';
import { MastersCrudPage } from '@/components/masters/masters-crud-page';
import { api } from '@/lib/api';

export default function CurrencyRatesPage() {
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    api.get('/masters/currencies')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCurrencies(list.map((c: any) => ({
          value: c.id,
          label: `${c.code} - ${c.name}`
        })));
      })
      .catch(() => {});
  }, []);

  return (
    <MastersCrudPage
      title="Currency Rates"
      singularName="Currency Rate"
      moduleName="currency-rates"
      columns={[
        {
          key: 'currencyId',
          label: 'Currency',
          render: (val: string) => {
            const match = currencies.find(c => c.value === val);
            return match ? match.label : val || '-';
          }
        },
        {
          key: 'baseCurrencyId',
          label: 'Base Currency',
          render: (val: string) => {
            const match = currencies.find(c => c.value === val);
            return match ? match.label : val || '-';
          }
        },
        {
          key: 'rate',
          label: 'Rate',
          render: (val: any) => val ? parseFloat(val).toFixed(6) : '-'
        },
        {
          key: 'effectiveDate',
          label: 'Effective Date',
          render: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
        },
        {
          key: 'expiryDate',
          label: 'Expiry Date',
          render: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
        }
      ]}
      formFields={[
        {
          name: 'currencyId',
          label: 'Target Currency',
          type: 'select',
          required: true,
          options: currencies
        },
        {
          name: 'baseCurrencyId',
          label: 'Base Currency',
          type: 'select',
          required: true,
          options: currencies
        },
        {
          name: 'rate',
          label: 'Exchange Rate',
          type: 'number',
          required: true,
          placeholder: 'e.g. 83.50'
        },
        {
          name: 'effectiveDate',
          label: 'Effective Date',
          type: 'date',
          required: true
        },
        {
          name: 'expiryDate',
          label: 'Expiry Date',
          type: 'date'
        }
      ]}
    />
  );
}
