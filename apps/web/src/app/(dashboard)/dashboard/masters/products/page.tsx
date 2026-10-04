'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi, salesApi } from '@/lib/api';
import { Plus, Search, Pencil, Trash2, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LineItemsEditor, LineItem } from '@/components/line-items/line-items-editor';
import { FileUpload, ImageGallery, UploadedFile } from '@/components/file-upload/file-upload';
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

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [quickAddType, setQuickAddType] = useState<'category' | 'brand' | 'location' | null>(null);
  const [quickAddFields, setQuickAddFields] = useState<any>({});

  // Form state - COMPLETE with all backend fields
  const [formData, setFormData] = useState<any>({
    // Basic Info
    productName: '',
    productCode: '',
    sku: '',
    description: '',
    productType: '',
    categoryId: '',
    segmentId: '',
    groupId: '',
    brandId: '',
    uomId: '',
    gstRateId: '',

    // Physical Properties
    weight: '',
    cbmPerBox: '',
    unitsPerCase: '',
    totalCbm: '',
    dimensions: '',
    barcode: '',
    hsCode: '',
    unitBasis: '',
    packingSize: '',

    // Pricing
    mrp: '',
    standardCost: '',
    buyingPrice: '',
    landingCost: '',
    lastPurchaseRate: '',

    // Stock Classification
    stockStatus: '',
    currentStock: '',
    reorderLevel: '',
    maxStockLevel: '',
    safetyStock: '',
    minOrderQty: '',
    maxOrderQty: '',
    slowMovingDays: '',
    deadStockDays: '',
    damagedQty: '',

    // Additional Fields
    locationId: '',
    leadTimeDays: '',
    materialType: '',
    countryOfOrigin: '',
    hsnCode: '',
    conversionRatio: '',

    // Google Sheet Fields
    unitSize: '',
    caseNo: '',
    aliasName: '',
    purchasePersonId: '',

    // Status
    isActive: true,
    isDiscontinued: false,
  });

  // Images and Documents
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search }],
    queryFn: () => mastersApi.getProducts({ page, limit: 20, search }),
  });

  // Fetch lookups
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mastersApi.getCategories(),
  });

  const { data: segmentsData } = useQuery({
    queryKey: ['segments'],
    queryFn: () => mastersApi.getSegments(),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => mastersApi.getGroups(),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => mastersApi.getBrands(),
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms'],
    queryFn: () => mastersApi.getUoms(),
  });

  const { data: gstRatesData } = useQuery({
    queryKey: ['gst-rates'],
    queryFn: () => mastersApi.getGstRates(),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => mastersApi.getLocations(),
  });

  const { data: purchaseUsersData } = useQuery({
    queryKey: ['purchase-users-lookup'],
    queryFn: () => salesApi.getPurchaseUsers(),
  });

  // Auto-generate SKU when form dependencies change (for new products)
  useEffect(() => {
    const autoGenerateSku = async () => {
      try {
        const brand = brandsData?.data?.find((b: any) => b.brandId === formData.brandId)?.brandName || '';
        const location = locationsData?.data?.find((l: any) => l.id === formData.locationId)?.name || '';
        const category = categoriesData?.data?.find((c: any) => c.categoryId === formData.categoryId)?.categoryCode || '';

        if (formData.productName) {
          const res = await mastersApi.generateSku({
            brandName: brand,
            locationName: location,
            productName: formData.productName,
            unitSize: formData.unitSize,
            packingSize: formData.packingSize?.toString(),
            categoryCode: category
          });
          const sku = typeof res?.data === 'string' ? res.data : res?.data?.sku;
          if (sku) {
            handleInputChange('sku', sku);
          }
        }
      } catch (err) {
        console.error('Failed to auto-generate SKU', err);
      }
    };

    if (formData.productName && !editingProduct) {
      const timer = setTimeout(autoGenerateSku, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.brandId, formData.locationId, formData.productName, formData.unitSize, formData.packingSize, editingProduct, brandsData, locationsData, categoriesData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => mastersApi.createProduct(data),
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mastersApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mastersApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const products = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  const resetForm = () => {
    setFormData({
      productName: '',
      productCode: '',
      sku: '',
      description: '',
      productType: '',
      categoryId: '',
      segmentId: '',
      groupId: '',
      brandId: '',
      uomId: '',
      gstRateId: '',
      weight: '',
      cbmPerBox: '',
      unitsPerCase: '',
      totalCbm: '',
      dimensions: '',
      barcode: '',
      hsCode: '',
      unitBasis: '',
      packingSize: '',
      mrp: '',
      standardCost: '',
      buyingPrice: '',
      landingCost: '',
      lastPurchaseRate: '',
      stockStatus: '',
      currentStock: '',
      reorderLevel: '',
      maxStockLevel: '',
      safetyStock: '',
      minOrderQty: '',
      maxOrderQty: '',
      slowMovingDays: '',
      deadStockDays: '',
      damagedQty: '',
      locationId: '',
      leadTimeDays: '',
      materialType: '',
      countryOfOrigin: '',
      hsnCode: '',
      conversionRatio: '',
      unitSize: '',
      caseNo: '',
      aliasName: '',
      purchasePersonId: '',
      isActive: true,
      isDiscontinued: false,
    });
    setImages([]);
    setDocuments([]);
    setActiveTab('basic');
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      productCode: product.productCode || '',
      sku: product.sku || '',
      description: product.description || '',
      productType: product.productType || '',
      categoryId: product.categoryId || '',
      segmentId: product.segmentId || '',
      groupId: product.groupId || '',
      brandId: product.brandId || '',
      uomId: product.uomId || '',
      gstRateId: product.gstRateId || '',
      weight: product.weight?.toString() || '',
      cbmPerBox: product.cbmPerBox?.toString() || '',
      unitsPerCase: product.unitsPerCase?.toString() || '',
      totalCbm: product.totalCbm?.toString() || '',
      dimensions: product.dimensions || '',
      barcode: product.barcode || '',
      hsCode: product.hsCode || '',
      unitBasis: product.unitBasis || '',
      packingSize: product.packingSize?.toString() || '',
      mrp: product.mrp?.toString() || '',
      standardCost: product.standardCost?.toString() || '',
      buyingPrice: product.buyingPrice?.toString() || '',
      landingCost: product.landingCost?.toString() || '',
      lastPurchaseRate: product.lastPurchaseRate?.toString() || '',
      stockStatus: product.stockStatus || '',
      currentStock: product.currentStock?.toString() || '',
      reorderLevel: product.reorderLevel?.toString() || '',
      maxStockLevel: product.maxStockLevel?.toString() || '',
      safetyStock: product.safetyStock?.toString() || '',
      minOrderQty: product.minOrderQty?.toString() || '',
      maxOrderQty: product.maxOrderQty?.toString() || '',
      slowMovingDays: product.slowMovingDays?.toString() || '',
      deadStockDays: product.deadStockDays?.toString() || '',
      damagedQty: product.damagedQty?.toString() || '',
      locationId: product.locationId || '',
      leadTimeDays: product.leadTimeDays?.toString() || '',
      materialType: product.materialType || '',
      countryOfOrigin: product.countryOfOrigin || '',
      hsnCode: product.hsnCode || '',
      conversionRatio: product.conversionRatio?.toString() || '',
      unitSize: product.unitSize || '',
      caseNo: product.caseNo || '',
      aliasName: product.aliasName || '',
      purchasePersonId: product.purchasePersonId || '',
      isActive: product.isActive ?? true,
      isDiscontinued: product.isDiscontinued ?? false,
    });
    // Load existing images and documents
    if (product.imageUrl) {
      setImages([{
        id: 'existing_1',
        name: 'product_image',
        url: product.imageUrl,
        type: 'image/*',
        size: 0,
        uploadedAt: new Date(),
      }]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    // Convert numeric input strings to numbers. packingSize stays a string for API validation.
    const numberFields = [
      'weight', 'cbmPerBox', 'unitsPerCase', 'totalCbm',
      'mrp', 'standardCost', 'buyingPrice', 'landingCost', 'lastPurchaseRate',
      'currentStock', 'reorderLevel', 'maxStockLevel', 'safetyStock',
      'minOrderQty', 'maxOrderQty', 'slowMovingDays', 'deadStockDays',
      'damagedQty', 'leadTimeDays', 'conversionRatio'
    ];

    numberFields.forEach(field => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
        payload[field] = parseFloat(payload[field]);
      } else {
        delete payload[field];
      }
    });

    const uuidFields = ['categoryId', 'segmentId', 'brandId', 'uomId', 'gstRateId'];
    uuidFields.forEach(field => {
      if (payload[field] === '') {
        delete payload[field];
      }
    });

    const enumFields = ['unitBasis', 'stockStatus'];
    enumFields.forEach(field => {
      if (payload[field] === '') {
        delete payload[field];
      }
    });

    if (payload.sku && !payload.productCode) {
      payload.productCode = payload.sku;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.productId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  function handleInputChange(field: string, value: any) {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage product catalog with full inventory details</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProduct(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search products by name, SKU, or code..."
              className="pl-10 h-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesData?.data?.map((cat: any) => (
                <SelectItem key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSearch(''); setPage(1); }}>
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Packing Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">MRP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">GST</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">CBM</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Buying Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Purchase Person</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit (Per Pc / Per Kg)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Case No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">alias name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(17)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length ? (
                products.map((product: any) => (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {product.sku || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {(() => {
                        const locList = locationsData?.data || [];
                        const locObj = locList.find((l: any) => l.locationId === product.locationId || l.id === product.locationId);
                        const displayLocName = product.location?.locationName || product.location?.name || product.locationName || locObj?.locationName || locObj?.name;
                        return displayLocName || (product.locationId && !product.locationId.includes('-') ? product.locationId : '-');
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{product.productType || '-'}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{product.productName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.unitSize || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.packingSize || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">₹{product.mrp?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.gstRate?.gstPercent ? `${product.gstRate.gstPercent}%` : '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.cbmPerBox || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">₹{product.buyingPrice?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.category?.categoryName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.purchasePersonName || product.purchasePersonId || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.brand?.brandName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.unitBasis === 'per_pc' ? 'Per Piece' : product.unitBasis === 'per_kg' ? 'Per KG' : '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.caseNo || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{product.aliasName || '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(product.productId); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={17} className="px-4 py-16 text-center">
                    <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No products found</p>
                    <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setEditingProduct(null); setIsDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Product
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {products.length > 0 && (
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <Label className="text-slate-700 font-medium">SKU *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.sku}
                        onChange={e => handleInputChange('sku', e.target.value)}
                        placeholder="Auto-generated SKU"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const brand = brandsData?.data?.find((b: any) => b.brandId === formData.brandId)?.brandName || '';
                            const location = locationsData?.data?.find((l: any) => l.id === formData.locationId)?.name || '';
                            const category = categoriesData?.data?.find((c: any) => c.categoryId === formData.categoryId)?.categoryCode || '';

                            if (formData.productName) {
                              const res = await mastersApi.generateSku({
                                brandName: brand,
                                locationName: location,
                                productName: formData.productName,
                                unitSize: formData.unitSize,
                                packingSize: formData.packingSize?.toString(),
                                categoryCode: category
                              });
                              const sku = typeof res?.data === 'string' ? res.data : res?.data?.sku;
                              if (sku) {
                                handleInputChange('sku', sku);
                                toast.success('SKU generated successfully!');
                              }
                            } else {
                              toast.error('Product Description (Product Name) is required to generate SKU');
                            }
                          } catch (err) {
                            console.error('Failed to auto-generate SKU', err);
                            toast.error('Failed to auto-generate SKU');
                          }
                        }}
                      >
                        Auto-Generate
                      </Button>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <Label className="text-slate-700 font-medium">Location</Label>
                    <SearchableSelect
                      placeholder="Select location"
                      options={locationsData?.data?.map((loc: any) => ({
                        label: `${loc.code} - ${loc.name}`,
                        value: loc.id
                      })) || []}
                      value={formData.locationId}
                      onChange={v => handleInputChange('locationId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('location');
                        setQuickAddFields({ code: '', name: searchVal, type: 'warehouse' });
                      }}
                    />
                  </div>

                  {/* Product Type */}
                  <div>
                    <Label className="text-slate-700 font-medium">Product Type</Label>
                    <Select value={formData.productType} onValueChange={v => handleInputChange('productType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finished_goods">Finished Goods</SelectItem>
                        <SelectItem value="raw_material">Raw Material</SelectItem>
                        <SelectItem value="semi_finished">Semi-Finished</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Description */}
                  <div>
                    <Label className="text-slate-700 font-medium">Product Description (Product Name) *</Label>
                    <Input
                      value={formData.productName}
                      onChange={e => handleInputChange('productName', e.target.value)}
                      placeholder="Enter product description"
                      required
                    />
                  </div>

                  {/* Unit Type */}
                  <div>
                    <Label className="text-slate-700 font-medium">Unit Type (Unit Size)</Label>
                    <Input
                      value={formData.unitSize}
                      onChange={e => handleInputChange('unitSize', e.target.value)}
                      placeholder="e.g. 1KG, 500ML"
                    />
                  </div>

                  {/* Packing Size */}
                  <div>
                    <Label className="text-slate-700 font-medium">Packing Size</Label>
                    <Input
                      type="number"
                      value={formData.packingSize}
                      onChange={e => handleInputChange('packingSize', e.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>

                  {/* MRP */}
                  <div>
                    <Label className="text-slate-700 font-medium">MRP</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={e => handleInputChange('mrp', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* GST */}
                  <div>
                    <Label className="text-slate-700 font-medium">GST Rate</Label>
                    <SearchableSelect
                      placeholder="Select GST rate"
                      options={gstRatesData?.data?.map((gst: any) => ({
                        label: `${gst.gstCode} - ${gst.gstPercent}%`,
                        value: gst.gstRateId
                      })) || []}
                      value={formData.gstRateId}
                      onChange={v => handleInputChange('gstRateId', v)}
                    />
                  </div>

                  {/* CBM */}
                  <div>
                    <Label className="text-slate-700 font-medium">CBM</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.cbmPerBox}
                      onChange={e => handleInputChange('cbmPerBox', e.target.value)}
                      placeholder="0.0000"
                    />
                  </div>

                  {/* Buying Price */}
                  <div>
                    <Label className="text-slate-700 font-medium">Buying Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.buyingPrice}
                      onChange={e => handleInputChange('buyingPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-slate-700 font-medium">Category *</Label>
                    <SearchableSelect
                      placeholder="Select category"
                      options={categoriesData?.data?.map((cat: any) => ({
                        label: `${cat.categoryCode} - ${cat.categoryName}`,
                        value: cat.categoryId
                      })) || []}
                      value={formData.categoryId}
                      onChange={v => handleInputChange('categoryId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('category');
                        setQuickAddFields({ categoryCode: '', categoryName: searchVal, description: '' });
                      }}
                    />
                  </div>

                  {/* Purchase Person */}
                  <div>
                    <Label className="text-slate-700 font-medium">Purchase Person</Label>
                    <SearchableSelect
                      placeholder="Select purchase person"
                      options={purchaseUsersData?.data?.map((u: any) => ({
                        label: u.name,
                        value: u.userId
                      })) || []}
                      value={formData.purchasePersonId || ''}
                      onChange={v => handleInputChange('purchasePersonId', v)}
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <Label className="text-slate-700 font-medium">Brand</Label>
                    <SearchableSelect
                      placeholder="Select brand"
                      options={brandsData?.data?.map((brand: any) => ({
                        label: `${brand.brandCode} - ${brand.brandName}`,
                        value: brand.brandId
                      })) || []}
                      value={formData.brandId}
                      onChange={v => handleInputChange('brandId', v)}
                      onCreateNew={searchVal => {
                        setQuickAddType('brand');
                        setQuickAddFields({ brandCode: '', brandName: searchVal, description: '' });
                      }}
                    />
                  </div>

                  {/* Unit (Per Pc / Per Kg) */}
                  <div>
                    <Label className="text-slate-700 font-medium">Unit (Per Pc / Per Kg)</Label>
                    <Select value={formData.unitBasis} onValueChange={v => handleInputChange('unitBasis', v)}>
                      <SelectTrigger><SelectValue placeholder="Select basis" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_pc">Per Piece</SelectItem>
                        <SelectItem value="per_kg">Per KG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Case No */}
                  <div>
                    <Label className="text-slate-700 font-medium">Case No</Label>
                    <Input
                      value={formData.caseNo || ''}
                      onChange={e => handleInputChange('caseNo', e.target.value)}
                      placeholder="Enter case number"
                    />
                  </div>

                  {/* alias name */}
                  <div>
                    <Label className="text-slate-700 font-medium">alias name</Label>
                    <Input
                      value={formData.aliasName || ''}
                      onChange={e => handleInputChange('aliasName', e.target.value)}
                      placeholder="Enter alias name"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingProduct ? 'Update Product' : 'Create Product'}
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
                Quick Add {quickAddType === 'category' ? 'Category' : quickAddType === 'brand' ? 'Brand' : 'Location'}
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
              {quickAddType === 'category' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Category Code *</Label>
                    <Input
                      placeholder="e.g. CAT01"
                      value={quickAddFields.categoryCode || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, categoryCode: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Category Name *</Label>
                    <Input
                      placeholder="e.g. Hardware"
                      value={quickAddFields.categoryName || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, categoryName: e.target.value })}
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

              {quickAddType === 'brand' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Brand Code *</Label>
                    <Input
                      placeholder="e.g. BRND01"
                      value={quickAddFields.brandCode || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, brandCode: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Brand Name *</Label>
                    <Input
                      placeholder="e.g. Brand Name"
                      value={quickAddFields.brandName || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, brandName: e.target.value })}
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

              {quickAddType === 'location' && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Location Code *</Label>
                    <Input
                      placeholder="e.g. LOC01"
                      value={quickAddFields.code || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Location Name *</Label>
                    <Input
                      placeholder="e.g. Delhi Warehouse"
                      value={quickAddFields.name || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase">Type</Label>
                    <Input
                      placeholder="e.g. warehouse, factory"
                      value={quickAddFields.type || ''}
                      onChange={e => setQuickAddFields({ ...quickAddFields, type: e.target.value })}
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
                    if (quickAddType === 'category') {
                      if (!quickAddFields.categoryCode || !quickAddFields.categoryName) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createCategory(quickAddFields);
                      toast.success('Category created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['categories'] });
                      handleInputChange('categoryId', res.data.categoryId || res.data.id);
                    } else if (quickAddType === 'brand') {
                      if (!quickAddFields.brandCode || !quickAddFields.brandName) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createBrand(quickAddFields);
                      toast.success('Brand created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['brands'] });
                      handleInputChange('brandId', res.data.brandId || res.data.id);
                    } else if (quickAddType === 'location') {
                      if (!quickAddFields.code || !quickAddFields.name) {
                        toast.error('Please fill in required fields');
                        return;
                      }
                      const res = await mastersApi.createLocation(quickAddFields);
                      toast.success('Location created successfully!');
                      await queryClient.invalidateQueries({ queryKey: ['locations'] });
                      handleInputChange('locationId', res.data.id);
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
