'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, X, MapPin, CreditCard, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Reusable Scrollable Searchable Dropdown
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  onCreateNew,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  onCreateNew?: (searchVal: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort options alphabetically by label
  const sortedOptions = [...options].sort((a, b) =>
    (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base', numeric: true })
  );

  const filtered = sortedOptions.filter(opt =>
    (opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={containerRef}>
      <div className="flex gap-2 w-full font-sans">
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <span className="text-slate-400 text-xs">▼</span>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md flex flex-col">
              <input
                type="text"
                className="h-8 w-full rounded-sm border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 mb-1"
                placeholder="Start typing to filter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              <div className="overflow-y-auto flex-1 max-h-48 scrollbar-thin scrollbar-thumb-slate-200">
                {filtered.length ? (
                  filtered.map(opt => (
                     <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 text-left ${
                        opt.value === value ? 'bg-slate-50 font-semibold text-primary-600' : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-slate-400">No results found</div>
                )}
              </div>
              {onCreateNew && search.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(search.trim());
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center rounded-sm px-2 py-2 text-sm text-primary-600 hover:bg-primary-50 text-left font-semibold border-t border-slate-100 gap-1.5 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add new "{search.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [quickAddType, setQuickAddType] = useState<'country' | 'zone' | 'port' | 'payment-terms' | 'currency' | null>(null);
  const [quickAddFields, setQuickAddFields] = useState<any>({});

  // Form state - using any to avoid type issues with mixed string/number fields
  const [formData, setFormData] = useState<any>({
    // Basic Info
    customerName: '',
    customerType: '',
    customerCategory: '',
    contactPerson: '',
    contactNumber: '',
    mobile: '',
    alternateContact: '',
    email: '',
    alternateEmail: '',
    whatsappNumber: '',
    website: '',
    // Billing Address
    countryId: '',
    state: '',
    city: '',
    pinCode: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingCountry: '',
    billingPincode: '',
    isBillingSameAsDelivery: true,
    // Delivery Address
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryCountry: '',
    deliveryPincode: '',
    // Commercial
    productZone: '',
    pod: '',
    portOfLoading: '',
    paymentTermsId: '',
    currencyId: '',
    creditLimit: '',
    creditDays: '',
    openingBalance: '',
    // Compliance
    gstNumber: '',
    panNumber: '',
    tinNumber: '',
    ieCode: '',
    // Other
    salesPersonId: '',
    shippingTerms: '',
    incoterms: '',
    remarks: '',
    // Status
    status: 'active',
  });

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: () => mastersApi.getCustomers({ page, limit: 20, search }),
  });

  // Fetch lookups
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: () => mastersApi.getCountries(),
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => mastersApi.getCurrencies(),
  });

  const { data: paymentTermsData } = useQuery({
    queryKey: ['payment-terms'],
    queryFn: () => mastersApi.getPaymentTerms(),
  });

  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => mastersApi.getZones(),
  });

  const { data: portsData } = useQuery({
    queryKey: ['ports'],
    queryFn: () => mastersApi.getPorts(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['customer-sales-users'],
    queryFn: () => usersApi.getUsers({ limit: 100, isActive: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => mastersApi.createCustomer(data),
    onSuccess: () => {
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      mastersApi.updateCustomer(id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Failed to update customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mastersApi.deleteCustomer(id),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const customers = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;
  const allUsers = usersData?.data?.data || [];
  const salesPersons = useMemo(() => {
    const filtered = allUsers.filter((u: any) => {
      const roleCode = u.role?.roleCode || u.roleCode || '';
      return ['SALES_USER', 'SALES_MANAGER'].includes(roleCode);
    });
    return filtered.length ? filtered : allUsers;
  }, [allUsers]);

  const getSalesPersonName = (salesPersonId?: string) => (
    salesPersons.find((u: any) => u.userId === salesPersonId)?.name || salesPersonId || '-'
  );

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerType: '',
      customerCategory: '',
      contactPerson: '',
      contactNumber: '',
      mobile: '',
      alternateContact: '',
      email: '',
      alternateEmail: '',
      whatsappNumber: '',
      website: '',
      countryId: '',
      state: '',
      city: '',
      pinCode: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingCountry: '',
      billingPincode: '',
      isBillingSameAsDelivery: true,
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryCountry: '',
      deliveryPincode: '',
      productZone: '',
      pod: '',
      portOfLoading: '',
      paymentTermsId: '',
      currencyId: '',
      creditLimit: '',
      creditDays: '',
      openingBalance: '',
      gstNumber: '',
      panNumber: '',
      tinNumber: '',
      ieCode: '',
      salesPersonId: '',
      shippingTerms: '',
      incoterms: '',
      remarks: '',
      status: 'active',
    });
    setActiveTab('basic');
  };

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName || '',
      customerType: customer.customerType || '',
      customerCategory: customer.customerCategory || '',
      contactPerson: customer.contactPerson || '',
      contactNumber: customer.contactNumber || '',
      mobile: customer.mobile || '',
      alternateContact: customer.alternateContact || '',
      email: customer.email || '',
      alternateEmail: customer.alternateEmail || '',
      whatsappNumber: customer.whatsappNumber || '',
      website: customer.website || '',
      countryId: customer.countryId || '',
      state: customer.state || '',
      city: customer.city || '',
      pinCode: customer.pinCode || '',
      billingAddress: customer.billingAddress || '',
      billingCity: customer.billingCity || '',
      billingState: customer.billingState || '',
      billingCountry: customer.billingCountry || '',
      billingPincode: customer.billingPincode || '',
      isBillingSameAsDelivery: customer.isBillingSameAsDelivery ?? true,
      deliveryAddress: customer.deliveryAddress || '',
      deliveryCity: customer.deliveryCity || '',
      deliveryState: customer.deliveryState || '',
      deliveryCountry: customer.deliveryCountry || '',
      deliveryPincode: customer.deliveryPincode || '',
      productZone: customer.productZone || '',
      pod: customer.pod || '',
      portOfLoading: customer.portOfLoading || '',
      paymentTermsId: customer.paymentTermsId || '',
      currencyId: customer.currencyId || '',
      creditLimit: customer.creditLimit?.toString() || '',
      creditDays: customer.creditDays?.toString() || '',
      openingBalance: customer.openingBalance?.toString() || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      tinNumber: customer.tinNumber || '',
      ieCode: customer.ieCode || '',
      salesPersonId: customer.salesPersonId || '',
      shippingTerms: customer.shippingTerms || '',
      incoterms: customer.incoterms || '',
      remarks: customer.remarks || '',
      status: customer.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    const numberFields = ['creditLimit', 'creditDays', 'openingBalance'];
    numberFields.forEach(field => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
        payload[field] = field === 'creditDays' ? parseInt(payload[field]) : parseFloat(payload[field]);
      } else {
        delete payload[field];
      }
    });

    const enumFields = ['customerType', 'customerCategory', 'status'];
    enumFields.forEach(field => {
      if (payload[field] === '') {
        delete payload[field];
      }
    });

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.customerId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage customer database with buyer codes and credit terms</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingCustomer(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search customers by name, code, or GSTIN..."
              className="pl-10 h-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="domestic">Domestic</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSearch(''); setPage(1); }}>
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[2400px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">State</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Person</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Country Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Billing Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PIN Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Delivery Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product Zone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">POD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Buyer Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sales Person</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Terms</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Port of Loading</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reference Contact / Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Remarks / Notes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(21)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length ? (
                customers.map((customer: any) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">{customer.customerName || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.city || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.contactNumber || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.email || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.state || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.contactPerson || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {countriesData?.data?.find((c: any) => c.countryId === customer.countryId)?.countryName || customer.countryId || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm max-w-xs truncate whitespace-nowrap" title={customer.billingAddress}>
                      {customer.billingAddress || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.pinCode || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm max-w-xs truncate whitespace-nowrap" title={customer.deliveryAddress}>
                      {customer.deliveryAddress || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {zonesData?.data?.find((z: any) => z.id === customer.productZone)?.name || customer.productZone || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.pod || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {customer.buyerCode || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{getSalesPersonName(customer.salesPersonId)}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {paymentTermsData?.data?.find((pt: any) => pt.id === customer.paymentTermsId)?.name || customer.paymentTermsId || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {currenciesData?.data?.find((c: any) => c.id === customer.currencyId)?.currencyCode || customer.currencyId || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {portsData?.data?.find((p: any) => p.id === customer.portOfLoading)?.name || customer.portOfLoading || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">{customer.alternateContact || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm max-w-xs truncate whitespace-nowrap" title={customer.remarks}>
                      {customer.remarks || '-'}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this customer?')) deleteMutation.mutate(customer.customerId); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={21} className="px-4 py-16 text-center">
                    <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No customers found</p>
                    <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setEditingCustomer(null); setIsDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Customer
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {customers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsDialogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div>
                    <Label className="text-slate-700 font-medium">Customer Name *</Label>
                    <Input
                      value={formData.customerName}
                      onChange={e => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  {/* Buyer Code */}
                  <div>
                    <Label className="text-slate-700 font-medium">Buyer Code *</Label>
                    <div className="relative">
                      <Input
                        value={formData.buyerCode}
                        onChange={e => handleInputChange('buyerCode', e.target.value)}
                        placeholder="Enter buyer code"
                        className="pr-24"
                        required
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-xs font-semibold px-3"
                        onClick={async () => {
                          try {
                            const res = await mastersApi.generateBuyerCode();
                            handleInputChange('buyerCode', res.data.buyerCode);
                            toast.success('Generated code: ' + res.data.buyerCode);
                          } catch (err) {
                            toast.error('Failed to generate code');
                          }
                        }}
                      >
                        Auto
                      </Button>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <Label className="text-slate-700 font-medium">City</Label>
                    <Input
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <Label className="text-slate-700 font-medium">State</Label>
                    <Input
                      value={formData.state}
                      onChange={e => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>

                  {/* PIN Code */}
                  <div>
                    <Label className="text-slate-700 font-medium">PIN Code</Label>
                    <Input
                      value={formData.pinCode}
                      onChange={e => handleInputChange('pinCode', e.target.value)}
                      placeholder="Enter PIN code"
                    />
                  </div>

                  {/* Country Name */}
                  <div>
                    <Label className="text-slate-700 font-medium">Country Name</Label>
                    <SearchableSelect
                      placeholder="Select country"
                      options={countriesData?.data?.map((c: any) => ({
                        label: c.countryName,
                        value: c.countryId
                      })) || []}
                      value={formData.countryId}
                      onChange={v => handleInputChange('countryId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('country');
                        setQuickAddFields({ code: '', name: searchVal, phoneCode: '', currencyCode: '' });
                      }}
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <Label className="text-slate-700 font-medium">Contact Number</Label>
                    <Input
                      value={formData.contactNumber}
                      onChange={e => handleInputChange('contactNumber', e.target.value)}
                      placeholder="Enter contact number"
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <Label className="text-slate-700 font-medium">Contact Person</Label>
                    <Input
                      value={formData.contactPerson}
                      onChange={e => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Enter contact person"
                    />
                  </div>

                  {/* Email ID */}
                  <div>
                    <Label className="text-slate-700 font-medium">Email ID</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="Enter email ID"
                    />
                  </div>

                  {/* Reference Contact / Number */}
                  <div>
                    <Label className="text-slate-700 font-medium">Reference Contact / Number</Label>
                    <Input
                      value={formData.alternateContact}
                      onChange={e => handleInputChange('alternateContact', e.target.value)}
                      placeholder="Enter alternate contact / reference number"
                    />
                  </div>

                  {/* Billing Address */}
                  <div className="col-span-2">
                    <Label className="text-slate-700 font-medium">Billing Address</Label>
                    <Textarea
                      value={formData.billingAddress}
                      onChange={e => handleInputChange('billingAddress', e.target.value)}
                      placeholder="Enter full billing address"
                      rows={2}
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="col-span-2">
                    <Label className="text-slate-700 font-medium">Delivery Address</Label>
                    <Textarea
                      value={formData.deliveryAddress}
                      onChange={e => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="Enter full delivery address"
                      rows={2}
                    />
                  </div>

                  {/* Product Zone */}
                  <div>
                    <Label className="text-slate-700 font-medium">Product Zone</Label>
                    <SearchableSelect
                      placeholder="Select zone"
                      options={zonesData?.data?.map((z: any) => ({
                        label: `${z.code} - ${z.name}`,
                        value: z.id
                      })) || []}
                      value={formData.productZone}
                      onChange={v => handleInputChange('productZone', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('zone');
                        setQuickAddFields({ code: '', name: searchVal, region: '', description: '' });
                      }}
                    />
                  </div>

                  {/* POD */}
                  <div>
                    <Label className="text-slate-700 font-medium">POD</Label>
                    <Input
                      value={formData.pod}
                      onChange={e => handleInputChange('pod', e.target.value)}
                      placeholder="Enter POD"
                    />
                  </div>

                  {/* Sales Person */}
                  <div>
                    <Label className="text-slate-700 font-medium">Sales Person</Label>
                    <SearchableSelect
                      placeholder="Select sales person"
                      options={salesPersons.map((u: any) => ({
                        label: u.name || u.email || u.userId,
                        value: u.userId
                      }))}
                      value={formData.salesPersonId}
                      onChange={v => handleInputChange('salesPersonId', v)}
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <Label className="text-slate-700 font-medium">Payment Terms</Label>
                    <SearchableSelect
                      placeholder="Select payment terms"
                      options={paymentTermsData?.data?.map((t: any) => ({
                        label: `${t.code} - ${t.name}`,
                        value: t.id
                      })) || []}
                      value={formData.paymentTermsId}
                      onChange={v => handleInputChange('paymentTermsId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('payment-terms');
                        setQuickAddFields({ code: '', name: searchVal, days: '', description: '' });
                      }}
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <Label className="text-slate-700 font-medium">Currency</Label>
                    <SearchableSelect
                      placeholder="Select currency"
                      options={currenciesData?.data?.map((c: any) => ({
                        label: `${c.currencyCode} - ${c.currencyName}`,
                        value: c.id
                      })) || []}
                      value={formData.currencyId}
                      onChange={v => handleInputChange('currencyId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('currency');
                        setQuickAddFields({ code: searchVal.toUpperCase().slice(0, 3), name: searchVal, symbol: '', decimalPlaces: 2 });
                      }}
                    />
                  </div>

                  {/* Port of Loading */}
                  <div>
                    <Label className="text-slate-700 font-medium">Port of Loading</Label>
                    <SearchableSelect
                      placeholder="Select port of loading"
                      options={portsData?.data?.map((p: any) => ({
                        label: `${p.code} - ${p.name}`,
                        value: p.id
                      })) || []}
                      value={formData.portOfLoading}
                      onChange={v => handleInputChange('portOfLoading', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('port');
                        setQuickAddFields({ code: '', name: searchVal, type: '', state: '' });
                      }}
                    />
                  </div>

                  {/* Remarks / Client Transfer Notes */}
                  <div className="col-span-2">
                    <Label className="text-slate-700 font-medium">Remarks / Client Transfer Notes</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={e => handleInputChange('remarks', e.target.value)}
                      placeholder="Enter remarks or notes"
                      rows={3}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <Label className="text-slate-700 font-medium">Status</Label>
                    <Select value={formData.status} onValueChange={v => handleInputChange('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-150 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Overlay Dialog */}
      {quickAddType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Quick Add {quickAddType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <button
                type="button"
                onClick={() => setQuickAddType(null)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {quickAddType === 'country' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Country Code *</Label>
                    <Input
                      placeholder="e.g. IN"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Country Name *</Label>
                    <Input
                      placeholder="e.g. India"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Phone Code</Label>
                    <Input
                      placeholder="e.g. +91"
                      value={quickAddFields.phoneCode || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, phoneCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Currency Code</Label>
                    <Input
                      placeholder="e.g. INR"
                      value={quickAddFields.currencyCode || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, currencyCode: e.target.value })}
                    />
                  </div>
                </>
              )}

              {quickAddType === 'zone' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Zone Code *</Label>
                    <Input
                      placeholder="e.g. NORTH"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Zone Name *</Label>
                    <Input
                      placeholder="e.g. North Zone"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Region</Label>
                    <Input
                      placeholder="e.g. North"
                      value={quickAddFields.region || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, region: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={quickAddFields.description || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {quickAddType === 'port' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Port Code *</Label>
                    <Input
                      placeholder="e.g. INBOM"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Port Name *</Label>
                    <Input
                      placeholder="e.g. Mumbai Port"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Type</Label>
                    <Input
                      placeholder="e.g. Sea/Air/Inland"
                      value={quickAddFields.type || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">State</Label>
                    <Input
                      placeholder="e.g. Maharashtra"
                      value={quickAddFields.state || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, state: e.target.value })}
                    />
                  </div>
                </>
              )}

              {quickAddType === 'payment-terms' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Code *</Label>
                    <Input
                      placeholder="e.g. NET30"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Name *</Label>
                    <Input
                      placeholder="e.g. Net 30 Days"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Days *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      value={quickAddFields.days || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, days: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={quickAddFields.description || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {quickAddType === 'currency' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Currency Code *</Label>
                    <Input
                      placeholder="e.g. USD"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Currency Name *</Label>
                    <Input
                      placeholder="e.g. US Dollar"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Symbol</Label>
                    <Input
                      placeholder="e.g. $"
                      value={quickAddFields.symbol || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, symbol: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Decimal Places</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2"
                      value={quickAddFields.decimalPlaces || 2}
                      onChange={e => setQuickAddFields({ ...quickAddFields, decimalPlaces: parseInt(e.target.value) || 2 })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickAddType(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    if (quickAddType === 'country') {
                      if (!quickAddFields.code || !quickAddFields.name) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createCountry(quickAddFields);
                      toast.success('Country created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['countries'] });
                      handleInputChange('countryId', res.data.countryId || res.data.id);
                    } else if (quickAddType === 'zone') {
                      if (!quickAddFields.code || !quickAddFields.name) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createZone(quickAddFields);
                      toast.success('Zone created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['zones'] });
                      handleInputChange('productZone', res.data.id);
                    } else if (quickAddType === 'port') {
                      if (!quickAddFields.code || !quickAddFields.name) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createPort(quickAddFields);
                      toast.success('Port created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['ports'] });
                      handleInputChange('portOfLoading', res.data.id);
                    } else if (quickAddType === 'payment-terms') {
                      if (!quickAddFields.code || !quickAddFields.name || !quickAddFields.days) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createPaymentTerms(quickAddFields);
                      toast.success('Payment Terms created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
                      handleInputChange('paymentTermsId', res.data.id);
                    } else if (quickAddType === 'currency') {
                      if (!quickAddFields.code || !quickAddFields.name) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createCurrency(quickAddFields);
                      toast.success('Currency created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['currencies'] });
                      handleInputChange('currencyId', res.data.id);
                    }
                    setQuickAddType(null);
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.response?.data?.message || `Failed to create ${quickAddType}`);
                  }
                }}
              >
                Save & Select
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
