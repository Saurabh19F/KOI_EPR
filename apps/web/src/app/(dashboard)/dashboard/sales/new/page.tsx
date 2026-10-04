'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi, mastersApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import '@/components/sales/SalesEnquiryGrid.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Save, ArrowLeft, Search, Package, Building, Truck, AlertCircle, ChevronLeft, ChevronRight, Send, FileText } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface EnquiryItem {
  id?: string;
  productId?: string;
  sku?: string;
  productName?: string;
  productDescription?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  unitSize?: string;
  unitPerCarton?: number;
  cbmPerBox?: number;
  quantity?: number;
  totalCbm?: number;
  expectedRate?: number;
  mrp?: number;
  buyingPrice?: number;
  gstPercent?: number;
  purchasePersonId?: string;
  purchasePersonName?: string;
  productPurchasePersonName?: string;
  remarks?: string;
  isNew?: boolean;
  isManualEntry?: boolean;
  manualProductName?: string;
}

interface EnquiryForm {
  enquiryDate: string;
  customerId: string;
  buyerCode: string;
  buyerName: string;
  contactName: string;
  contactNumber: string;
  buyerEmail: string;
  country: string;
  state: string;
  city: string;
  poNumber: string;
  poDate: string;
  pod: string;
  paymentTermsId: string;
  currencyId: string;
  shipmentDetails: string;
  cubeSize: string;
  portOfLoading: string;
  transporterDetails: string;
  isBillingSameAsDelivery: boolean;
  billingAddress: string;
  deliveryAddress: string;
  isExportEnquiry: boolean;
  isPoReceived: boolean;
  isPurchaseRequired: boolean;
  isRateCalculationRequired: boolean;
  isApprovalRequired: boolean;
  isEmailReminderRequired: boolean;
  remarks: string;
  items: EnquiryItem[];
  createdBy?: string;
}

const EMPTY_ITEM: EnquiryItem = {
  productName: '',
  quantity: 1,
  isNew: true,
  isManualEntry: false,
};

