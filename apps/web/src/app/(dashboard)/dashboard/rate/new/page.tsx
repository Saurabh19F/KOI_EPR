'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rateApi, salesApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LineItemsEditor, LineItem } from '@/components/line-items/line-items-editor';
import {
  Save,
  ArrowLeft,
  Search,
  Calculator,
  Package,
  DollarSign,
  TrendingUp,
  Truck,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AnalysisForm {
  analysisDate: string;
  enquiryOrderId: string;
  enquiryOrderNo: string;
  customerId: string;
  customerName: string;
  buyerCode: string;
  currencyId: string;
  exchangeRate: number;
  marginPercent: number;
  shipmentType: string;
  destination: string;
  notes: string;
  items: LineItem[];
}

const EMPTY_ANALYSIS: AnalysisForm = {
  analysisDate: new Date().toISOString().split('T')[0],
  enquiryOrderId: '',
  enquiryOrderNo: '',
  customerId: '',
  customerName: '',
  buyerCode: '',
  currencyId: '',
  exchangeRate: 1,
  marginPercent: 10,
  shipmentType: 'FOB',
  destination: '',
  notes: '',
  items: [],
};

export default function NewRateAnalysisPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showEnquirySearch, setShowEnquirySearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [enquirySearch, setEnquirySearch] = useState('');

  const [form, setForm] = useState<AnalysisForm>(EMPTY_ANALYSIS);

  // Reference data queries
  const { data: customersData } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => mastersApi.getCustomers({ limit: 100, search: customerSearch }),
    enabled: showCustomerSearch,
  });

  const { data: enquiriesData } = useQuery({
    queryKey: ['enquiries-for-analysis', enquirySearch],
    queryFn: () => salesApi.getEnquiries({ limit: 100, search: enquirySearch }),
    enabled: showEnquirySearch,
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: mastersApi.getCurrencies,
  });

  // Fetch exchange rate when currency changes
  const { data: exchangeRateData } = useQuery({
    queryKey: ['exchange-rate', form.currencyId],
    queryFn: () => rateApi.getCurrencyRate(form.currencyId),
    enabled: !!form.currencyId,
  });

  // Create analysis mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => rateApi.createAnalysis(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      toast.success('Analysis created successfully');
      router.push(`/rate/${response.data.analysisId || response.data.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create analysis');
    },
  });

  const handleFieldChange = (field: keyof AnalysisForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: any) => {
    setForm((prev) => ({
      ...prev,
      customerId: customer.customerId,
      customerName: customer.customerName,
      buyerCode: customer.buyerCode,
      currencyId: customer.currencyId || prev.currencyId,
    }));
    setShowCustomerSearch(false);
    setCustomerSearch('');
  };

  const handleEnquirySelect = (enquiry: any) => {
    setForm((prev) => ({
      ...prev,
      enquiryOrderId: enquiry.enquiryId,
      enquiryOrderNo: enquiry.enquiryNumber,
      customerId: enquiry.customerId || prev.customerId,
      customerName: enquiry.customer?.customerName || prev.customerName,
      buyerCode: enquiry.buyerCode || prev.buyerCode,
    }));
    setShowEnquirySearch(false);
    setEnquirySearch('');
  };

  const handleItemsChange = (items: LineItem[]) => {
    setForm((prev) => ({ ...prev, items }));
  };

  const handleSubmit = () => {
    if (!form.customerId) {
      toast.error('Please select a customer');
      setActiveTab('details');
      return;
    }

    if (form.items.length === 0) {
      toast.error('Please add at least one item');
      setActiveTab('items');
      return;
    }

    const submitData = {
      analysisDate: new Date(form.analysisDate),
      enquiryOrderId: form.enquiryOrderId || undefined,
      enquiryOrderNo: form.enquiryOrderNo || undefined,
      customerId: form.customerId,
      currencyId: form.currencyId || undefined,
      exchangeRate: form.exchangeRate,
      marginPercent: form.marginPercent,
      shipmentType: form.shipmentType,
      destination: form.destination,
      notes: form.notes,
      items: form.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        buyingPrice: item.unitPrice,
        expectedRate: item.expectedRate,
        gstPercent: item.gstPercent,
        totalValue: item.totalValue,
        remarks: item.remarks,
      })),
    };

    createMutation.mutate(submitData);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalPurchaseValue = form.items.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);
    const totalSellingValue = form.items.reduce((sum, item) => sum + ((item.sellingRate || item.expectedRate || 0) * item.quantity), 0);
    const totalMargin = totalSellingValue - totalPurchaseValue;
    const marginPercent = totalPurchaseValue > 0 ? (totalMargin / totalPurchaseValue) * 100 : 0;
    return { totalPurchaseValue, totalSellingValue, totalMargin, marginPercent };
  }, [form.items]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/rate">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Price Analysis</h1>
            <p className="text-gray-500">Calculate and analyze product rates</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/rate')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            <Calculator className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Analysis'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Items</p>
                <p className="text-lg font-semibold">{form.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Purchase Value</p>
                <p className="text-lg font-semibold">₹{totals.totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Selling Value</p>
                <p className="text-lg font-semibold">₹{totals.totalSellingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totals.marginPercent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`h-5 w-5 ${totals.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Margin</p>
                <p className={`text-lg font-semibold ${totals.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.marginPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">
            <Calculator className="h-4 w-4 mr-2" />
            Analysis Details
          </TabsTrigger>
          <TabsTrigger value="items">
            <Package className="h-4 w-4 mr-2" />
            Items ({form.items.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* Analysis Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Analysis Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full justify-start text-left"
                >
                  {form.customerId ? `${form.buyerCode} - ${form.customerName}` : 'Select Customer...'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buyer Code</Label>
                  <Input value={form.buyerCode} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={form.customerName} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Analysis Date</Label>
                  <Input
                    type="date"
                    value={form.analysisDate}
                    onChange={(e) => handleFieldChange('analysisDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Enquiry</Label>
                  <Button
                    variant="outline"
                    onClick={() => setShowEnquirySearch(true)}
                    className="w-full justify-start text-left"
                  >
                    {form.enquiryOrderNo || 'Select Enquiry...'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currencyId} onValueChange={(v) => handleFieldChange('currencyId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currenciesData?.data?.map((c: any) => (
                        <SelectItem key={c.currencyId || c.id} value={c.currencyId || c.id}>
                          {c.currencyCode} - {c.currencyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.exchangeRate}
                    onChange={(e) => handleFieldChange('exchangeRate', parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Items for Analysis
                </span>
                <Badge variant="outline">
                  {form.items.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsEditor
                items={form.items}
                onChange={handleItemsChange}
                showExpectedRate={true}
                showSellingRate={true}
                showPurchasePrice={true}
                showMargin={true}
                currencySymbol="₹"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Margin %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.marginPercent}
                    onChange={(e) => handleFieldChange('marginPercent', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500">Applied to items without individual margin</p>
                </div>
                <div className="space-y-2">
                  <Label>Shipment Type</Label>
                  <Select value={form.shipmentType} onValueChange={(v) => handleFieldChange('shipmentType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                      <SelectItem value="CIF">CIF - Cost Insurance Freight</SelectItem>
                      <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                      <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  value={form.destination}
                  onChange={(e) => handleFieldChange('destination', e.target.value)}
                  placeholder="Port of destination"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Additional notes for this analysis..."
                  rows={4}
                />
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                <h4 className="font-medium">Analysis Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Purchase Value:</span>
                    <span className="font-medium">₹{totals.totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Selling Value:</span>
                    <span className="font-medium">₹{totals.totalSellingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Margin:</span>
                    <span className={`font-medium ${totals.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{totals.totalMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Margin %:</span>
                    <span className={`font-medium ${totals.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totals.marginPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Search Dialog */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                className="pl-10"
                autoFocus
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {customersData?.data?.data?.map((customer: any) => (
                <div
                  key={customer.customerId}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{customer.buyerCode}</span>
                    <span className="text-gray-500">{customer.customerName}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {customer.city}, {customer.country}
                  </div>
                </div>
              ))}
              {(!customersData?.data?.data || customersData.data.data.length === 0) && (
                <div className="text-center text-gray-500 py-4">No customers found</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enquiry Search Dialog */}
      <Dialog open={showEnquirySearch} onOpenChange={setShowEnquirySearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Enquiry Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by enquiry number..."
                className="pl-10"
                autoFocus
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {enquiriesData?.data?.data?.map((enquiry: any) => (
                <div
                  key={enquiry.enquiryId}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEnquirySelect(enquiry)}
                >
                  <div className="flex justify-between">
                    <span className="font-mono font-medium">{enquiry.enquiryNumber}</span>
                    <Badge variant="secondary">{enquiry.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {enquiry.customer?.customerName || enquiry.customerName}
                  </div>
                </div>
              ))}
              {(!enquiriesData?.data?.data || enquiriesData.data.data.length === 0) && (
                <div className="text-center text-gray-500 py-4">No enquiries found</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
