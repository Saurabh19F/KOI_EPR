'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesOrderApi, mastersApi, usersApi, salesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Package,
  Building,
  Truck,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Ship,
  CreditCard,
  User,
  Box,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────

interface OrderItem {
  productId?: string;
  productCode?: string;
  productName: string;
  enquiryNo?: string;
  categoryName?: string;
  brandName?: string;
  sku?: string;
  hsnCode?: string;
  uomName?: string;
  unitSize?: string;
  unitBasis?: string;
  packingType?: string;
  location?: string;
  purchasePersonId?: string;
  purchasePersonName?: string;
  unitsPerCase?: number;
  quantity: number;
  unitPrice: number;
  mrp?: number;
  buyingBestLandingRate?: number;
  landingCost?: number;
  discountPercent?: number;
  discountAmount?: number;
  gstRate?: number;
  cbmPerBox?: number;
  haulage?: number;
  shiftOrderNo?: string;
  description?: string;
  remarks?: string;
  currencyType?: string;
  itemSelected?: boolean;
  status?: string;
  importedBy?: string;
  poi?: string;
  nutrition?: string;
  ingredients?: string;
  barcode?: string;
  batchNumber?: string;
  shelfLifeMonths?: number;
  mfgDate?: string;
  allergenAdvice?: string;
  netWeight?: string;
  isManualEntry?: boolean;
}

interface OrderForm {
  enquiryIds: string[];
  orderDate: string;
  expectedDeliveryDate: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  billingAddress: string;
  billingCountry: string;
  billingState: string;
  billingStateCode: string;
  billingCity: string;
  billingPincode: string;
  billingGstin: string;
  shippingAddress: string;
  shippingCountry: string;
  shippingState: string;
  shippingStateCode: string;
  shippingCity: string;
  shippingPincode: string;
  shippingGstin: string;
  sameAsShipping: boolean;
  salesPersonId: string;
  salesPersonName: string;
  paymentTermsId: string;
  currencyId: string;
  exchangeRate: number;
  isExport: boolean;
  portOfLoading: string;
  portOfDischarge: string;
  poNumber: string;
  poDate: string;
  piNumber: string;
  containerSize: string;
  cbmRequired: number;
  grossWeight: number;
  netWeight: number;
  repunchCount: number;
  shipmentDetails: string;
  discountPercent: number;
  freightAmount: number;
  packingAmount: number;
  insuranceAmount: number;
  otherCharges: number;
  termsAndConditions: string;
  notes: string;
  items: OrderItem[];
}

const EMPTY_ITEM: OrderItem = {
  productName: '',
  quantity: 1,
  unitPrice: 0,
  isManualEntry: false,
};

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ─── Component ───────────────────────────────────────────────────────