export default function NewSalesEnquiryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('details');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [manualProductList, setManualProductList] = useState<{ name: string; remarks?: string }[]>([]);

  const { data: usersData } = useQuery({
    queryKey: ['users-list-sales-new-form'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
  });

  const { data: purchaseUsersData } = useQuery({
    queryKey: ['purchase-users-lookup'],
    queryFn: () => salesApi.getPurchaseUsers(),
  });

  const [form, setForm] = useState<EnquiryForm>({
    enquiryDate: (() => {
      const date = new Date();
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    })(),
    customerId: '',
    buyerCode: '',
    buyerName: '',
    contactName: '',
    contactNumber: '',
    buyerEmail: '',
    country: '',
    state: '',
    city: '',
    poNumber: '',
    poDate: '',
    pod: '',
    paymentTermsId: '',
    currencyId: '',
    shipmentDetails: '',
    cubeSize: '',
    portOfLoading: '',
    transporterDetails: '',
    isBillingSameAsDelivery: false,
    billingAddress: '',
    deliveryAddress: '',
    isExportEnquiry: false,
    isPoReceived: false,
    isPurchaseRequired: false,
    isRateCalculationRequired: false,
    isApprovalRequired: false,
    isEmailReminderRequired: false,
    remarks: '',
    items: [{ ...EMPTY_ITEM }],
    createdBy: user?.userId || '',
  });

  useEffect(() => {
    if (user?.userId && !form.createdBy) {
      setForm((prev) => ({ ...prev, createdBy: user.userId }));
    }
  }, [user, form.createdBy]);

  // Reference data queries
  const { data: customersData } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => mastersApi.getCustomers({ limit: 100, search: customerSearch }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () => mastersApi.getProducts({ limit: 100, search: productSearch }),
  });

  const { data: paymentTermsData } = useQuery({
    queryKey: ['paymentTerms'],
    queryFn: mastersApi.getPaymentTerms,
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: mastersApi.getCurrencies,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: mastersApi.getCategories,
  });

  // Create enquiry mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => salesApi.createEnquiry(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      toast.success('Enquiry created successfully');
      router.push(`/dashboard/sales/${response.data.enquiryOrderId}`);
    },
    onError: (error) => {
      toast.error('Failed to create enquiry');
    },
  });

  const handleFieldChange = (field: keyof EnquiryForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: any) => {
    setForm((prev) => ({
      ...prev,
      customerId: customer.customerId,
      buyerCode: customer.buyerCode,
      buyerName: customer.customerName,
      contactName: customer.contactPerson || '',
      contactNumber: customer.contactNumber || '',
      buyerEmail: customer.email || '',
      country: customer.country || '',
      state: customer.state || '',
      city: customer.city || '',
      pod: customer.pod || '',
      paymentTermsId: customer.paymentTermsId || '',
      currencyId: customer.currencyId || '',
      portOfLoading: customer.portOfLoading || '',
      billingAddress: customer.billingAddress || '',
      deliveryAddress: prev.isBillingSameAsDelivery ? customer.billingAddress : prev.deliveryAddress,
    }));
    setShowCustomerSearch(false);
    setCustomerSearch('');
  };

  const mapProductToItem = (product: any, baseItem?: EnquiryItem): EnquiryItem => {
    const quantity = baseItem?.quantity || 1;
    const purchasePersonName = product.purchasePersonName ||
      (purchaseUsersData?.data?.find((u: any) => u.userId === product.purchasePersonId)?.name) ||
      (usersData?.data?.data?.find((u: any) => u.userId === product.purchasePersonId)?.name) ||
      'N/A';
    const cats = categoriesData?.data?.data || categoriesData?.data || [];
    const resolvedCategoryName = product.category?.categoryName
      || cats.find((c: any) => c.categoryId === product.categoryId)?.categoryName
      || '';
    const resolvedCategoryId = product.category?.categoryId || product.categoryId || '';
    return {
      ...EMPTY_ITEM,
      ...baseItem,
      productId: product.productId,
      sku: product.sku,
      productName: product.productName,
      productDescription: product.description,
      categoryId: resolvedCategoryId,
      categoryName: resolvedCategoryName,
      brandId: product.brand?.brandId,
      brandName: product.brand?.brandName,
      unitSize: product.unitSize,
      unitPerCarton: product.unitsPerCase,
      cbmPerBox: product.cbmPerBox,
      mrp: product.mrp,
      buyingPrice: product.buyingPrice,
      expectedRate: product.mrp,
      gstPercent: product.gstRate?.gstPercent,
      purchasePersonId: product.purchasePersonId,
      productPurchasePersonName: purchasePersonName,
      totalCbm: product.cbmPerBox ? product.cbmPerBox * quantity : undefined,
      isNew: !baseItem?.id,
      isManualEntry: false,
      manualProductName: undefined,
    };
  };

  const handleAddSelectedProducts = () => {
    if (selectedProducts.length === 0) return;

    const updatedItems = [...form.items];
    let targetIndex = selectedItemIndex;

    // If no target index specified, check if the last item is empty
    if (targetIndex === null) {
      const lastIdx = updatedItems.length - 1;
      if (lastIdx >= 0 && !updatedItems[lastIdx].sku && !updatedItems[lastIdx].productName) {
        targetIndex = lastIdx;
      }
    }

    selectedProducts.forEach((product, idx) => {
      if (idx === 0 && targetIndex !== null && targetIndex >= 0 && targetIndex < updatedItems.length) {
        updatedItems[targetIndex] = mapProductToItem(product, updatedItems[targetIndex]);
      } else {
        updatedItems.push(mapProductToItem(product));
      }
    });

    setForm((prev) => ({ ...prev, items: updatedItems }));
    setShowProductSearch(false);
    setProductSearch('');
    setSelectedItemIndex(null);
    setSelectedProducts([]);
  };

  const handleManualProductConfirm = (manualData: {
    manualProductName: string;
    sku: string;
    categoryName: string;
    brandName: string;
    unitSize: string;
    cbmPerBox: number;
    quantity: number;
    remarks?: string;
  }, keepOpen?: boolean) => {
    const updatedItems = [...form.items];
    const newManualItem: EnquiryItem = {
      ...EMPTY_ITEM,
      productId: undefined,
      sku: manualData.sku,
      productName: manualData.manualProductName,
      manualProductName: manualData.manualProductName,
      categoryName: manualData.categoryName,
      brandName: manualData.brandName,
      unitSize: manualData.unitSize,
      cbmPerBox: manualData.cbmPerBox,
      quantity: manualData.quantity,
      totalCbm: manualData.cbmPerBox && manualData.quantity ? manualData.cbmPerBox * manualData.quantity : undefined,
      remarks: manualData.remarks,
      isManualEntry: true,
      isNew: true,
    };

    if (selectedItemIndex !== null && selectedItemIndex >= 0 && selectedItemIndex < updatedItems.length) {
      // Replace the selected row (first manual add from product search)
      updatedItems[selectedItemIndex] = { ...newManualItem, isNew: !updatedItems[selectedItemIndex].id };
    } else {
      // No selected row — check if last row is empty, otherwise append
      const lastIdx = updatedItems.length - 1;
      if (lastIdx >= 0 && !updatedItems[lastIdx].sku && !updatedItems[lastIdx].productName) {
        updatedItems[lastIdx] = newManualItem;
      } else {
        updatedItems.push(newManualItem);
      }
    }

    setForm((prev) => ({ ...prev, items: updatedItems }));

    if (keepOpen) {
      // Clear the selected index so next add appends a new row
      setSelectedItemIndex(null);
    } else {
      setShowManualProduct(false);
      setSelectedItemIndex(null);
    }
  };

  const handleItemChange = (index: number, field: keyof EnquiryItem, value: any) => {
    const updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate total CBM
    if (field === 'cbmPerBox' || field === 'quantity') {
      const cbmPerBox = field === 'cbmPerBox' ? value : updatedItems[index].cbmPerBox;
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      updatedItems[index].totalCbm = cbmPerBox && quantity ? cbmPerBox * quantity : undefined;
    }

    setForm((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleOpenSaveModal = () => {
    if (!form.customerId) {
      toast.error('Please select a customer');
      setActiveTab('details');
      return;
    }

    if (form.items.length === 0 || !form.items.some((item) => item.productName)) {
      toast.error('Please add at least one product');
      setActiveTab('products');
      return;
    }

    setShowSaveModal(true);
  };

  const handleSubmit = (targetStatus: 'submitted' | 'draft' = 'submitted') => {
    const submitData = {
      enquiryDate: new Date(form.enquiryDate),
      customerId: form.customerId,
      buyerCode: form.buyerCode,
      buyerName: form.buyerName,
      contactName: form.contactName,
      contactNumber: form.contactNumber,
      buyerEmail: form.buyerEmail,
      country: form.country,
      state: form.state,
      city: form.city,
      poNumber: form.poNumber,
      poDate: form.poDate ? new Date(form.poDate) : undefined,
      pod: form.pod,
      paymentTermsId: form.paymentTermsId,
      currencyId: form.currencyId,
      cubeSize: form.cubeSize,
      portOfLoading: form.portOfLoading,
      isExportEnquiry: form.isExportEnquiry,
      isPoReceived: form.isPoReceived,
      isPurchaseRequired: form.isPurchaseRequired,
      isRateCalculationRequired: form.isRateCalculationRequired,
      isApprovalRequired: form.isApprovalRequired,
      isEmailReminderRequired: form.isEmailReminderRequired,
      remarks: form.remarks,
      status: targetStatus,
      createdBy: form.createdBy || undefined,
      items: form.items
        .filter(item => item.productName)
        .map((item) => ({
          productId: item.productId,
          sku: item.sku,
          productName: item.isManualEntry ? item.manualProductName : item.productName,
          productDescription: item.productDescription,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          brandId: item.brandId,
          brandName: item.brandName,
          unitSize: item.unitSize,
          unitPerCarton: item.unitPerCarton ? Number(item.unitPerCarton) : undefined,
          cbmPerBox: item.cbmPerBox ? Number(item.cbmPerBox) : undefined,
          quantity: item.quantity ? Number(item.quantity) : undefined,
          totalCbm: item.totalCbm ? Number(item.totalCbm) : undefined,
          expectedRate: item.expectedRate ? Number(item.expectedRate) : undefined,
          mrp: item.mrp ? Number(item.mrp) : undefined,
          buyingPrice: item.buyingPrice ? Number(item.buyingPrice) : undefined,
          gstPercent: item.gstPercent ? Number(item.gstPercent) : undefined,
          purchasePersonId: item.purchasePersonId,
          productPurchasePersonName: item.productPurchasePersonName,
          remarks: item.remarks,
          isManualEntry: item.isManualEntry || false,
          manualProductName: item.isManualEntry ? item.manualProductName : undefined,
          masterStatus: item.isManualEntry ? 'not_in_master' : 'master_product',
        })),
    };
    createMutation.mutate(submitData);
  };

  const totalCbm = form.items.reduce((sum, item) => sum + (item.totalCbm || 0), 0);

  const TABS = ['details', 'logistics', 'products'];

  const handleNextTab = () => {
    if (activeTab === 'details') {
      if (!form.customerId) {
        toast.error('Please select a customer');
        return;
      }
      setActiveTab('logistics');
    } else if (activeTab === 'logistics') {
      setActiveTab('products');
    } else if (activeTab === 'products') {
      if (form.items.length === 0 || !form.items.some((item) => item.productName)) {
        toast.error('Please add at least one product');
        return;
      }
      handleOpenSaveModal();
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Sales Enquiry</h1>
            <p className="text-gray-500">New enquiry order</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/sales')}>
            Cancel
          </Button>
          {activeTab !== 'products' ? (
            <Button onClick={handleNextTab}>
              Next Step
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleOpenSaveModal} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Saving...' : 'Save Enquiry'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Buyer Details</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="products">Products ({form.items.length})</TabsTrigger>
        </TabsList>

        {/* Buyer Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Buyer / Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCustomerSearch(true)}
                      className="w-full justify-start text-left"
                    >
                      {form.buyerCode ? `${form.buyerCode} - ${form.buyerName}` : 'Select Customer...'}
                    </Button>
                  </div>
                </div>

                {/* Creator Field (Read Only) */}
                <div className="space-y-2">
                  <Label>Enquiry Creator / Owner *</Label>
                  <Input
                    value={
                      (() => {
                        const authUser = user as any;
                        const currentUserData = usersData?.data?.data?.find((u: any) => u.userId === authUser?.userId);
                        if (currentUserData) {
                          return `${currentUserData.name}${currentUserData.userCode ? ` (${currentUserData.userCode})` : ''}`;
                        }
                        return `${authUser?.name || ''}${authUser?.userCode ? ` (${authUser.userCode})` : ''}`;
                      })()
                    }
                    disabled
                    readOnly
                    className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buyer Code</Label>
                  <Input value={form.buyerCode} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={form.buyerName} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={form.contactName} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input value={form.contactNumber} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.buyerEmail} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={form.country} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logistics Tab */}
        <TabsContent value="logistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Logistics Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Enquiry Date</Label>
                  <Input type="datetime-local" value={form.enquiryDate} disabled readOnly className="bg-slate-50 cursor-not-allowed text-slate-700 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label>POD (Port of Delivery)</Label>
                  <Input value={form.pod} onChange={(e) => handleFieldChange('pod', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={form.paymentTermsId} onValueChange={(v) => handleFieldChange('paymentTermsId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsData?.data?.map((pt: any) => (
                        <SelectItem key={pt.paymentTermsId} value={pt.paymentTermsId}>
                          {pt.termsName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currencyId} onValueChange={(v) => handleFieldChange('currencyId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currenciesData?.data?.map((c: any) => (
                        <SelectItem key={c.currencyId} value={c.currencyId}>
                          {c.currencyCode} - {c.currencyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cube Size</Label>
                  <Select value={form.cubeSize} onValueChange={(v) => handleFieldChange('cubeSize', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Container Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 ft</SelectItem>
                      <SelectItem value="40">40 ft</SelectItem>
                      <SelectItem value="40HC">40 HC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Port of Loading</Label>
                  <Input value={form.portOfLoading} onChange={(e) => handleFieldChange('portOfLoading', e.target.value)} />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Items Spreadsheet
                </span>
                <Badge variant="outline" className="font-mono">Total CBM: {totalCbm.toFixed(4)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="sales-grid-container">
                <table className="sales-grid-table">
                  <thead>
                    <tr>
                      <th className="sales-sticky-col-num-hdr w-10 text-center">#</th>
                      <th className="sales-sticky-col-sku-hdr min-w-[150px]">Product Code (SKU)</th>
                      <th className="min-w-[200px]">Product Name</th>
                      <th className="min-w-[150px]">Purchase Person</th>
                      <th className="min-w-[120px]">Brand</th>
                      <th className="min-w-[100px]">Unit Size</th>
                      <th className="w-24 text-right">Units Per Case</th>
                      <th className="w-28 text-right">CBM</th>
                      <th className="w-24 text-right">Quantity</th>
                      <th className="min-w-[120px]">Category</th>
                      <th className="w-28 text-right">Total CBM</th>
                      <th className="min-w-[200px]">Remarks</th>
                      <th className="w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => {
                      const isMasterProduct = Boolean(item.productId) || Boolean(!item.isManualEntry && item.sku && item.sku !== 'NOT IN MASTER');
                      return (
                        <tr key={index} className="sales-grid-row">
                        <td className="sales-sticky-col-num text-center font-medium text-xs">
                          {index + 1}
                        </td>
                        <td className="sales-sticky-col-sku p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-left justify-start font-mono text-xs text-blue-600 hover:bg-blue-50/50"
                            onClick={() => {
                              setSelectedItemIndex(index);
                              setShowProductSearch(true);
                            }}
                          >
                            {item.sku || 'Select SKU...'}
                          </Button>
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`sales-grid-input ${isMasterProduct ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.productName || ''}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            disabled={isMasterProduct}
                            placeholder="Product Name"
                          />
                        </td>
                        <td>
                          {isMasterProduct && item.purchasePersonId ? (
                            <input
                              type="text"
                              className="sales-grid-input bg-slate-50 text-slate-500 cursor-not-allowed"
                              value={item.productPurchasePersonName || purchaseUsersData?.data?.find((u: any) => u.userId === item.purchasePersonId)?.name || ''}
                              disabled
                            />
                          ) : (
                            <select
                              className="sales-grid-input"
                              value={item.purchasePersonId || ''}
                              onChange={(e) => handleItemChange(index, 'purchasePersonId', e.target.value)}
                              title="Purchase Person"
                            >
                              <option value="">Select Purchase...</option>
                              {purchaseUsersData?.data?.map((u: any) => (
                                <option key={u.userId} value={u.userId}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`sales-grid-input ${isMasterProduct ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.brandName || ''}
                            onChange={(e) => handleItemChange(index, 'brandName', e.target.value)}
                            disabled={isMasterProduct}
                            placeholder="Brand"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`sales-grid-input text-right ${isMasterProduct ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.unitSize || ''}
                            onChange={(e) => handleItemChange(index, 'unitSize', e.target.value)}
                            disabled={isMasterProduct}
                            placeholder="Unit Size"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={`sales-grid-input text-right ${isMasterProduct ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.unitPerCarton || ''}
                            onChange={(e) => handleItemChange(index, 'unitPerCarton', e.target.value ? parseInt(e.target.value) : 0)}
                            disabled={isMasterProduct}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="sales-grid-input text-right"
                            value={item.cbmPerBox || ''}
                            onChange={(e) => handleItemChange(index, 'cbmPerBox', e.target.value ? parseFloat(e.target.value) : 0)}
                            placeholder="0.0000"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="sales-grid-input text-right font-semibold"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value ? parseInt(e.target.value) : 0)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <select
                            className={`sales-grid-input ${isMasterProduct ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.categoryName || ''}
                            onChange={(e) => {
                              const cats = categoriesData?.data?.data || categoriesData?.data || [];
                              const selected = cats.find((c: any) => c.categoryName === e.target.value);
                              setForm((prev) => {
                                const updatedItems = [...prev.items];
                                updatedItems[index] = { ...updatedItems[index], categoryName: e.target.value, categoryId: selected?.categoryId || '' };
                                return { ...prev, items: updatedItems };
                              });
                            }}
                            disabled={isMasterProduct}
                            title="Category"
                          >
                            <option value="">Select Category</option>
                            {(categoriesData?.data?.data || categoriesData?.data || []).map((cat: any) => (
                              <option key={cat.categoryId} value={cat.categoryName}>
                                {cat.categoryName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-right font-mono text-xs text-slate-500 font-medium">
                          {item.totalCbm?.toFixed(4) || '0.0000'}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="sales-grid-input"
                            value={item.remarks || ''}
                            onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                            placeholder="Add remark..."
                          />
                        </td>
                        <td className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(index)}
                            disabled={form.items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Button variant="outline" onClick={addItem} className="font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row (Item)
                </Button>
                <div className="text-xs text-slate-400 italic">
                  💡 Double-click or click SKU to search the master product list. Type directly in the columns to edit.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Bottom Step Navigation Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <Button
          variant="outline"
          onClick={handlePrevTab}
          disabled={activeTab === 'details'}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Step
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          Step {TABS.indexOf(activeTab) + 1} of {TABS.length}
        </div>

        {activeTab !== 'products' ? (
          <Button onClick={handleNextTab} className="gap-2">
            Next Step
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleOpenSaveModal}
            disabled={createMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {createMutation.isPending ? 'Saving...' : 'Save Enquiry'}
          </Button>
        )}
      </div>

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

      {/* Product Search Dialog */}
      <Dialog
        open={showProductSearch}
        onOpenChange={(open) => {
          setShowProductSearch(open);
          if (!open) setSelectedProducts([]);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pr-4">
            <DialogTitle>Search Product</DialogTitle>
            {selectedProducts.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-medium">
                {selectedProducts.length} Selected
              </Badge>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-10"
                autoFocus
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            {/* Select All Bar */}
            {productsData?.data?.data && productsData.data.data.length > 0 && (
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 border rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-products"
                    checked={
                      productsData.data.data.length > 0 &&
                      productsData.data.data.every((p: any) =>
                        selectedProducts.some((sp) => sp.productId === p.productId)
                      )
                    }
                    onCheckedChange={(checked) => {
                      const allVisible = productsData.data.data;
                      if (checked) {
                        const newSelection = [...selectedProducts];
                        allVisible.forEach((p: any) => {
                          if (!newSelection.some((sp) => sp.productId === p.productId)) {
                            newSelection.push(p);
                          }
                        });
                        setSelectedProducts(newSelection);
                      } else {
                        const visibleIds = new Set(allVisible.map((p: any) => p.productId));
                        setSelectedProducts(selectedProducts.filter((p) => !visibleIds.has(p.productId)));
                      }
                    }}
                  />
                  <label htmlFor="select-all-products" className="cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    Select All Visible Products ({productsData.data.data.length})
                  </label>
                </div>
                {selectedProducts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-slate-500 hover:text-slate-800"
                    onClick={() => setSelectedProducts([])}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {productsData?.data?.data?.map((product: any) => {
                const isSelected = selectedProducts.some((sp) => sp.productId === product.productId);
                return (
                  <div
                    key={product.productId}
                    className={`p-3 border rounded-lg hover:bg-amber-50 cursor-pointer flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400' : 'bg-white'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProducts(selectedProducts.filter((p) => p.productId !== product.productId));
                      } else {
                        setSelectedProducts([...selectedProducts, product]);
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts([...selectedProducts, product]);
                        } else {
                          setSelectedProducts(selectedProducts.filter((p) => p.productId !== product.productId));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{product.sku}</span>
                        <span className="text-gray-500">{product.productName}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.category?.categoryName} | {product.brand?.brandName}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!productsData?.data?.data || productsData.data.data.length === 0) && (
                <div className="text-center text-gray-500 py-4">No products found in masters</div>
              )}
            </div>

            <div className="border-t pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  className="border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 text-xs"
                  onClick={() => {
                    setShowProductSearch(false);
                    setShowManualProduct(true);
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Product Not in Masters — Add Manually
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProductSearch(false);
                      setSelectedProducts([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddSelectedProducts}
                    disabled={selectedProducts.length === 0}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Add Selected ({selectedProducts.length})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Product Entry Dialog */}
      <Dialog
        open={showManualProduct}
        onOpenChange={(open) => {
          setShowManualProduct(open);
          if (!open) setManualProductList([]);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Product Not in Masters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>This product will be flagged as NOT IN MASTER. Purchase team will review and create it in Product Master.</span>
            </div>

            {/* Add product input row */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label>Product Name *</Label>
                <Input
                  id="manualProductName"
                  placeholder="e.g. Organic Chilli Sauce 250gm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nameEl = e.target as HTMLInputElement;
                      const name = nameEl.value.trim();
                      if (!name) return;
                      setManualProductList((prev) => [...prev, { name }]);
                      nameEl.value = '';
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    // If pasted text has multiple lines, split and add each as a product
                    const lines = pastedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
                    if (lines.length > 1) {
                      e.preventDefault();
                      setManualProductList((prev) => [
                        ...prev,
                        ...lines.map((name) => ({ name })),
                      ]);
                      toast.success(`${lines.length} products pasted`);
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-50 h-9"
                onClick={() => {
                  const nameEl = document.getElementById('manualProductName') as HTMLInputElement;
                  const name = nameEl?.value?.trim();
                  if (!name) {
                    toast.error('Enter a product name');
                    return;
                  }
                  setManualProductList((prev) => [...prev, { name }]);
                  nameEl.value = '';
                  nameEl.focus();
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Queued products list */}
            {manualProductList.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {manualProductList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}.</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setManualProductList((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-1.5 bg-slate-50 text-xs text-slate-500 font-medium">
                  {manualProductList.length} product{manualProductList.length > 1 ? 's' : ''} queued
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Remarks (optional — applies to all)</Label>
              <Input
                id="manualRemarks"
                placeholder="Any additional details for Purchase team..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowManualProduct(false); setManualProductList([]); }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              disabled={manualProductList.length === 0}
              onClick={() => {
                const remarks = (document.getElementById('manualRemarks') as HTMLInputElement)?.value;

                setForm((prev) => {
                  const updatedItems = [...prev.items];

                  manualProductList.forEach((product, idx) => {
                    const newItem: EnquiryItem = {
                      ...EMPTY_ITEM,
                      productId: undefined,
                      sku: 'NOT IN MASTER',
                      productName: product.name,
                      manualProductName: product.name,
                      categoryName: '',
                      brandName: '',
                      unitSize: '',
                      cbmPerBox: 0,
                      quantity: 1,
                      remarks: remarks || undefined,
                      isManualEntry: true,
                      isNew: true,
                    };

                    if (idx === 0 && selectedItemIndex !== null && selectedItemIndex >= 0 && selectedItemIndex < updatedItems.length) {
                      updatedItems[selectedItemIndex] = newItem;
                    } else if (idx === 0) {
                      const lastIdx = updatedItems.length - 1;
                      if (lastIdx >= 0 && !updatedItems[lastIdx].sku && !updatedItems[lastIdx].productName) {
                        updatedItems[lastIdx] = newItem;
                      } else {
                        updatedItems.push(newItem);
                      }
                    } else {
                      updatedItems.push(newItem);
                    }
                  });

                  return { ...prev, items: updatedItems };
                });

                toast.success(`${manualProductList.length} product${manualProductList.length > 1 ? 's' : ''} added`);
                setManualProductList([]);
                setShowManualProduct(false);
                setSelectedItemIndex(null);
              }}
            >
              Add {manualProductList.length > 0 ? `${manualProductList.length} ` : ''}as NOT IN MASTER
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Save Options Modal (Submit vs Draft) */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Save className="h-5 w-5 text-emerald-600" />
              Save Sales Enquiry
            </DialogTitle>
            <DialogDescription>
              Select how you would like to save this enquiry on the status timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* Submit Option */}
            <div
              className="p-4 border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex items-start gap-4 group"
              onClick={() => {
                setShowSaveModal(false);
                handleSubmit('submitted');
              }}
            >
              <div className="p-2.5 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform mt-0.5 shadow-sm">
                <Send className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  Submit Enquiry
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">Submit & Proceed</Badge>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enquiry will be marked as <strong>Submitted</strong> on the status timeline and will advance into the workflow.
                </p>
              </div>
            </div>

            {/* Save as Draft Option */}
            <div
              className="p-4 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-400 rounded-xl cursor-pointer transition-all flex items-start gap-4 group"
              onClick={() => {
                setShowSaveModal(false);
                handleSubmit('draft');
              }}
            >
              <div className="p-2.5 bg-slate-200 text-slate-700 rounded-lg group-hover:scale-105 transition-transform mt-0.5 shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">
                  Save as Draft
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enquiry will be saved as <strong>Draft</strong> on the status timeline so you can edit and submit it later.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
