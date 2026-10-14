'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, salesApi, mastersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Save,
  ArrowLeft,
  Search,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface QuoteItem {
  id?: string;
  enquiryItemId?: string;
  productId?: string;
  sku?: string;
  productName: string;
  productDescription?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  unitSize?: string;
  unitPerCarton?: number;
  cbmPerBox?: number;
  totalCbm?: number;
  quantity: number;
  buyingPrice: number; // Carton buying price / Landing Cost
  mrp?: number;
  gstPercent: number;
  remarks?: string;
  isNew?: boolean;
  isManualEntry?: boolean;
  manualProductName?: string;

  // Google Sheet fields
  purchasePersonName?: string;
  uom?: string; // Unit (Per Kg / Per Pcs)
  packingType?: string;
  location?: string; // Location
  bestLandingCost?: number;
  gstAmount?: number;
  perPcRateWithoutGst?: number;
  tax?: number;
  otherCost?: number;
  gstCost?: number;
  totalRateBox?: number;
  rateWithGstCost?: number;
  finalPriceInForeignCurrency?: number;
  ratePerCarton?: number;
  cbmCostPerBoxInSelectedCurrency?: number;
  haulage?: number;
  finalRate?: number;
}

interface QuoteForm {
  quoteDate: string;
  enquiryOrderId: string;
  enquiryOrderNo: string;
  currencyId: string;
  paymentTermsId: string;
  deliveryDate: string;
  validUntil: string;
  shippingTerms: string;
  notes: string;
  items: QuoteItem[];
}

const EMPTY_ITEM: QuoteItem = {
  productName: '',
  quantity: 0,
  unitPerCarton: 1,
  cbmPerBox: 0,
  totalCbm: 0,
  buyingPrice: 0,
  mrp: 0,
  gstPercent: 0,
  isNew: true,
  isManualEntry: false,
  purchasePersonName: '',
  uom: 'Per Pcs',
  packingType: '',
  location: 'Delhi',
  otherCost: 0,
  bestLandingCost: 0,
  remarks: '',
};