export default function NewSalesOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('buyer');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showEnquiryPicker, setShowEnquiryPicker] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState('');

  const nowLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState<OrderForm>({
    enquiryIds: [],
    orderDate: nowLocal(),
    expectedDeliveryDate: '',
    customerId: '',
    customerName: '',
    customerCode: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    billingAddress: '',
    billingCountry: '',
    billingState: '',
    billingStateCode: '',
    billingCity: '',
    billingPincode: '',
    billingGstin: '',
    shippingAddress: '',
    shippingCountry: '',
    shippingState: '',
    shippingStateCode: '',
    shippingCity: '',
    shippingPincode: '',
    shippingGstin: '',
    sameAsShipping: false,
    salesPersonId: user?.userId || '',
    salesPersonName: user?.name || '',
    paymentTermsId: '',
    currencyId: '',
    exchangeRate: 1,
    isExport: false,
    portOfLoading: '',
    portOfDischarge: '',
    poNumber: '',
    poDate: '',
    piNumber: '',
    containerSize: '',
    cbmRequired: 0,
    grossWeight: 0,
    netWeight: 0,
    repunchCount: 0,
    shipmentDetails: '',
    discountPercent: 0,
    freightAmount: 0,
    packingAmount: 0,
    insuranceAmount: 0,
    otherCharges: 0,
    termsAndConditions: '',
    notes: '',
    items: [{ ...EMPTY_ITEM }],
  });

  useEffect(() => {
    if (user?.userId && !form.salesPersonId) {
      setForm((prev) => ({ ...prev, salesPersonId: user.userId, salesPersonName: user.name || '' }));
    }
  }, [user, form.salesPersonId]);

  // ─── Reference data queries ─────────────────────────────────────

  const { data: customersData } = useQuery({
    queryKey: ['customers-so', customerSearch],
    queryFn: () => mastersApi.getCustomers({ limit: 100, search: customerSearch }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-so', productSearch],
    queryFn: () => mastersApi.getProducts({ limit: 100, search: productSearch }),
  });

  const { data: paymentTermsData } = useQuery({
    queryKey: ['paymentTerms-so'],
    queryFn: mastersApi.getPaymentTerms,
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies-so'],
    queryFn: mastersApi.getCurrencies,
  });

  const { data: portsData } = useQuery({
    queryKey: ['ports-so'],
    queryFn: mastersApi.getPorts,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list-so'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
  });

  const { data: packingData } = useQuery({
    queryKey: ['packing-master-so'],
    queryFn: () => mastersApi.getPacking({ limit: 500 }),
  });

  // Fetch ALL enquiries for the selected sales person (to derive customer list & enquiry list)
  const { data: salesPersonEnquiriesData } = useQuery({
    queryKey: ['sp-enquiries-so', form.salesPersonId],
    queryFn: () => salesApi.getEnquiries({ limit: 200, createdBy: form.salesPersonId || undefined }),
    enabled: !!form.salesPersonId,
  });

  const { data: wonEnquiriesData } = useQuery({
    queryKey: ['won-enquiries-so', enquirySearch],
    queryFn: () => salesApi.getEnquiries({ limit: 50, status: 'won', search: enquirySearch || undefined }),
  });

  // ─── Mutation ───────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: any) => salesOrderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-stats'] });
      toast.success('Sales Order created successfully');
      router.push('/dashboard/sales/orders');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create Sales Order';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  // ─── Helpers ────────────────────────────────────────────────────

  const handleFieldChange = (field: keyof OrderForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: any) => {
    // Map sales person from customer if available
    const custSalesPerson = customer.salesPersonId
      ? salesPersons.find((u: any) => u.userId === customer.salesPersonId)
      : null;

    // Resolve port UUID to port name (customer stores UUID, form uses name)
    const resolvePortName = (portValue: string | undefined) => {
      if (!portValue) return '';
      // If it looks like a UUID, find the port name
      if (portValue.includes('-') && portValue.length > 30) {
        const port = ports.find((p: any) => p.portId === portValue || p.id === portValue);
        return port?.portName || port?.name || '';
      }
      return portValue; // Already a name
    };

    setForm((prev) => ({
      ...prev,
      customerId: customer.customerId,
      customerCode: customer.buyerCode || '',
      customerName: customer.customerName || '',
      contactPerson: customer.contactPerson || '',
      contactPhone: customer.contactNumber || customer.mobile || '',
      contactEmail: customer.email || '',
      // Billing address
      billingAddress: customer.billingAddress || '',
      billingCountry: customer.billingCountry || customer.country || '',
      billingState: customer.billingState || customer.state || '',
      billingStateCode: customer.billingStateCode || '',
      billingCity: customer.billingCity || customer.city || '',
      billingPincode: customer.billingPincode || customer.pinCode || '',
      billingGstin: customer.gstNumber || '',
      // Shipping / Delivery address
      shippingAddress: customer.deliveryAddress || customer.billingAddress || '',
      shippingCountry: customer.deliveryCountry || customer.billingCountry || customer.country || '',
      shippingState: customer.deliveryState || customer.billingState || customer.state || '',
      shippingCity: customer.deliveryCity || customer.billingCity || customer.city || '',
      shippingPincode: customer.deliveryPincode || customer.billingPincode || customer.pinCode || '',
      shippingGstin: customer.gstNumber || '',
      sameAsShipping: customer.isBillingSameAsDelivery ?? !customer.deliveryAddress,
      // Trade terms
      paymentTermsId: customer.paymentTermsId || prev.paymentTermsId,
      currencyId: customer.currencyId || prev.currencyId,
      portOfLoading: resolvePortName(customer.portOfLoading) || prev.portOfLoading,
      portOfDischarge: customer.pod || prev.portOfDischarge,
      isExport: customer.customerType === 'export' || prev.isExport,
      // Sales person from customer master
      salesPersonId: custSalesPerson?.userId || prev.salesPersonId,
      salesPersonName: custSalesPerson?.name || prev.salesPersonName,
    }));
    setShowCustomerSearch(false);
    setCustomerSearch('');
  };

  const mapProductToItem = (product: any, base?: OrderItem): OrderItem => ({
    ...EMPTY_ITEM,
    ...base,
    productId: product.productId,
    productCode: product.productCode || product.sku,
    productName: product.productName,
    sku: product.sku,
    hsnCode: product.hsnCode,
    categoryName: product.category?.categoryName || product.categoryName,
    brandName: product.brand?.brandName || product.brandName,
    unitSize: product.unitSize,
    uomName: product.uomName || product.uom?.uomName,
    unitsPerCase: product.unitsPerCase,
    cbmPerBox: product.cbmPerBox,
    mrp: product.mrp,
    gstRate: product.gstRate,
    packingType: product.packingType,
    purchasePersonId: product.purchasePersonId,
    purchasePersonName:
      product.purchasePersonName ||
      usersData?.data?.data?.find((u: any) => u.userId === product.purchasePersonId)?.name ||
      '',
    unitPrice: base?.unitPrice || product.mrp || 0,
    quantity: base?.quantity || 1,
    isManualEntry: false,
  });

  const handleAddSelectedProducts = () => {
    if (selectedProducts.length === 0) return;
    const updatedItems = [...form.items];
    let targetIndex = selectedItemIndex;

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
    setSelectedProducts([]);
    setSelectedItemIndex(null);
    setProductSearch('');
  };

  const handleAddManualProduct = (name: string) => {
    const item: OrderItem = {
      ...EMPTY_ITEM,
      productName: name,
      isManualEntry: true,
    };
    const updatedItems = [...form.items];
    const lastIdx = updatedItems.length - 1;
    if (lastIdx >= 0 && !updatedItems[lastIdx].sku && !updatedItems[lastIdx].productName) {
      updatedItems[lastIdx] = item;
    } else {
      updatedItems.push(item);
    }
    setForm((prev) => ({ ...prev, items: updatedItems }));
    setShowManualProduct(false);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: items.length ? items : [{ ...EMPTY_ITEM }] };
    });
  };

  const handleEnquirySelect = async (enquiry: any) => {
    try {
      const detail = await salesApi.getEnquiry(enquiry.enquiryOrderId || enquiry.enquiryId);
      const enq = detail.data;
      const enqId = enq.enquiryOrderId || enq.enquiryId;
      const enqNo = enq.enquiryOrderNo || enq.enquiryNumber || '';

      const newItems: OrderItem[] = (enq.items || []).map((ei: any) => ({
        productId: ei.productId,
        productCode: ei.sku,
        productName: ei.productName || ei.manualProductName || '',
        enquiryNo: enqNo,
        sku: ei.sku,
        categoryName: ei.categoryName,
        brandName: ei.brandName,
        unitSize: ei.unitSize,
        unitsPerCase: ei.unitPerCarton || ei.unitsPerCase,
        cbmPerBox: ei.cbmPerBox,
        quantity: ei.quantity || 1,
        unitPrice: ei.expectedRate || ei.mrp || 0,
        mrp: ei.mrp,
        gstRate: ei.gstPercent,
        purchasePersonId: ei.purchasePersonId,
        purchasePersonName: ei.purchasePersonName || '',
        description: ei.description || '',
        isManualEntry: ei.isManualEntry || false,
        itemSelected: false,
        status: '',
        remarks: '',
        shiftOrderNo: '',
      }));

      setForm((prev) => {
        const isFirstEnquiry = prev.enquiryIds.length === 0;
        const alreadyAdded = prev.enquiryIds.includes(enqId);
        if (alreadyAdded) {
          toast.error(`Enquiry ${enqNo} already added`);
          return prev;
        }
        const existingItems = prev.items.filter((i) => i.productName);
        const mergedItems = isFirstEnquiry ? newItems : [...existingItems, ...newItems];
        return {
          ...prev,
          enquiryIds: [...prev.enquiryIds, enqId],
          customerId: prev.customerId || enq.customerId || '',
          customerCode: prev.customerCode || enq.buyerCode || '',
          customerName: prev.customerName || enq.customer?.customerName || enq.buyerName || '',
          contactPerson: prev.contactPerson || enq.contactName || '',
          contactPhone: prev.contactPhone || enq.contactNumber || '',
          contactEmail: prev.contactEmail || enq.buyerEmail || '',
          billingAddress: prev.billingAddress || enq.billingAddress || '',
          billingCountry: prev.billingCountry || enq.country || '',
          billingState: prev.billingState || enq.state || '',
          billingCity: prev.billingCity || enq.city || '',
          shippingAddress: prev.shippingAddress || enq.deliveryAddress || '',
          paymentTermsId: prev.paymentTermsId || enq.paymentTermsId || '',
          currencyId: prev.currencyId || enq.currencyId || '',
          portOfLoading: prev.portOfLoading || enq.portOfLoading || '',
          portOfDischarge: prev.portOfDischarge || enq.pod || '',
          poNumber: prev.poNumber || enq.poNumber || '',
          poDate: prev.poDate || (enq.poDate ? new Date(enq.poDate).toISOString().slice(0, 10) : ''),
          isExport: prev.isExport || enq.isExportEnquiry || false,
          notes: prev.notes || enq.remarks || '',
          items: mergedItems.length ? mergedItems : [{ ...EMPTY_ITEM }],
        };
      });

      toast.success(`Added enquiry ${enqNo} (${newItems.length} items)`);
    } catch {
      toast.error('Failed to load enquiry details');
    }
  };

  // ─── Computed totals ─────────────────────────────────────────────

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalCbm = 0;
    let totalQty = 0;
    form.items.forEach((item) => {
      const qty = toNum(item.quantity);
      const price = toNum(item.unitPrice);
      subtotal += qty * price;
      totalQty += qty;
      const upc = toNum(item.unitsPerCase) || 1;
      const cartons = Math.ceil(qty / upc);
      totalCbm += cartons * toNum(item.cbmPerBox);
    });
    const discountAmt = subtotal * toNum(form.discountPercent) / 100;
    const afterDiscount = subtotal - discountAmt;
    const charges = toNum(form.freightAmount) + toNum(form.packingAmount) + toNum(form.insuranceAmount) + toNum(form.otherCharges);
    return {
      subtotal,
      discountAmt,
      afterDiscount,
      charges,
      grandTotal: afterDiscount + charges,
      totalCbm,
      totalQty,
      itemCount: form.items.filter((i) => i.productName).length,
    };
  }, [form.items, form.discountPercent, form.freightAmount, form.packingAmount, form.insuranceAmount, form.otherCharges]);

  // ─── Submit ──────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!form.customerName) {
      toast.error('Please select a customer');
      setActiveTab('buyer');
      return;
    }
    if (!form.billingAddress) {
      toast.error('Please enter a billing address');
      setActiveTab('buyer');
      return;
    }
    if (!form.items.some((i) => i.productName)) {
      toast.error('Please add at least one product');
      setActiveTab('products');
      return;
    }

    const payload: any = {
      orderDate: new Date(form.orderDate),
      customerId: form.customerId,
      customerName: form.customerName,
      customerCode: form.customerCode || undefined,
      contactPerson: form.contactPerson || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      billingAddress: form.billingAddress,
      billingCountry: form.billingCountry || undefined,
      billingState: form.billingState || undefined,
      billingStateCode: form.billingStateCode || undefined,
      billingCity: form.billingCity || undefined,
      billingPincode: form.billingPincode || undefined,
      billingGstin: form.billingGstin || undefined,
      shippingAddress: form.sameAsShipping ? form.billingAddress : (form.shippingAddress || form.billingAddress),
      shippingCountry: form.sameAsShipping ? form.billingCountry : (form.shippingCountry || undefined),
      shippingState: form.sameAsShipping ? form.billingState : (form.shippingState || undefined),
      shippingStateCode: form.sameAsShipping ? form.billingStateCode : (form.shippingStateCode || undefined),
      shippingCity: form.sameAsShipping ? form.billingCity : (form.shippingCity || undefined),
      shippingPincode: form.sameAsShipping ? form.billingPincode : (form.shippingPincode || undefined),
      shippingGstin: form.sameAsShipping ? form.billingGstin : (form.shippingGstin || undefined),
      salesPersonId: form.salesPersonId || undefined,
      paymentTermsId: form.paymentTermsId || undefined,
      currencyId: form.currencyId || undefined,
      exchangeRate: toNum(form.exchangeRate) || 1,
      isExport: form.isExport,
      portOfLoading: form.portOfLoading || undefined,
      portOfDischarge: form.portOfDischarge || undefined,
      piNumber: form.piNumber || undefined,
      containerSize: form.containerSize || undefined,
      cbmRequired: toNum(form.cbmRequired) || undefined,
      grossWeight: toNum(form.grossWeight) || undefined,
      netWeight: toNum(form.netWeight) || undefined,
      shipmentDetails: form.shipmentDetails || undefined,
      poNumber: form.poNumber || undefined,
      poDate: form.poDate ? new Date(form.poDate) : undefined,
      expectedDeliveryDate: form.expectedDeliveryDate ? new Date(form.expectedDeliveryDate) : undefined,
      discountPercent: toNum(form.discountPercent) || undefined,
      freightAmount: toNum(form.freightAmount) || undefined,
      packingAmount: toNum(form.packingAmount) || undefined,
      insuranceAmount: toNum(form.insuranceAmount) || undefined,
      otherCharges: toNum(form.otherCharges) || undefined,
      termsAndConditions: form.termsAndConditions || undefined,
      notes: form.notes || undefined,
      enquiryId: form.enquiryIds.length ? form.enquiryIds[0] : undefined,
      enquiryIds: form.enquiryIds.length ? form.enquiryIds : undefined,
      items: form.items
        .filter((i) => i.productName)
        .map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName,
          productCode: item.productCode || undefined,
          categoryName: item.categoryName || undefined,
          brandName: item.brandName || undefined,
          sku: item.sku || undefined,
          hsnCode: item.hsnCode || undefined,
          uomName: item.uomName || undefined,
          unitSize: item.unitSize || undefined,
          unitBasis: item.unitBasis || undefined,
          packingType: item.packingType || undefined,
          location: item.location || undefined,
          purchasePersonId: item.purchasePersonId || undefined,
          purchasePersonName: item.purchasePersonName || undefined,
          unitsPerCase: toNum(item.unitsPerCase) || undefined,
          quantity: toNum(item.quantity),
          unitPrice: toNum(item.unitPrice),
          mrp: toNum(item.mrp) || undefined,
          buyingBestLandingRate: toNum(item.buyingBestLandingRate) || undefined,
          landingCost: toNum(item.landingCost) || undefined,
          discountPercent: toNum(item.discountPercent) || undefined,
          discountAmount: toNum(item.discountAmount) || undefined,
          gstRate: toNum(item.gstRate) || undefined,
          cbmPerBox: toNum(item.cbmPerBox) || undefined,
          haulage: toNum(item.haulage) || undefined,
          shiftOrderNo: item.shiftOrderNo || undefined,
          description: item.description || undefined,
          enquiryNo: item.enquiryNo || undefined,
          remarks: item.remarks || undefined,
          currencyType: item.currencyType || undefined,
          itemSelected: item.itemSelected || false,
          itemStatus: item.status || undefined,
          importedBy: item.importedBy || undefined,
          poi: item.poi || undefined,
          nutrition: item.nutrition || undefined,
          ingredients: item.ingredients || undefined,
          barcode: item.barcode || undefined,
          batchNumber: item.batchNumber || undefined,
          shelfLifeMonths: toNum(item.shelfLifeMonths) || undefined,
          mfgDate: item.mfgDate || undefined,
          allergenAdvice: item.allergenAdvice || undefined,
          netWeight: item.netWeight || undefined,
        })),
    };

    createMutation.mutate(payload);
  };

  // ─── Render ──────────────────────────────────────────────────────

  const customers = customersData?.data?.data || [];
  const products = productsData?.data?.data || [];
  const paymentTerms = paymentTermsData?.data || [];
  const currencies = currenciesData?.data || [];
  const ports = portsData?.data || [];
  const allUsers = usersData?.data?.data || [];
  const users = allUsers; // all users for purchase person lookup
  const salesPersons = useMemo(() => {
    const filtered = allUsers.filter((u: any) => {
      const roleCode = u.role?.roleCode || u.roleCode || '';
      return ['SALES_USER', 'SALES_MANAGER'].includes(roleCode);
    });
    if (user?.userId && !filtered.some((u: any) => u.userId === user.userId)) {
      filtered.unshift({ userId: user.userId, name: user.name || '', userCode: '' } as any);
    }
    return filtered;
  }, [allUsers, user]);
  const packingOptions = packingData?.data?.data || [];
  const wonEnquiries = wonEnquiriesData?.data?.data || [];

  // Derive customers from selected sales person's enquiries
  const spEnquiries = salesPersonEnquiriesData?.data?.data || [];
  const spCustomerMap = useMemo(() => {
    const map = new Map<string, { customerId: string; buyerName: string; buyerCode: string; enquiries: any[] }>();
    spEnquiries.forEach((enq: any) => {
      const custKey = enq.customerId || enq.buyerCode || enq.buyerName;
      if (!custKey) return;
      if (!map.has(custKey)) {
        map.set(custKey, {
          customerId: enq.customerId || '',
          buyerName: enq.buyerName || enq.customer?.customerName || '',
          buyerCode: enq.buyerCode || '',
          enquiries: [],
        });
      }
      map.get(custKey)!.enquiries.push(enq);
    });
    return map;
  }, [spEnquiries]);
  const spCustomers = useMemo(() => Array.from(spCustomerMap.values()), [spCustomerMap]);

  // Enquiries for the selected customer (from the sales person's enquiries)
  const customerEnquiries = useMemo(() => {
    if (!form.customerId && !form.customerCode) return [];
    const custEntry = Array.from(spCustomerMap.values()).find(
      (c) => c.customerId === form.customerId || c.buyerCode === form.customerCode
    );
    return custEntry?.enquiries || [];
  }, [spCustomerMap, form.customerId, form.customerCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/sales/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sales Order</h1>
            <p className="text-gray-500">Create a new sales order{form.enquiryIds.length ? ` (from ${form.enquiryIds.length} enquir${form.enquiryIds.length > 1 ? 'ies' : 'y'})` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEnquiryPicker(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Load from Enquiry
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-500">Items</p>
            <p className="text-lg font-bold">{totals.itemCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-500">Total Qty</p>
            <p className="text-lg font-bold">{totals.totalQty.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-500">Total CBM</p>
            <p className="text-lg font-bold">{totals.totalCbm.toFixed(3)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-500">Subtotal</p>
            <p className="text-lg font-bold">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-500">Grand Total</p>
            <p className="text-lg font-bold text-emerald-700">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buyer" className="flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            Buyer & Shipping
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Buyer Details ──────────────────────────── */}
        <TabsContent value="buyer" className="space-y-4">
          {/* Sales Person & Order Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Sales Person & Order Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Sales Person</Label>
                  <Select
                    value={form.salesPersonId}
                    onValueChange={(v) => {
                      const sp = salesPersons.find((u: any) => u.userId === v);
                      setForm((prev) => ({
                        ...prev,
                        salesPersonId: v,
                        salesPersonName: sp?.name || '',
                        // Reset customer & enquiry when sales person changes
                        customerId: '',
                        customerName: '',
                        customerCode: '',
                        contactPerson: '',
                        contactPhone: '',
                        contactEmail: '',
                        billingAddress: '',
                        billingCountry: '',
                        billingState: '',
                        billingCity: '',
                        billingPincode: '',
                        billingGstin: '',
                        enquiryIds: [],
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select sales person" /></SelectTrigger>
                    <SelectContent>
                      {salesPersons.map((u: any) => (
                        <SelectItem key={u.userId} value={u.userId}>{u.name} ({u.userCode || 'N/A'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Order Date *</Label>
                  <Input
                    type="datetime-local"
                    value={form.orderDate}
                    onChange={(e) => handleFieldChange('orderDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={form.expectedDeliveryDate}
                    onChange={(e) => handleFieldChange('expectedDeliveryDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Linked Enquiries ({form.enquiryIds.length})</Label>
                  <Input
                    readOnly
                    value={form.enquiryIds.length ? `${form.enquiryIds.length} enquir${form.enquiryIds.length > 1 ? 'ies' : 'y'} linked` : 'None — click to add'}
                    className="bg-gray-50 cursor-pointer"
                    onClick={() => setShowEnquiryPicker(true)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Label>Party Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={form.customerName || 'Click to select customer'}
                      className="cursor-pointer bg-gray-50 flex-1"
                      onClick={() => setShowCustomerSearch(true)}
                    />
                    <Button variant="outline" onClick={() => setShowCustomerSearch(true)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Buyer Code</Label>
                  <Input value={form.customerCode} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input value={form.contactPerson} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={form.contactPhone} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.contactEmail} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={form.billingCountry} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.billingCity} readOnly className="bg-gray-50" />
                </div>
              </div>

              {/* Billing Address */}
              <div className="mt-4 space-y-3">
                <Label>Billing Address</Label>
                <Textarea value={form.billingAddress} readOnly className="bg-gray-50" rows={2} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>State</Label>
                    <Input value={form.billingState} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>State Code</Label>
                    <Input value={form.billingStateCode} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={form.billingPincode} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input value={form.billingGstin} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Label>Shipping Address</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.sameAsShipping}
                      onCheckedChange={(checked) => {
                        handleFieldChange('sameAsShipping', checked);
                        if (checked) {
                          setForm((prev) => ({
                            ...prev,
                            sameAsShipping: true,
                            shippingAddress: prev.billingAddress,
                            shippingCountry: prev.billingCountry,
                            shippingState: prev.billingState,
                            shippingStateCode: prev.billingStateCode,
                            shippingCity: prev.billingCity,
                            shippingPincode: prev.billingPincode,
                            shippingGstin: prev.billingGstin,
                          }));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-500">Same as billing</span>
                  </div>
                </div>
                {!form.sameAsShipping && (
                  <>
                    <Textarea value={form.shippingAddress} readOnly className="bg-gray-50" rows={2} />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>State</Label>
                        <Input value={form.shippingState} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <Label>State Code</Label>
                        <Input value={form.shippingStateCode} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <Label>Pincode</Label>
                        <Input value={form.shippingPincode} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <Label>GSTIN</Label>
                        <Input value={form.shippingGstin} readOnly className="bg-gray-50" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 md:col-span-3">
                  <Switch
                    checked={form.isExport}
                    onCheckedChange={(v) => handleFieldChange('isExport', v)}
                  />
                  <Label>Export Order</Label>
                </div>
                <div>
                  <Label>Port of Loading</Label>
                  <Select
                    value={form.portOfLoading}
                    onValueChange={(v) => handleFieldChange('portOfLoading', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select port" /></SelectTrigger>
                    <SelectContent>
                      {ports.map((p: any) => (
                        <SelectItem key={p.portId || p.portName} value={p.portName}>{p.portName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Port of Discharge (POD)</Label>
                  <Select
                    value={form.portOfDischarge}
                    onValueChange={(v) => handleFieldChange('portOfDischarge', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select port" /></SelectTrigger>
                    <SelectContent>
                      {ports.map((p: any) => (
                        <SelectItem key={p.portId || p.portName} value={p.portName}>{p.portName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PO Number</Label>
                  <Input
                    value={form.poNumber}
                    onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                    placeholder="Customer PO #"
                  />
                </div>
                <div>
                  <Label>PO Date</Label>
                  <Input
                    type="date"
                    value={form.poDate}
                    onChange={(e) => handleFieldChange('poDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>PI Number</Label>
                  <Input
                    value={form.piNumber}
                    onChange={(e) => handleFieldChange('piNumber', e.target.value)}
                    placeholder="Proforma Invoice #"
                  />
                </div>
                <div>
                  <Label>Container Size</Label>
                  <Select
                    value={form.containerSize}
                    onValueChange={(v) => {
                      const specs: Record<string, { cbm: number; grossWt: number }> = {
                        '20ft': { cbm: 28, grossWt: 21770 },
                        '40ft': { cbm: 58, grossWt: 26480 },
                        '40ft HC': { cbm: 64, grossWt: 26580 },
                      };
                      const s = specs[v] || { cbm: 0, grossWt: 0 };
                      setForm((prev) => ({ ...prev, containerSize: v, cbmRequired: s.cbm, grossWeight: s.grossWt }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select container" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft (28 CBM)</SelectItem>
                      <SelectItem value="40ft">40ft (58 CBM)</SelectItem>
                      <SelectItem value="40ft HC">40ft HC (64 CBM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CBM Required</Label>
                  <Input
                    type="number"
                    value={form.cbmRequired || ''}
                    onChange={(e) => handleFieldChange('cbmRequired', e.target.value)}
                    placeholder="Target CBM"
                  />
                </div>
                <div>
                  <Label>Gross Weight (kg)</Label>
                  <Input
                    type="number"
                    value={form.grossWeight || ''}
                    onChange={(e) => handleFieldChange('grossWeight', e.target.value)}
                    placeholder="Max Gross Weight"
                  />
                </div>
                <div>
                  <Label>Net Weight (kg)</Label>
                  <Input
                    type="number"
                    value={form.netWeight || ''}
                    onChange={(e) => handleFieldChange('netWeight', e.target.value)}
                    placeholder="Net Weight"
                    className="bg-yellow-50"
                  />
                </div>
                <div>
                  <Label>Re-Punch Count</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border bg-gray-50 text-red-600 font-bold">
                    {form.repunchCount || 0}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Label>Shipment Details</Label>
                <Textarea
                  value={form.shipmentDetails}
                  onChange={(e) => handleFieldChange('shipmentDetails', e.target.value)}
                  rows={2}
                  placeholder="Enter shipment details..."
                  className="bg-yellow-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment & Currency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Select
                    value={form.paymentTermsId}
                    onValueChange={(v) => handleFieldChange('paymentTermsId', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select payment terms" /></SelectTrigger>
                    <SelectContent>
                      {paymentTerms.map((pt: any) => (
                        <SelectItem key={pt.paymentTermId || pt.paymentTermsId} value={pt.paymentTermId || pt.paymentTermsId}>
                          {pt.termName || pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={form.currencyId}
                    onValueChange={(v) => handleFieldChange('currencyId', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c: any) => (
                        <SelectItem key={c.currencyId} value={c.currencyId}>
                          {c.currencyCode} — {c.currencyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={form.exchangeRate}
                    onChange={(e) => handleFieldChange('exchangeRate', parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.discountPercent}
                    onChange={(e) => handleFieldChange('discountPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Freight</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.freightAmount}
                    onChange={(e) => handleFieldChange('freightAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Packing</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.packingAmount}
                    onChange={(e) => handleFieldChange('packingAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Insurance</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.insuranceAmount}
                    onChange={(e) => handleFieldChange('insuranceAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Other Charges</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.otherCharges}
                    onChange={(e) => handleFieldChange('otherCharges', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setActiveTab('products')}>
              Next: Products <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ─── TAB 2: Products ───────────────────────────────── */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Line Items
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedItemIndex(null); setShowProductSearch(true); }}>
                    <Search className="h-4 w-4 mr-1" />
                    Search Products
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowManualProduct(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Manual Entry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Row
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    {/* Group header row */}
                    <tr>
                      <th className="border border-gray-300 bg-red-600 text-white text-center text-[10px] font-bold px-1 py-1" colSpan={9}>Product Details:</th>
                      <th className="border border-gray-300 bg-blue-600 text-white text-center text-[10px] font-bold px-1 py-1" colSpan={5}>Values</th>
                      <th className="border border-gray-300 bg-red-600 text-white text-center text-[10px] font-bold px-1 py-1" colSpan={17}>Packing and Designing Instructions</th>
                    </tr>
                    {/* Column header row */}
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[90px]">Product Code</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[150px]">Product Name</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Enquiry No</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Brand</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[120px]">Product Description</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Unit Size</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Unit Per Corton</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[70px]">Category</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[55px]">CBM</th>
                      {/* Values columns — yellow editable */}
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[65px]">Quantity</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[65px]">Total CBM</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Final Rate</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Total Value</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold min-w-[70px]">Currency Type</th>
                      {/* Packing & Designing columns — yellow editable */}
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Packing</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[100px]">Purchase Person Name</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Remarks</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[45px]">Item Selection</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Imported by</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Poi</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Nutrition</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Ingredients</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Barcode</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[70px]">Batch Number</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Shelf Life (in Month)</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Mfg</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Allergen Advice</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[60px]">Nt Wt</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[70px]">Status</th>
                      <th className="border border-gray-300 bg-yellow-100 px-1 py-1 text-[10px] font-semibold min-w-[80px]">Shift Order No</th>
                      <th className="border border-gray-300 px-1 py-1 text-[10px] font-semibold w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => {
                      const qty = toNum(item.quantity);
                      const rate = toNum(item.unitPrice);
                      const lineTotal = qty * rate;
                      const upc = toNum(item.unitsPerCase) || 1;
                      const cartons = Math.ceil(qty / upc);
                      const lineCbm = cartons * toNum(item.cbmPerBox);

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          {/* Product Details (read-only, white bg) */}
                          <td className="border border-gray-300 px-1 py-0.5">
                            <input
                              value={item.productCode || item.sku || ''}
                              readOnly={!item.isManualEntry}
                              className={`w-full h-7 text-xs border-0 outline-none px-1 ${!item.isManualEntry ? 'bg-transparent cursor-pointer' : ''}`}
                              onClick={() => { if (!item.productName) { setSelectedItemIndex(idx); setShowProductSearch(true); } }}
                              onChange={(e) => item.isManualEntry && handleItemChange(idx, 'productCode', e.target.value)}
                            />
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5">
                            <input
                              value={item.productName}
                              readOnly={!item.isManualEntry}
                              className={`w-full h-7 text-xs border-0 outline-none px-1 ${!item.isManualEntry ? 'bg-transparent cursor-pointer' : ''}`}
                              onClick={() => { if (!item.productName) { setSelectedItemIndex(idx); setShowProductSearch(true); } }}
                              onChange={(e) => item.isManualEntry && handleItemChange(idx, 'productName', e.target.value)}
                            />
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center">{item.enquiryNo || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px]">{item.brandName || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px]">{item.description || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center">{item.unitSize || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center">{item.unitsPerCase || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px]">{item.categoryName || ''}</td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center">{toNum(item.cbmPerBox).toFixed(4) || ''}</td>
                          {/* Values (yellow editable) */}
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <input
                              type="number" min="0"
                              value={item.quantity}
                              className="w-full h-7 text-xs border-0 outline-none px-1 bg-yellow-50 text-center font-medium"
                              onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center font-medium">
                            {lineCbm.toFixed(3)}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-right font-medium">
                            {toNum(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-right font-mono font-medium">
                            {lineTotal.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px] text-center">{item.currencyType || ''}</td>
                          {/* Packing and Designing Instructions (yellow editable) */}
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select
                              value={item.packingType || ''}
                              className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50"
                              onChange={(e) => handleItemChange(idx, 'packingType', e.target.value)}
                            >
                              <option value=""></option>
                              <option value="Pouch">Pouch</option>
                              <option value="Jar">Jar</option>
                              <option value="Pre-Printed-Pouch">Pre-Printed-Pouch</option>
                              <option value="Pre-Printed-Box">Pre-Printed-Box</option>
                              <option value="Box">Box</option>
                              <option value="Glass Bottle">Glass Bottle</option>
                              <option value="Tin Pack">Tin Pack</option>
                              <option value="Tray">Tray</option>
                              <option value="Printed Mono Carton">Printed Mono Carton</option>
                              <option value="Carton">Carton</option>
                              <option value="TUB">TUB</option>
                              <option value="PET">PET</option>
                              <option value="HDPE JAR">HDPE JAR</option>
                              <option value="Plastic Box">Plastic Box</option>
                              <option value="Others">Others</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px]">
                            {item.purchasePersonName || ''}
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <input
                              value={item.remarks || ''}
                              className="w-full h-7 text-xs border-0 outline-none px-1 bg-yellow-50"
                              onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                            />
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-1 py-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={item.itemSelected || false}
                              className="h-4 w-4 accent-yellow-500"
                              onChange={(e) => handleItemChange(idx, 'itemSelected', e.target.checked)}
                            />
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.importedBy || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'importedBy', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.poi || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'poi', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.nutrition || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'nutrition', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.ingredients || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'ingredients', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.barcode || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'barcode', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.batchNumber || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <input
                              type="number" min="0"
                              value={item.shelfLifeMonths || ''}
                              className="w-full h-7 text-xs border-0 outline-none px-1 bg-yellow-50 text-center"
                              onChange={(e) => handleItemChange(idx, 'shelfLifeMonths', parseInt(e.target.value) || undefined)}
                            />
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.mfgDate || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'mfgDate', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.allergenAdvice || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'allergenAdvice', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select value={item.netWeight || ''} className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50" onChange={(e) => handleItemChange(idx, 'netWeight', e.target.value)}>
                              <option value=""></option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 bg-yellow-50 px-0 py-0">
                            <select
                              value={item.status || ''}
                              className="w-full h-7 text-[10px] border-0 outline-none px-0.5 bg-yellow-50"
                              onChange={(e) => handleItemChange(idx, 'status', e.target.value)}
                            >
                              <option value=""></option>
                              <option value="Quantity">Quantity</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="New Items">New Items</option>
                              <option value="Shifts">Shifts</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-[10px]">
                            {item.shiftOrderNo || ''}
                          </td>
                          <td className="border border-gray-300 px-0 py-0 text-center">
                            <button
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded inline-flex items-center justify-center"
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* CBM tracking bar */}
              {form.containerSize && (
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-medium">Container: {form.containerSize}</span>
                  <span>CBM Used: <strong>{totals.totalCbm.toFixed(3)}</strong> / {toNum(form.cbmRequired) || (form.containerSize === '20ft' ? 28 : form.containerSize === '40ft' ? 58 : 64)} CBM</span>
                  <span className={totals.totalCbm > (toNum(form.cbmRequired) || 999) ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {totals.totalCbm > (toNum(form.cbmRequired) || 999) ? 'OVER CAPACITY' : 'OK'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('buyer')}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setActiveTab('summary')}>
              Next: Summary <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ─── TAB 4: Summary ────────────────────────────────── */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer:</span><span className="font-medium">{form.customerName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Buyer Code:</span><span>{form.customerCode || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Order Date:</span><span>{form.orderDate ? new Date(form.orderDate).toLocaleDateString() : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Export:</span><span>{form.isExport ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Port of Loading:</span><span>{form.portOfLoading || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Port of Discharge:</span><span>{form.portOfDischarge || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PO Number:</span><span>{form.poNumber || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PI Number:</span><span>{form.piNumber || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Container:</span><span>{form.containerSize || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CBM Required:</span><span>{form.cbmRequired || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gross Weight:</span><span>{form.grossWeight ? `${form.grossWeight} kg` : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Net Weight:</span><span>{form.netWeight ? `${form.netWeight} kg` : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Re-Punch Count:</span><span className="text-red-600 font-bold">{form.repunchCount || 0}</span></div>
                {form.shipmentDetails && (
                  <div className="flex justify-between"><span className="text-gray-500">Shipment Details:</span><span>{form.shipmentDetails}</span></div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Items:</span><span>{totals.itemCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Qty:</span><span>{totals.totalQty.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total CBM:</span><span>{totals.totalCbm.toFixed(3)}</span></div>
                <hr />
                <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                {totals.discountAmt > 0 && (
                  <div className="flex justify-between text-red-600"><span>Discount ({form.discountPercent}%):</span><span>-₹{totals.discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                )}
                {totals.charges > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Charges (Freight+Pack+Ins+Other):</span><span>₹{totals.charges.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-base"><span>Grand Total:</span><span className="text-emerald-700">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={form.termsAndConditions}
                  onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                  rows={4}
                  placeholder="Enter terms and conditions..."
                />
              </div>
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Internal notes..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('products')}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button size="lg" onClick={handleSubmit} disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Customer Search Dialog ──────────────────────────── */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              {form.salesPersonName
                ? `Showing customers with enquiries assigned to ${form.salesPersonName}`
                : 'Select a sales person first to see assigned customers'}
            </DialogDescription>
          </DialogHeader>

          {/* Show customers from sales person's enquiries */}
          {spCustomers.length > 0 ? (
            <>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Customers from Enquiries ({spCustomers.length})
              </p>
              <div className="space-y-1 max-h-[35vh] overflow-y-auto mb-4">
                {spCustomers
                  .filter((sc) =>
                    !customerSearch ||
                    sc.buyerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    sc.buyerCode.toLowerCase().includes(customerSearch.toLowerCase())
                  )
                  .map((sc) => {
                    // Find full customer data from master
                    const fullCustomer = customers.find(
                      (c: any) => c.customerId === sc.customerId || c.buyerCode === sc.buyerCode
                    );
                    return (
                      <div
                        key={sc.customerId || sc.buyerCode}
                        className="p-3 rounded border hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (fullCustomer) {
                            handleCustomerSelect(fullCustomer);
                          } else {
                            // Use enquiry data as fallback
                            const enq = sc.enquiries[0];
                            handleCustomerSelect({
                              customerId: sc.customerId,
                              buyerCode: sc.buyerCode,
                              customerName: sc.buyerName,
                              contactPerson: enq?.contactName || '',
                              contactNumber: enq?.contactNumber || '',
                              email: enq?.buyerEmail || '',
                              billingAddress: enq?.billingAddress || '',
                              billingCountry: enq?.billingCountry || enq?.country || '',
                              billingState: enq?.billingState || enq?.state || '',
                              billingCity: enq?.billingCity || enq?.city || '',
                              pod: enq?.pod || enq?.portOfDischarge || '',
                              portOfLoading: enq?.portOfLoading || '',
                              paymentTermsId: enq?.paymentTermsId || '',
                              currencyId: enq?.currencyId || '',
                              customerType: enq?.isExportEnquiry ? 'export' : '',
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sc.buyerName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{sc.enquiries.length} enquir{sc.enquiries.length === 1 ? 'y' : 'ies'}</Badge>
                            <Badge variant="secondary">{sc.buyerCode || 'N/A'}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : form.salesPersonId ? (
            <p className="text-center text-gray-400 py-4">No enquiries found for {form.salesPersonName}</p>
          ) : null}

          {/* Separator + all customers fallback */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-slate-500 mb-2">All Customers</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search all customers..."
                className="pl-10"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1 max-h-[25vh] overflow-y-auto">
              {customers.length ? customers.map((c: any) => (
                <div
                  key={c.customerId}
                  className="p-3 rounded border hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleCustomerSelect(c)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.customerName}</span>
                    <Badge variant="secondary">{c.buyerCode || 'N/A'}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {[c.city, c.state, c.country].filter(Boolean).join(', ')}
                    {c.contactPerson && ` • ${c.contactPerson}`}
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 py-4">No customers found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Product Search Dialog ───────────────────────────── */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
            <DialogDescription>Select one or more products to add</DialogDescription>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, brand..."
              className="pl-10"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-[45vh] overflow-y-auto">
            {products.length ? products.map((p: any) => {
              const isSelected = selectedProducts.some((sp) => sp.productId === p.productId);
              return (
                <div
                  key={p.productId}
                  className={`p-3 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setSelectedProducts((prev) =>
                      isSelected
                        ? prev.filter((sp) => sp.productId !== p.productId)
                        : [...prev, p]
                    );
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.productName}</span>
                        <Badge variant="outline" className="text-[10px]">{p.sku || '-'}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[p.brand?.brandName, p.category?.categoryName, p.unitSize].filter(Boolean).join(' • ')}
                        {p.cbmPerBox ? ` • CBM: ${p.cbmPerBox}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center text-gray-400 py-4">No products found</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductSearch(false); setSelectedProducts([]); setProductSearch(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSelectedProducts} disabled={!selectedProducts.length}>
              Add {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manual Product Dialog ───────────────────────────── */}
      <Dialog open={showManualProduct} onOpenChange={setShowManualProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Product Entry</DialogTitle>
            <DialogDescription>Add a product not in the master list</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = fd.get('productName') as string;
              if (name?.trim()) handleAddManualProduct(name.trim());
            }}
          >
            <div className="space-y-4 py-2">
              <div>
                <Label>Product Name *</Label>
                <Input name="productName" placeholder="Enter product name" required autoFocus />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowManualProduct(false)}>Cancel</Button>
              <Button type="submit">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Enquiry Picker Dialog ───────────────────────────── */}
      <Dialog open={showEnquiryPicker} onOpenChange={setShowEnquiryPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Enquiries</DialogTitle>
            <DialogDescription>
              Select one or more enquiries to add their items.
              {form.enquiryIds.length > 0 && (
                <span className="ml-1 font-medium text-blue-600">({form.enquiryIds.length} already added)</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Customer's enquiries from selected sales person */}
          {customerEnquiries.length > 0 ? (
            <>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Enquiries for {form.customerName} ({customerEnquiries.length})
              </p>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {customerEnquiries.map((enq: any) => {
                  const eid = enq.enquiryOrderId || enq.enquiryId;
                  const isAdded = form.enquiryIds.includes(eid);
                  return (
                    <div
                      key={eid}
                      className={`p-3 rounded border transition-colors ${isAdded ? 'bg-green-50 border-green-300 opacity-70' : 'hover:bg-blue-50 cursor-pointer'}`}
                      onClick={() => !isAdded && handleEnquirySelect(enq)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{enq.enquiryOrderNo || enq.enquiryNumber || '-'}</span>
                        {isAdded ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Added</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs capitalize">{enq.status || '-'}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {enq.buyerName || enq.customer?.customerName || '-'}
                        {enq.enquiryDate && ` • ${new Date(enq.enquiryDate).toLocaleDateString()}`}
                        {enq.items?.length && ` • ${enq.items.length} items`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : form.customerName ? (
            <p className="text-center text-gray-400 py-4">No enquiries found for {form.customerName}</p>
          ) : (
            <p className="text-center text-gray-400 py-4">Select a sales person and customer first</p>
          )}

          {/* Fallback: Won enquiries from all */}
          {wonEnquiries.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-slate-500 mb-2">All Won Enquiries</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search won enquiries..."
                  className="pl-10"
                  value={enquirySearch}
                  onChange={(e) => setEnquirySearch(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[25vh] overflow-y-auto">
                {wonEnquiries.map((enq: any) => {
                  const eid = enq.enquiryOrderId || enq.enquiryId;
                  const isAdded = form.enquiryIds.includes(eid);
                  return (
                    <div
                      key={eid}
                      className={`p-3 rounded border transition-colors ${isAdded ? 'bg-green-50 border-green-300 opacity-70' : 'hover:bg-blue-50 cursor-pointer'}`}
                      onClick={() => !isAdded && handleEnquirySelect(enq)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{enq.enquiryOrderNo || enq.enquiryNumber || '-'}</span>
                        {isAdded ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Added</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800">Won</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {enq.customer?.customerName || enq.customerName || '-'}
                        {enq.enquiryDate && ` • ${new Date(enq.enquiryDate).toLocaleDateString()}`}
                        {enq.itemCount && ` • ${enq.itemCount} items`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEnquiryPicker(false); setEnquirySearch(''); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