const EMPTY_QUOTE: QuoteForm = {
  quoteDate: new Date().toISOString().split('T')[0],
  enquiryOrderId: '',
  enquiryOrderNo: '',
  currencyId: '',
  paymentTermsId: '',
  deliveryDate: '',
  validUntil: '',
  shippingTerms: 'FOB',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  className = '',
  onCreate,
  onCreateLabel = 'Add',
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  onCreate?: (search: string) => void;
  onCreateLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 h-9"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-40 max-h-56 overflow-y-auto p-1.5 flex flex-col gap-1.5">
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 h-8"
            />
            <div className="overflow-y-auto max-h-36 space-y-0.5">
              {filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-slate-100 ${
                    opt.value === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </div>
              ))}
              {filteredOptions.length === 0 && !onCreate && (
                <div className="text-center text-slate-400 py-2 text-xs">No options found</div>
              )}
              {onCreate && search.trim() && (
                <div
                  onClick={() => {
                    onCreate(search.trim());
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-emerald-50 text-emerald-600 font-semibold border-t border-slate-100 flex items-center gap-1.5 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {onCreateLabel} "{search}"
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NewPurchaseQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramEnquiryId = searchParams.get('enquiryId');

  const queryClient = useQueryClient();
  const [showEnquirySearch, setShowEnquirySearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const [form, setForm] = useState<QuoteForm>(EMPTY_QUOTE);
  const [buyerDetails, setBuyerDetails] = useState({
    partyCode: '',
    partyName: '',
    country: '',
    city: '',
  });

  // Dialog and state for Adding Manual Product to Master
  const [showAddToMasterDialog, setShowAddToMasterDialog] = useState(false);
  const [selectedManualItem, setSelectedManualItem] = useState<any>(null);
  const [manualProductForm, setManualProductForm] = useState<any>({
    productName: '',
    sku: '',
    categoryId: '',
    brandId: '',
    unitSize: '',
    packingSize: '',
    unitsPerCase: '',
    cbmPerBox: '',
    buyingPrice: '',
    mrp: '',
    gstRateId: '',
    locationId: '',
  });

  // Quick Create State
  const [quickCreateState, setQuickCreateState] = useState<{
    type: 'category' | 'brand' | 'location' | 'gst' | null;
    initialValue: string;
    name: string;
    code: string;
    percent?: number;
  }>({ type: null, initialValue: '', name: '', code: '' });

  const handleTriggerQuickCreate = (type: 'category' | 'brand' | 'location' | 'gst', value: string) => {
    let code = '';
    if (type === 'category') {
      code = value.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    } else if (type === 'location') {
      code = 'LOC-' + value.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') + Math.floor(100 + Math.random() * 900);
    } else if (type === 'gst') {
      const parsedPercent = parseFloat(value.replace(/[^0-9.]/g, '')) || 18;
      code = 'GST' + parsedPercent;
      setQuickCreateState({
        type,
        initialValue: value,
        name: `GST ${parsedPercent}%`,
        code,
        percent: parsedPercent,
      });
      return;
    }

    setQuickCreateState({
      type,
      initialValue: value,
      name: value,
      code,
    });
  };

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (quickCreateState.type === 'category') {
        const res = await mastersApi.createCategory({
          categoryName: quickCreateState.name,
          categoryCode: quickCreateState.code.toUpperCase(),
        });
        toast.success('Category created successfully!');
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        setManualProductForm((prev: any) => ({ ...prev, categoryId: res.data.categoryId || res.data.id }));
      } else if (quickCreateState.type === 'brand') {
        const res = await mastersApi.createBrand({
          brandName: quickCreateState.name,
        });
        toast.success('Brand created successfully!');
        await queryClient.invalidateQueries({ queryKey: ['brands'] });
        setManualProductForm((prev: any) => ({ ...prev, brandId: res.data.brandId || res.data.id }));
      } else if (quickCreateState.type === 'location') {
        const res = await mastersApi.createLocation({
          name: quickCreateState.name,
          code: quickCreateState.code.toUpperCase(),
        });
        toast.success('Location created successfully!');
        await queryClient.invalidateQueries({ queryKey: ['locations'] });
        setManualProductForm((prev: any) => ({ ...prev, locationId: res.data.id || res.data.locationId }));
      } else if (quickCreateState.type === 'gst') {
        const res = await mastersApi.createGstRate({
          gstName: quickCreateState.name,
          gstCode: quickCreateState.code.toUpperCase(),
          gstPercent: Number(quickCreateState.percent || 0),
        });
        toast.success('GST Rate created successfully!');
        await queryClient.invalidateQueries({ queryKey: ['gst-rates'] });
        setManualProductForm((prev: any) => ({ ...prev, gstRateId: res.data.gstRateId || res.data.id }));
      }
      setQuickCreateState({ type: null, initialValue: '', name: '', code: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create resource');
    }
  };

  // Reference data queries
  const { data: enquiriesData } = useQuery({
    queryKey: ['enquiries-for-quote', enquirySearch],
    queryFn: () => salesApi.getEnquiries({ limit: 100, search: enquirySearch }),
    enabled: showEnquirySearch,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-for-quote', productSearch],
    queryFn: () => mastersApi.getProducts({ limit: 100, search: productSearch }),
    enabled: showProductSearch,
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: mastersApi.getCurrencies,
  });

  const { data: paymentTermsData } = useQuery({
    queryKey: ['paymentTerms'],
    queryFn: mastersApi.getPaymentTerms,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mastersApi.getCategories(),
    enabled: showAddToMasterDialog,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => mastersApi.getBrands(),
    enabled: showAddToMasterDialog,
  });

  const { data: gstRatesData } = useQuery({
    queryKey: ['gst-rates'],
    queryFn: () => mastersApi.getGstRates(),
    enabled: showAddToMasterDialog,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => mastersApi.getLocations(),
    enabled: showAddToMasterDialog,
  });

  // Exchange rates logic
  const selectedCurrencyCode = currenciesData?.data?.find((c: any) => (c.currencyId || c.id) === form.currencyId)?.currencyCode || 'USD';
  const currencyExchangeRates: Record<string, number> = {
    GBP: 125.75,
    USD: 93.50,
    CAD: 65.50,
    AUD: 58.75,
    EURO: 105.75,
    INR: 1.00,
  };
  const exchangeRate = currencyExchangeRates[selectedCurrencyCode] || 93.50;

  const calculateItems = (items: QuoteItem[], currentExchangeRate: number): QuoteItem[] => {
    return items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitsPerCase = Number(item.unitPerCarton || 1) || 1;
      const cbmPerBox = Number(item.cbmPerBox || 0);
      const gstPercent = Number(item.gstPercent || 0);
      const buyingPrice = Number(item.buyingPrice || 0);
      const freight = Number(item.cbmCostPerBoxInSelectedCurrency || 0);
      const otherCost = Number(item.otherCost || 0);
      const remark = item.remarks || '';
      const uom = item.uom || 'Per Pcs';
      const packingType = item.packingType || '';

      const gstCoef = gstPercent > 1 ? gstPercent / 100 : gstPercent;
      const gstAmount = buyingPrice * gstCoef;
      
      // Landing Cost = Buying Price + GST Amount + Freight
      const landingCost = buyingPrice + gstAmount + freight;
      
      // Total CBM = CBM * Quantity
      const totalCbm = cbmPerBox * quantity;

      return {
        ...item,
        quantity,
        unitPerCarton: unitsPerCase,
        cbmPerBox,
        gstPercent,
        buyingPrice,
        otherCost,
        remarks: remark,
        remark,
        uom,
        packingType,
        cbmCostPerBoxInSelectedCurrency: freight,
        gstAmount: gstAmount * quantity,
        gstCost: gstAmount,
        rateWithGstCost: landingCost,
        totalCbm,
      };
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseApi.createQuote(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-quotes'] });
      toast.success('Quote created successfully');
      router.push(`/dashboard/purchase/${response.data.quoteId || response.data.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create quote');
    },
  });

  const handleFieldChange = (field: keyof QuoteForm, value: any) => {
    if (field === 'currencyId') {
      const newCurrencyCode = currenciesData?.data?.find((c: any) => (c.currencyId || c.id) === value)?.currencyCode || 'USD';
      const newExchangeRate = currencyExchangeRates[newCurrencyCode] || 93.50;
      setForm((prev) => ({
        ...prev,
        currencyId: value,
        items: calculateItems(prev.items, newExchangeRate),
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEnquirySelect = async (enquiry: any) => {
    try {
      const targetId = enquiry.enquiryOrderId || enquiry.enquiryId;
      const res = await salesApi.getEnquiry(targetId);
      const enquiryDetails = res.data;

      // Fetch enquiry items separately (which handles purchase person filtering on the backend)
      const itemsRes = await salesApi.getEnquiryItems(targetId);
      const enquiryItems = itemsRes.data || [];

      setBuyerDetails({
        partyCode: enquiryDetails.buyerCode || enquiryDetails.customer?.customerCode || '',
        partyName: enquiryDetails.buyerName || enquiryDetails.customer?.customerName || '',
        country: enquiryDetails.country || enquiryDetails.customer?.country || '',
        city: enquiryDetails.city || enquiryDetails.customer?.city || '',
      });

      const mappedItems = enquiryItems.map((item: any) => ({
        enquiryItemId: item.itemId,
        productName: item.productName || item.product?.productName || '',
        productId: item.productId || item.masterProductId || undefined,
        sku: item.sku || item.product?.sku || '',
        categoryName: item.categoryName || item.category?.categoryName || 'NOT IN MASTER',
        brandName: item.brandName || item.brand?.brandName || 'NOT IN MASTER',
        unitSize: item.unitSize || item.product?.unitSize || '',
        unitPerCarton: item.unitPerCarton || item.product?.unitsPerCase || 1,
        cbmPerBox: item.cbmPerBox || item.product?.cbmPerBox || 0,
        quantity: item.quantity || 0,
        buyingPrice: item.buyingPrice || item.product?.buyingPrice || 0,
        mrp: item.mrp || item.product?.mrp || 0,
        gstPercent: parseFloat(item.gstPercent) || parseFloat(item.gstRate?.gstPercent) || 0,
        remarks: item.remarks || '',
        uom: item.uom || 'Per Pcs',
        packingType: item.packingType || '',
        location: 'Delhi',
        otherCost: 0,
        bestLandingCost: 0,
        isNew: false,
        isManualEntry: !item.productId && !item.masterProductId,
      }));

      setForm((prev) => ({
        ...prev,
        enquiryOrderId: targetId,
        enquiryOrderNo: enquiryDetails.enquiryOrderNo || enquiryDetails.enquiryNumber || '',
        items: calculateItems(mappedItems.length > 0 ? mappedItems : [{ ...EMPTY_ITEM }], exchangeRate),
      }));
    } catch (err) {
      console.error('Failed to fetch sales enquiry details:', err);
      toast.error('Failed to load Sales Enquiry items');
    }
    setShowEnquirySearch(false);
    setEnquirySearch('');
  };

  useEffect(() => {
    if (paramEnquiryId && !form.enquiryOrderId) {
      handleEnquirySelect({ enquiryOrderId: paramEnquiryId });
    }
  }, [paramEnquiryId]);

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    let updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value } as any;
    updatedItems = calculateItems(updatedItems, exchangeRate);
    setForm((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: calculateItems([...prev.items, { ...EMPTY_ITEM }], exchangeRate),
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const mapProductToItem = (product: any, baseItem?: any) => {
    return {
      ...EMPTY_ITEM,
      ...baseItem,
      productId: product.productId,
      sku: product.sku,
      productName: product.productName,
      productDescription: product.description,
      categoryName: product.category?.categoryName || 'NOT IN MASTER',
      brandName: product.brand?.brandName || 'NOT IN MASTER',
      unitSize: product.unitSize,
      unitPerCarton: product.unitsPerCase || 1,
      cbmPerBox: product.cbmPerBox || 0,
      buyingPrice: product.buyingPrice || 0,
      mrp: product.mrp || 0,
      gstPercent: parseFloat(product.gst) || 0,
      isNew: false,
      isManualEntry: false,
    };
  };

  const handleAddSelectedProducts = () => {
    if (selectedProducts.length === 0) return;

    let updatedItems = [...form.items];
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

    updatedItems = calculateItems(updatedItems, exchangeRate);
    setForm((prev) => ({ ...prev, items: updatedItems }));
    setShowProductSearch(false);
    setProductSearch('');
    setSelectedItemIndex(null);
    setSelectedProducts([]);
  };

  const handleManualProductConfirm = (manualData: any) => {
    if (selectedItemIndex === null) return;
    const item = form.items[selectedItemIndex];
    let updatedItems = [...form.items];
    updatedItems[selectedItemIndex] = {
      ...item,
      productId: undefined,
      sku: manualData.sku,
      productName: manualData.manualProductName,
      manualProductName: manualData.manualProductName,
      categoryName: manualData.categoryName,
      brandName: manualData.brandName,
      unitSize: manualData.unitSize,
      cbmPerBox: manualData.cbmPerBox,
      quantity: manualData.quantity,
      isManualEntry: true,
      isNew: true,
    };
    updatedItems = calculateItems(updatedItems, exchangeRate);
    setForm((prev) => ({ ...prev, items: updatedItems }));
    setShowManualProduct(false);
    setSelectedItemIndex(null);
  };

  const handleOpenAddToMaster = (item: any, index: number) => {
    setSelectedManualItem(item);
    setSelectedItemIndex(index);

    let matchedGstId = '';
    if (gstRatesData?.data && item.gstPercent !== undefined) {
      const matched = gstRatesData.data.find((g: any) => parseFloat(g.gstPercent) === parseFloat(item.gstPercent));
      if (matched) matchedGstId = matched.gstRateId;
    }

    setManualProductForm({
      productName: item.productName || '',
      sku: item.sku && item.sku !== 'NOT IN MASTER' ? item.sku : '',
      categoryId: '',
      brandId: '',
      unitSize: item.unitSize || '',
      packingSize: item.unitPerCarton || 0,
      unitsPerCase: item.unitPerCarton || 0,
      cbmPerBox: item.cbmPerBox || 0,
      buyingPrice: item.buyingPrice || 0,
      mrp: item.mrp || 0,
      gstRateId: matchedGstId,
      locationId: '',
    });
    setShowAddToMasterDialog(true);
  };

  const handleGenerateManualSku = async () => {
    try {
      const brand = brandsData?.data?.find((b: any) => b.brandId === manualProductForm.brandId)?.brandName || '';
      const location = locationsData?.data?.find((l: any) => l.id === manualProductForm.locationId)?.name || '';
      const category = categoriesData?.data?.find((c: any) => c.categoryId === manualProductForm.categoryId)?.categoryCode || '';

      if (manualProductForm.productName) {
        const res = await mastersApi.generateSku({
          brandName: brand,
          locationName: location,
          productName: manualProductForm.productName,
          unitSize: manualProductForm.unitSize,
          packingSize: manualProductForm.packingSize?.toString(),
          categoryCode: category
        });
        const sku = typeof res.data === 'string' ? res.data : (res.data?.sku || '');
        if (sku) {
          setManualProductForm((prev: any) => ({ ...prev, sku }));
          toast.success('SKU generated successfully!');
        } else {
          toast.error('Failed to parse generated SKU');
        }
      } else {
        toast.error('Product Description is required to generate SKU');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate SKU');
    }
  };

  // Auto-generate SKU for manual product catalog form when dependencies change
  useEffect(() => {
    const autoGen = async () => {
      const brand = brandsData?.data?.find((b: any) => b.brandId === manualProductForm.brandId)?.brandName || '';
      const location = locationsData?.data?.find((l: any) => l.id === manualProductForm.locationId)?.name || '';
      const category = categoriesData?.data?.find((c: any) => c.categoryId === manualProductForm.categoryId)?.categoryCode || '';

      if (
        manualProductForm.productName &&
        manualProductForm.brandId &&
        manualProductForm.locationId &&
        manualProductForm.categoryId &&
        manualProductForm.unitSize &&
        manualProductForm.unitsPerCase
      ) {
        try {
          const res = await mastersApi.generateSku({
            brandName: brand,
            locationName: location,
            productName: manualProductForm.productName,
            unitSize: manualProductForm.unitSize,
            packingSize: manualProductForm.unitsPerCase?.toString(),
            categoryCode: category,
          });
          const sku = typeof res.data === 'string' ? res.data : (res.data?.sku || '');
          if (sku) {
            setManualProductForm((prev: any) => ({ ...prev, sku }));
          }
        } catch (err) {
          console.error('Failed to auto-generate SKU in dialog', err);
        }
      }
    };

    if (showAddToMasterDialog) {
      const timer = setTimeout(autoGen, 500);
      return () => clearTimeout(timer);
    }
  }, [
    manualProductForm.productName,
    manualProductForm.brandId,
    manualProductForm.locationId,
    manualProductForm.categoryId,
    manualProductForm.unitSize,
    manualProductForm.unitsPerCase,
    showAddToMasterDialog,
    brandsData,
    locationsData,
    categoriesData,
  ]);

  const handleSaveToMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProductForm.sku) {
      toast.error('SKU is required');
      return;
    }
    if (!manualProductForm.productName) {
      toast.error('Product name is required');
      return;
    }

    const brandName = brandsData?.data?.find((b: any) => b.brandId === manualProductForm.brandId)?.brandName || '';
    const categoryName = categoriesData?.data?.find((c: any) => c.categoryId === manualProductForm.categoryId)?.categoryName || '';

    const payload = {
      productPayload: {
        productName: manualProductForm.productName,
        sku: manualProductForm.sku,
        productCode: manualProductForm.sku,
        categoryId: manualProductForm.categoryId || undefined,
        brandId: manualProductForm.brandId || undefined,
        unitSize: manualProductForm.unitSize || undefined,
        packingSize: manualProductForm.unitsPerCase?.toString() || "1",
        unitsPerCase: Number(manualProductForm.unitsPerCase || 0),
        cbmPerBox: Number(manualProductForm.cbmPerBox || 0),
        buyingPrice: Number(manualProductForm.buyingPrice || 0),
        mrp: Number(manualProductForm.mrp || 0),
        gstRateId: manualProductForm.gstRateId || undefined,
        locationId: manualProductForm.locationId || undefined,
        isActive: true,
      },
      categoryName,
      brandName,
      itemIndex: selectedItemIndex!,
    };

    addToMasterMutation.mutate(payload);
  };

  const addToMasterMutation = useMutation({
    mutationFn: async (payload: { productPayload: any; itemIndex: number; categoryName: string; brandName: string }) => {
      const productRes = await mastersApi.createProduct(payload.productPayload);
      return { newProduct: productRes.data, categoryName: payload.categoryName, brandName: payload.brandName };
    },
    onSuccess: ({ newProduct, categoryName, brandName }) => {
      if (selectedItemIndex !== null) {
        let updatedItems = [...form.items];
        updatedItems[selectedItemIndex] = {
          ...updatedItems[selectedItemIndex],
          productId: newProduct.productId,
          sku: newProduct.sku,
          productName: newProduct.productName,
          categoryName: newProduct.category?.categoryName || categoryName || 'NOT IN MASTER',
          brandName: newProduct.brand?.brandName || brandName || 'NOT IN MASTER',
          unitSize: newProduct.unitSize,
          unitPerCarton: newProduct.unitsPerCase || 1,
          cbmPerBox: newProduct.cbmPerBox || 0,
          buyingPrice: newProduct.buyingPrice || 0,
          mrp: newProduct.mrp || 0,
          gstPercent: parseFloat(newProduct.gst) || 0,
          isManualEntry: false,
          isNew: false,
        };
        updatedItems = calculateItems(updatedItems, exchangeRate);
        setForm((prev) => ({ ...prev, items: updatedItems }));
      }
      toast.success('Product added to Master and linked in quote creation!');
      setShowAddToMasterDialog(false);
      setSelectedManualItem(null);
      setSelectedItemIndex(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add product to Master');
    },
  });

  const handleSubmit = () => {
    if (!form.enquiryOrderId) {
      toast.error('Please select a Sales Enquiry');
      return;
    }

    if (form.items.length === 0 || !form.items.some(item => item.productName)) {
      toast.error('Please add at least one product');
      return;
    }

    const submitData = {
      quoteDate: new Date(form.quoteDate),
      enquiryOrderId: form.enquiryOrderId,
      enquiryOrderNo: form.enquiryOrderNo,
      salesEnquiryOrderNo: form.enquiryOrderNo,
      partyCode: buyerDetails.partyCode || undefined,
      partyName: buyerDetails.partyName || undefined,
      country: buyerDetails.country || undefined,
      city: buyerDetails.city || undefined,
      currencyId: form.currencyId || undefined,
      paymentTermsId: form.paymentTermsId || undefined,
      deliveryDate: form.deliveryDate ? new Date(form.deliveryDate) : undefined,
      validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
      shippingTerms: form.shippingTerms,
      notes: form.notes,
      remarks: form.notes,
      items: form.items
        .filter(item => item.productName)
        .map((item) => ({
          enquiryItemId: item.enquiryItemId || undefined,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          productDescription: item.productDescription || item.remarks || '',
          quantity: Number(item.quantity || 0),
          unitPerCarton: Number(item.unitPerCarton || 0),
          unitsPerCase: Number(item.unitPerCarton || 0),
          cbmPerBox: Number(item.cbmPerBox || 0),
          totalCbm: Number(item.totalCbm || 0),
          buyingPrice: Number(item.buyingPrice || 0),
          mrp: Number(item.mrp || 0),
          gstPercent: Number(item.gstPercent || 0),
          freight: Number(item.cbmCostPerBoxInSelectedCurrency || 0),
          location: item.location || 'Delhi',
          remark: item.remarks || '',
          remarks: item.remarks || '',
          otherCost: Number(item.otherCost || 0),
          gstCost: Number(item.gstCost || 0),
          landingCost: Number(item.rateWithGstCost || 0),
          landingCostDelhi: Number(item.rateWithGstCost || 0),
          ratePerCarton: Number(item.ratePerCarton || 0),
          finalPriceInForeignCurrency: Number(item.finalPriceInForeignCurrency || 0),
          bestLandingCost: Number(item.bestLandingCost || 0),
        })),
    };

    createMutation.mutate(submitData);
  };

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + (Number(item.buyingPrice || 0) * Number(item.quantity || 0)), 0);
    const totalGst = form.items.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0);
    const grandTotal = form.items.reduce((sum, item) => sum + (Number(item.rateWithGstCost || 0) * Number(item.quantity || 0)), 0);
    const totalCbmVal = form.items.reduce((sum, item) => sum + (Number(item.totalCbm || 0)), 0);
    return { subtotal, totalGst, grandTotal, totalCbmVal };
  }, [form.items]);

  const gridRowsPaddingCount = Math.max(0, 10 - form.items.length);

  // Mappings for searchable selects in the dialog
  const locationOptions = useMemo(() => {
    return locationsData?.data?.map((loc: any) => ({
      label: `${loc.code} - ${loc.name}`,
      value: loc.id,
    })) || [];
  }, [locationsData]);

  const categoryOptions = useMemo(() => {
    return categoriesData?.data?.map((cat: any) => ({
      label: `${cat.categoryName} (${cat.categoryCode})`,
      value: cat.categoryId,
    })) || [];
  }, [categoriesData]);

  const brandOptions = useMemo(() => {
    return brandsData?.data?.map((br: any) => ({
      label: br.brandName,
      value: br.brandId,
    })) || [];
  }, [brandsData]);

  const gstOptions = useMemo(() => {
    return gstRatesData?.data?.map((gst: any) => ({
      label: `${gst.gstCode} - ${gst.gstPercent}%`,
      value: gst.gstRateId,
    })) || [];
  }, [gstRatesData]);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-[1600px] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchase">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Purchase Quote</h1>
            <p className="text-xs text-slate-500">Specify details and quote terms to submit purchase rate quotes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/purchase')} className="h-9 text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save Purchase Quote'}
          </Button>
        </div>
      </div>

      {/* Main Metadata Form (Clean Standard UI) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Enquiry Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="py-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              Sales Enquiry Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Select Sales Enquiry *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEnquirySearch(true)}
                  className="w-full justify-between text-left border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-9"
                >
                  <span>{form.enquiryOrderNo ? `Selected: ${form.enquiryOrderNo}` : 'Click to Select Sales Enquiry...'}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Quote Date</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={form.quoteDate}
                  onChange={(e) => handleFieldChange('quoteDate', e.target.value)}
                />
              </div>
            </div>

            {/* Buyer Details Sub-panel */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Buyer Details:</div>
              <div className="grid grid-cols-3 gap-y-1.5 text-xs pt-1">
                <div>
                  <span className="text-slate-500 font-medium mr-2">Party Code:</span>
                  <span className="font-semibold text-slate-800">{buyerDetails.partyCode || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium mr-2">Country:</span>
                  <span className="font-semibold text-slate-800">{buyerDetails.country || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium mr-2">City:</span>
                  <span className="font-semibold text-slate-800">{buyerDetails.city || '-'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spreadsheet Workspace (Strictly Product Details Section Same-to-Same) */}
      <Card className="shadow-md border-slate-300">
        <CardHeader className="py-3 bg-blue-50/50 border-b border-slate-200">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-blue-600" />
              Product Details:
            </span>
            <div className="flex gap-4 font-mono font-bold text-slate-600 normal-case">
              <span>Total CBM: {totals.totalCbmVal.toFixed(4)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[1300px]">
            <table className="w-full border-collapse text-xs select-none">
              <thead>
                {/* Column alphabetic tags (A, B, C, D...) */}
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-400 font-medium text-center text-[10px]">
                  <th className="w-10 border-r border-slate-300 bg-slate-200 py-0.5"></th>
                  <th className="w-[180px] border-r border-slate-300 py-0.5">A</th>
                  <th className="w-[150px] border-r border-slate-300 py-0.5">B</th>
                  <th className="w-[260px] border-r border-slate-300 py-0.5">C</th>
                  <th className="w-[110px] border-r border-slate-300 py-0.5">D</th>
                  <th className="w-[110px] border-r border-slate-300 py-0.5">E</th>
                  <th className="w-[100px] border-r border-slate-300 py-0.5">F</th>
                  <th className="w-[90px] border-r border-slate-300 py-0.5">G</th>
                  <th className="w-[100px] border-r border-slate-300 py-0.5">H</th>
                  <th className="w-[100px] border-r border-slate-300 py-0.5">I</th>
                  <th className="w-[80px] border-r border-slate-300 py-0.5">J</th>
                  <th className="w-[100px] border-r border-slate-300 py-0.5">K</th>
                  <th className="w-[120px] border-r border-slate-300 py-0.5">L</th>
                  <th className="w-[160px] border-r border-slate-300 py-0.5">M</th>
                  <th className="w-[130px] border-r border-slate-300 py-0.5">N</th>
                  <th className="w-[110px] text-center text-slate-500 py-0.5">Catalog / Action</th>
                </tr>
                
                {/* Spreadsheet Headers */}
                <tr className="border-b border-slate-300 bg-[#1e293b] text-white font-semibold text-[11px] text-center">
                  <td className="border-r border-slate-300 bg-slate-100 text-slate-500 text-center font-medium py-1.5">11</td>
                  <td className="border-r border-slate-600 px-1 py-1">Product Code</td>
                  <td className="border-r border-slate-600 px-1 py-1">Category</td>
                  <td className="border-r border-slate-600 px-1 py-1">Product Description</td>
                  <td className="border-r border-slate-600 px-1 py-1">Unit Size</td>
                  <td className="border-r border-slate-600 px-1 py-1">Unit Per Carton</td>
                  <td className="border-r border-slate-600 px-1 py-1">CBM</td>
                  <td className="border-r border-slate-600 px-1 py-1">Quantity</td>
                  <td className="border-r border-slate-600 px-1 py-1">MRP</td>
                  <td className="border-r border-slate-600 px-1 py-1">Buying Price</td>
                  <td className="border-r border-slate-600 px-1 py-1">Gst%</td>
                  <td className="border-r border-slate-600 bg-yellow-400 text-slate-900 font-bold px-1 py-1">Freight</td>
                  <td className="border-r border-slate-600 bg-yellow-400 text-slate-900 font-bold px-1 py-1">Landing Cost</td>
                  <td className="border-r border-slate-600 bg-yellow-400 text-slate-900 font-bold px-1 py-1">Remark</td>
                  <td className="border-r border-slate-300 bg-yellow-400 text-slate-900 font-bold px-1 py-1">Unit (Per Kg / Per Pcs)</td>
                  <td className="bg-slate-800 text-white">Catalog / Action</td>
                </tr>
              </thead>

              <tbody>
                {form.items.map((item, index) => {
                  const isMasterProduct = Boolean(item.productId) || Boolean(!item.isManualEntry && item.sku && item.sku !== 'NOT IN MASTER');
                  const rowNum = 12 + index;
                  return (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="border-r border-slate-300 bg-slate-100 text-slate-500 text-center font-medium py-1.5">{rowNum}</td>
                      
                      {/* A: Product Code (Editable + Search Icon) */}
                      <td className="border-r border-slate-200 p-0.5">
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs font-mono ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                            value={item.sku || ''}
                            onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                            disabled={isMasterProduct}
                            placeholder="Product Code"
                          />
                          {!isMasterProduct && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 rounded-sm"
                              onClick={() => {
                                setSelectedItemIndex(index);
                                setShowProductSearch(true);
                              }}
                            >
                              <Search className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* B: Category */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="text"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.categoryName || ''}
                          onChange={(e) => handleItemChange(index, 'categoryName', e.target.value)}
                          disabled={isMasterProduct}
                          placeholder="Category"
                        />
                      </td>

                      {/* C: Product Description */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="text"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.productName || ''}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          disabled={isMasterProduct}
                          placeholder="Product Description"
                        />
                      </td>

                      {/* D: Unit Size */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="text"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.unitSize || ''}
                          onChange={(e) => handleItemChange(index, 'unitSize', e.target.value)}
                          disabled={isMasterProduct}
                          placeholder="Unit Size"
                        />
                      </td>

                      {/* E: Unit Per Carton */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.unitPerCarton || ''}
                          onChange={(e) => handleItemChange(index, 'unitPerCarton', e.target.value ? parseInt(e.target.value) : 1)}
                          disabled={isMasterProduct}
                          placeholder="1"
                        />
                      </td>

                      {/* F: CBM */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          step="0.0001"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.cbmPerBox || ''}
                          onChange={(e) => handleItemChange(index, 'cbmPerBox', e.target.value ? parseFloat(e.target.value) : 0)}
                          disabled={isMasterProduct}
                          placeholder="0.0000"
                        />
                      </td>

                      {/* G: Quantity */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono font-semibold"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value ? parseInt(e.target.value) : 0)}
                          placeholder="0"
                        />
                      </td>

                      {/* H: MRP */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.mrp || ''}
                          onChange={(e) => handleItemChange(index, 'mrp', e.target.value ? parseFloat(e.target.value) : 0)}
                          disabled={isMasterProduct}
                          placeholder="0.00"
                        />
                      </td>

                      {/* I: Buying Price */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono"
                          value={item.buyingPrice || ''}
                          onChange={(e) => handleItemChange(index, 'buyingPrice', e.target.value ? parseFloat(e.target.value) : 0)}
                          placeholder="0.00"
                        />
                      </td>

                      {/* J: Gst% */}
                      <td className="border-r border-slate-200 p-0.5">
                        <input
                          type="number"
                          className={`w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono ${isMasterProduct ? 'text-slate-500 cursor-not-allowed' : ''}`}
                          value={item.gstPercent || ''}
                          onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value ? parseFloat(e.target.value) : 0)}
                          disabled={isMasterProduct}
                          placeholder="0.0"
                        />
                      </td>

                      {/* K: Freight (Yellow - Editable Input) */}
                      <td className="border-r border-slate-200 bg-yellow-50/70 p-0.5">
                        <input
                          type="number"
                          step="0.0001"
                          className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono font-semibold text-slate-700"
                          value={item.cbmCostPerBoxInSelectedCurrency || ''}
                          onChange={(e) => handleItemChange(index, 'cbmCostPerBoxInSelectedCurrency', e.target.value ? parseFloat(e.target.value) : 0)}
                          placeholder="0.0000"
                        />
                      </td>

                      {/* L: Landing Cost (Yellow - Editable Input) */}
                      <td className="border-r border-slate-200 bg-yellow-50/70 p-0.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-mono font-bold text-slate-900"
                          value={item.rateWithGstCost || ''}
                          onChange={(e) => handleItemChange(index, 'rateWithGstCost', e.target.value ? parseFloat(e.target.value) : 0)}
                          placeholder="0.00"
                        />
                      </td>

                      {/* M: Remark (Yellow) */}
                      <td className="border-r border-slate-200 bg-yellow-50/40 p-0.5">
                        <input
                          type="text"
                          className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs"
                          value={item.remarks || ''}
                          onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                          placeholder="Remark"
                        />
                      </td>

                      {/* N: Unit (Per Kg / Per Pcs) (Yellow) */}
                      <td className="border-r border-slate-200 bg-yellow-50/40 p-0.5 text-center">
                        <select
                          className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 outline-none text-[11px] cursor-pointer"
                          title="UOM"
                          value={item.uom || 'Per Pcs'}
                          onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                        >
                          <option value="Per Pcs">Per Pcs</option>
                          <option value="Per Kg">Per Kg</option>
                        </select>
                      </td>

                      {/* Action & Catalog linking */}
                      <td className="text-center p-0.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {((!item.productId || item.sku === 'NOT IN MASTER' || item.sku?.startsWith('TEMP-') || item.categoryName === 'NOT IN MASTER' || item.isManualEntry) && item.productName) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              className="h-6 text-[9px] text-green-700 border-green-300 bg-green-50/50 hover:bg-green-50 px-1 py-0"
                              onClick={() => handleOpenAddToMaster(item, index)}
                              title="Add product manually to Master catalog"
                            >
                              + Master
                            </Button>
                          ) : item.productId ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[9px] px-1 py-0 font-normal">
                              Mastered
                            </Badge>
                          ) : null}
                          
                          {!form.enquiryOrderId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                              onClick={() => removeItem(index)}
                              disabled={form.items.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Grid padding to look like Google Sheets */}
                {Array.from({ length: gridRowsPaddingCount }).map((_, i) => {
                  const rowNum = 12 + form.items.length + i;
                  return (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="border-r border-slate-300 bg-slate-100 text-slate-500 text-center font-medium py-1.5">{rowNum}</td>
                      {Array.from({ length: 14 }).map((_, colIdx) => (
                        <td 
                          key={colIdx} 
                          className={`border-r border-slate-200 ${colIdx >= 10 && colIdx <= 13 ? 'bg-yellow-50/10' : 'bg-white'}`}
                        ></td>
                      ))}
                      <td></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Helper Bar */}
      <div className="flex justify-end items-center bg-white border border-slate-200 rounded-md p-3 shadow-sm">
        <span className="text-xs text-slate-400 italic font-medium">
          💡 Fill in Freight, Landing Cost, and Remarks for assigned items. Click "+ Master" to save manual products directly.
        </span>
      </div>

      {/* Enquiry Search Dialog */}
      <Dialog open={showEnquirySearch} onOpenChange={setShowEnquirySearch}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Select Enquiry Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by enquiry number..."
                className="pl-10 text-xs h-9"
                autoFocus
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {enquiriesData?.data?.data?.map((enquiry: any) => (
                <div
                  key={enquiry.enquiryOrderId || enquiry.enquiryId}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => handleEnquirySelect(enquiry)}
                >
                  <div>
                    <div className="font-mono font-medium text-slate-900 text-xs">{enquiry.enquiryNumber || enquiry.enquiryOrderNo}</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      {enquiry.customer?.customerName || enquiry.customerName} | {enquiry.itemCount || 0} items
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">{enquiry.status}</Badge>
                </div>
              ))}
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
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="flex flex-row items-center justify-between pr-4">
            <DialogTitle>Search Product</DialogTitle>
            {selectedProducts.length > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-medium text-xs">
                {selectedProducts.length} Selected
              </Badge>
            )}
          </DialogHeader>
          <div className="space-y-4 font-sans">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-10 text-xs h-9"
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
                    id="select-all-products-purchase"
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
                  <label htmlFor="select-all-products-purchase" className="cursor-pointer text-xs font-semibold text-slate-700 select-none">
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
                    className={`p-3 border rounded-lg hover:bg-emerald-50 cursor-pointer flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white'
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
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-medium text-slate-850 text-xs">{product.sku}</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">{product.productName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {product.category?.categoryName}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {(!productsData?.data?.data || productsData.data.data.length === 0) && (
                <div className="text-center text-gray-500 py-4 text-xs">No products found in masters</div>
              )}
            </div>

            <div className="border-t pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  className="border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs h-9"
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
                    className="h-9 text-xs"
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
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
      <Dialog open={showManualProduct} onOpenChange={setShowManualProduct}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-5 w-5 text-emerald-500" />
              Product Not in Masters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>This product will be flagged as NOT IN MASTER. Purchase team will review it.</span>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Product Name *</label>
              <Input
                id="manualProductName"
                placeholder="e.g. Custom Cardboard Box"
                autoFocus
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Remarks (optional)</label>
              <Input
                id="manualRemarks"
                placeholder="Any additional details..."
                className="text-xs h-9"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 text-xs font-sans">
            <Button variant="outline" size="sm" onClick={() => setShowManualProduct(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                const name = (document.getElementById('manualProductName') as HTMLInputElement)?.value?.trim();
                if (!name) {
                  toast.error('Product name is required');
                  return;
                }
                handleManualProductConfirm({
                  manualProductName: name,
                  sku: `NOT IN MASTER`,
                  categoryName: `NOT IN MASTER`,
                  brandName: `NOT IN MASTER`,
                  unitSize: `NOT IN MASTER`,
                  cbmPerBox: 0,
                  quantity: 1,
                  remarks: (document.getElementById('manualRemarks') as HTMLInputElement)?.value,
                });
              }}
            >
              Add as NOT IN MASTER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product to Master Dialog */}
      <Dialog open={showAddToMasterDialog} onOpenChange={setShowAddToMasterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white font-sans text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-5 w-5 text-emerald-600" />
              Add Product to Master Catalog
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveToMaster} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              💡 Complete this form to add the manually entered item into the master product catalog. It will automatically update and link this purchase quote item's product reference.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    value={manualProductForm.sku}
                    onChange={e => setManualProductForm((prev: any) => ({ ...prev, sku: e.target.value }))}
                    placeholder="Enter or generate SKU"
                    required
                    className="text-xs h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateManualSku}
                    disabled={
                      !manualProductForm.productName ||
                      !manualProductForm.brandId ||
                      !manualProductForm.locationId ||
                      !manualProductForm.categoryId ||
                      !manualProductForm.unitSize ||
                      !manualProductForm.unitsPerCase
                    }
                    className="h-9"
                  >
                    Generate
                  </Button>
                </div>
                           <div>
                <Label className="text-slate-700 font-medium">Location</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={manualProductForm.locationId}
                  onChange={(val) => setManualProductForm((prev: any) => ({ ...prev, locationId: val }))}
                  placeholder="Select location"
                  onCreate={(val) => handleTriggerQuickCreate('location', val)}
                  onCreateLabel="Add Location"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-slate-700 font-medium">Product Description (Product Name) *</Label>
                <Input
                  value={manualProductForm.productName}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter product description"
                  required
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Category</Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={manualProductForm.categoryId}
                  onChange={(val) => setManualProductForm((prev: any) => ({ ...prev, categoryId: val }))}
                  placeholder="Select category"
                  onCreate={(val) => handleTriggerQuickCreate('category', val)}
                  onCreateLabel="Add Category"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Brand</Label>
                <SearchableSelect
                  options={brandOptions}
                  value={manualProductForm.brandId}
                  onChange={(val) => setManualProductForm((prev: any) => ({ ...prev, brandId: val }))}
                  placeholder="Select brand"
                  onCreate={(val) => handleTriggerQuickCreate('brand', val)}
                  onCreateLabel="Add Brand"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Unit Size</Label>
                <Input
                  value={manualProductForm.unitSize}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, unitSize: e.target.value }))}
                  placeholder="e.g. 1KG, 500ML"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Units Per Case</Label>
                <Input
                  type="number"
                  value={manualProductForm.unitsPerCase}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, unitsPerCase: e.target.value, packingSize: e.target.value }))}
                  placeholder="e.g. 10"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">CBM</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={manualProductForm.cbmPerBox}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, cbmPerBox: e.target.value }))}
                  placeholder="0.0000"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">GST Rate</Label>
                <SearchableSelect
                  options={gstOptions}
                  value={manualProductForm.gstRateId}
                  onChange={(val) => setManualProductForm((prev: any) => ({ ...prev, gstRateId: val }))}
                  placeholder="Select GST Rate"
                  onCreate={(val) => handleTriggerQuickCreate('gst', val)}
                  onCreateLabel="Add GST Rate"
                />
              </div>    </div>

              <div>
                <Label className="text-slate-700 font-medium">Buying Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualProductForm.buyingPrice}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, buyingPrice: e.target.value }))}
                  placeholder="0.00"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">MRP</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualProductForm.mrp}
                  onChange={e => setManualProductForm((prev: any) => ({ ...prev, mrp: e.target.value }))}
                  placeholder="0.00"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddToMasterDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-9 px-4"
                disabled={addToMasterMutation.isPending}
              >
                {addToMasterMutation.isPending ? 'Saving...' : 'Add & Link Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialog for references */}
      <Dialog open={quickCreateState.type !== null} onOpenChange={(open) => !open && setQuickCreateState({ type: null, initialValue: '', name: '', code: '' })}>
        <DialogContent className="max-w-md bg-white font-sans text-xs">
          <DialogHeader>
            <DialogTitle className="capitalize text-sm font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Create New {quickCreateState.type === 'gst' ? 'GST Rate' : quickCreateState.type}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-slate-600 font-medium capitalize">
                  {quickCreateState.type === 'gst' ? 'GST Name' : `${quickCreateState.type} Name`} *
                </Label>
                <Input
                  required
                  value={quickCreateState.name}
                  onChange={(e) => setQuickCreateState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter ${quickCreateState.type} name`}
                  className="text-xs h-9 mt-1"
                />
              </div>

              {(quickCreateState.type === 'category' || quickCreateState.type === 'location' || quickCreateState.type === 'gst') && (
                <div>
                  <Label className="text-slate-600 font-medium">Code *</Label>
                  <Input
                    required
                    value={quickCreateState.code}
                    onChange={(e) => setQuickCreateState(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter code"
                    className="text-xs h-9 mt-1 font-mono uppercase"
                  />
                </div>
              )}

              {quickCreateState.type === 'gst' && (
                <div>
                  <Label className="text-slate-600 font-medium">GST Percent *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={quickCreateState.percent}
                    onChange={(e) => setQuickCreateState(prev => ({ ...prev, percent: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 18"
                    className="text-xs h-9 mt-1 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickCreateState({ type: null, initialValue: '', name: '', code: '' })}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4">
                Create & Select
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewPurchaseQuotePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading form...</div>}>
      <NewPurchaseQuoteContent />
    </Suspense>
  );
}
