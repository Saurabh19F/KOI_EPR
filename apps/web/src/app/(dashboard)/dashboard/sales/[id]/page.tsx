'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi, fmsApi, mastersApi } from '@/lib/api';
import '@/components/sales/SalesEnquiryGrid.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send, CheckCircle, XCircle, Clock, AlertTriangle, ShoppingCart, Package, FileText, Activity, Play, Building, Truck, User, Calendar, ArrowRight, Loader2, RefreshCw, Plus, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useState, useMemo, Suspense, use } from 'react';
import { useAuthStore } from '@/store/auth';

const STATUS_FLOW = [
  { status: 'draft', label: 'Draft', icon: FileText, color: 'gray' },
  { status: 'submitted', label: 'Submitted', icon: Send, color: 'blue' },
  { status: 'purchase_assigned', label: 'Purchase Assigned', icon: User, color: 'indigo' },
  { status: 'purchase_in_progress', label: 'Purchase In Progress', icon: ShoppingCart, color: 'orange' },
  { status: 'purchase_completed', label: 'Purchase Completed', icon: CheckCircle, color: 'teal' },
  { status: 'mis_review', label: 'MIS Review', icon: Activity, color: 'purple' },
  { status: 'mis_requote_required', label: 'Requote Required', icon: AlertTriangle, color: 'red' },
  { status: 'mis_approved', label: 'MIS Approved', icon: CheckCircle, color: 'green' },
  { status: 'rate_calculation', label: 'Rate Calculation', icon: Activity, color: 'yellow' },
  { status: 'approval_pending', label: 'Approval Pending', icon: Clock, color: 'indigo' },
  { status: 'quotation_created', label: 'Quotation Created', icon: FileText, color: 'green' },
];

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string; icon: any; variant: string }[]> = {
  draft: [{ label: 'Submit', nextStatus: 'submitted', icon: Send, variant: 'default' }],
  submitted: [{ label: 'Assign Purchase', nextStatus: 'purchase_assigned', icon: User, variant: 'default' }],
  purchase_assigned: [{ label: 'Start Purchase', nextStatus: 'purchase_in_progress', icon: ShoppingCart, variant: 'default' }],
  purchase_in_progress: [{ label: 'Complete Purchase', nextStatus: 'purchase_completed', icon: CheckCircle, variant: 'default' }],
  purchase_completed: [{ label: 'Send for MIS Review', nextStatus: 'mis_review', icon: Activity, variant: 'default' }],
  mis_requote_required: [{ label: 'Start Purchase', nextStatus: 'purchase_in_progress', icon: ShoppingCart, variant: 'default' }],
  mis_approved: [{ label: 'Rate Calculation', nextStatus: 'rate_calculation', icon: Activity, variant: 'default' }],
  rate_calculation: [{ label: 'Request Approval', nextStatus: 'approval_pending', icon: Clock, variant: 'default' }],
  approval_pending: [
    { label: 'Create Quotation', nextStatus: 'quotation_created', icon: FileText, variant: 'default' },
  ],
  quotation_created: [
    { label: 'Mark Won', nextStatus: 'won', icon: CheckCircle, variant: 'default' },
    { label: 'Mark Lost', nextStatus: 'lost', icon: XCircle, variant: 'destructive' },
  ],
};

interface Props {
  params: Promise<{ id: string }>;
}

function EnquiryDetailContent({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [remarksDialog, setRemarksDialog] = useState<{ open: boolean; action: string; nextStatus: string; title: string }>({ open: false, action: '', nextStatus: '', title: '' });
  const [remarks, setRemarks] = useState('');

  // --- Search from Master States for mapping ---
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [activeItemForSearch, setActiveItemForSearch] = useState<any>(null);

  // --- Fetch products for mapping ---
  const { data: productsData } = useQuery({
    queryKey: ['products-for-mapping', productSearchInput],
    queryFn: () => mastersApi.getProducts({ limit: 100, search: productSearchInput }),
    enabled: showProductSearch,
  });

  const { user } = useAuthStore();
  const userRoles = useMemo(() => {
    return user?.roles?.map((r: any) => r.roleCode?.toUpperCase()) || [user?.role?.toUpperCase()].filter(Boolean);
  }, [user]);

  const isAdmin = useMemo(() => userRoles.includes('ADMIN') || userRoles.includes('MANAGEMENT') || user?.isSuperAdmin, [userRoles, user]);
  const isMIS = useMemo(() => userRoles.includes('MIS') || userRoles.includes('MIS_USER') || user?.isSuperAdmin, [userRoles, user]);
  const isPurchase = useMemo(() => userRoles.includes('PURCHASE_USER') || userRoles.includes('PURCHASE_MANAGER') || user?.isSuperAdmin, [userRoles, user]);
  const isSales = useMemo(() => userRoles.includes('SALES_USER') || userRoles.includes('SALES_MANAGER') || user?.isSuperAdmin, [userRoles, user]);

  const { data: purchaseUsersData } = useQuery({
    queryKey: ['purchase-users-lookup'],
    queryFn: () => salesApi.getPurchaseUsers(),
  });

  const purchaseUsers = useMemo(() => {
    return purchaseUsersData?.data || [];
  }, [purchaseUsersData]);

  const [selectedItemsForRequote, setSelectedItemsForRequote] = useState<string[]>([]);
  const [misRemarks, setMisRemarks] = useState('');
  const [misReviewDialogOpen, setMisReviewDialogOpen] = useState(false);
  const [misAction, setMisAction] = useState<'approve' | 'requote' | null>(null);

  // ─── Global Apply-All Toggle States ──
  const [applyAllFreight, setApplyAllFreight] = useState(false);
  const [applyAllHaulage, setApplyAllHaulage] = useState(false);
  const [globalFreight, setGlobalFreight] = useState<string>('');
  const [globalHaulage, setGlobalHaulage] = useState<string>('');
  const [globalCurrency, setGlobalCurrency] = useState<string>('');
  const [applyAllCurrency, setApplyAllCurrency] = useState(false);

  // ─── Product MIS Review States ──
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productReviewOpen, setProductReviewOpen] = useState(false);
  const [productAction, setProductAction] = useState<'approve' | 'reject'>('approve');
  const [productRemarks, setProductRemarks] = useState('');
  const [productForm, setProductForm] = useState<any>({});

  // ─── Purchase: Create Product in Master States ──
  const [masterCreateOpen, setMasterCreateOpen] = useState(false);
  const [masterCreateItem, setMasterCreateItem] = useState<any>(null);
  const [masterCreateForm, setMasterCreateForm] = useState<any>({
    productName: '', description: '', productType: '',
    categoryId: '', segmentId: '', groupId: '', brandId: '', uomId: '', gstRateId: '',
    unitSize: '', unitsPerCase: '', cbmPerBox: '', weight: '', dimensions: '',
    barcode: '', hsCode: '', packingSize: '', locationId: '', purchasePersonId: '',
    mrp: '', buyingPrice: '', standardCost: '',
  });
  const [masterCreateSku, setMasterCreateSku] = useState('');

  // ─── Fetch reference data ───
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: mastersApi.getCategories });
  const { data: segmentsData } = useQuery({ queryKey: ['segments'], queryFn: mastersApi.getSegments });
  const { data: groupsData } = useQuery({ queryKey: ['groups'], queryFn: mastersApi.getGroups });
  const { data: brandsData } = useQuery({ queryKey: ['brands'], queryFn: mastersApi.getBrands });
  const { data: uomsData } = useQuery({ queryKey: ['uoms'], queryFn: mastersApi.getUoms });
  const { data: gstRatesData } = useQuery({ queryKey: ['gst-rates'], queryFn: mastersApi.getGstRates });
  const { data: locationsData } = useQuery({ queryKey: ['locations'], queryFn: mastersApi.getLocations });
  const { data: currenciesData } = useQuery({ queryKey: ['currencies'], queryFn: mastersApi.getCurrencies });

  const categories = categoriesData?.data || [];
  const currencies = currenciesData?.data || [];
  const segments = segmentsData?.data || [];
  const groups = groupsData?.data || [];
  const brands = brandsData?.data || [];
  const uoms = uomsData?.data || [];
  const gstRates = gstRatesData?.data || [];
  const locations = locationsData?.data || [];

  const productMisReviewMutation = useMutation({
    mutationFn: ({ id, body }: any) => mastersApi.misReviewProduct(id, body),
    onSuccess: (_, vars: any) => {
      toast.success(vars.body.action === 'approve' ? '✅ Product approved and SKU generated' : '❌ Product rejected');
      setProductReviewOpen(false);
      setProductRemarks('');
      setProductForm({});
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Product review failed'),
  });

  // ─── Purchase: Create Product in Master mutation ──
  const masterCreateMutation = useMutation({
    mutationFn: async (formData: any) => {
      const numericFields = ['weight', 'cbmPerBox', 'unitsPerCase', 'totalCbm', 'standardCost', 'mrp', 'buyingPrice', 'landingCost', 'lastPurchaseRate', 'currentStock', 'reorderLevel', 'maxStockLevel', 'safetyStock', 'minOrderQty', 'maxOrderQty', 'slowMovingDays', 'deadStockDays', 'damagedQty', 'leadTimeDays', 'conversionRatio'];
      const stringFields = ['productName', 'productCode', 'description', 'categoryId', 'segmentId', 'groupId', 'brandId', 'uomId', 'gstRateId', 'dimensions', 'hsCode', 'sku', 'productType', 'barcode', 'unitBasis', 'packingSize', 'stockStatus', 'locationId', 'materialType', 'countryOfOrigin', 'hsnCode', 'unitSize', 'caseNo', 'aliasName', 'purchasePersonId', 'purchasePersonName'];
      const booleanFields = ['isActive', 'isDiscontinued'];

      const cleaned: any = {};
      for (const key of stringFields) {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          cleaned[key] = String(formData[key]);
        }
      }
      for (const key of numericFields) {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          const num = Number(formData[key]);
          if (!isNaN(num)) cleaned[key] = num;
        }
      }
      for (const key of booleanFields) {
        if (formData[key] !== undefined && formData[key] !== null) {
          cleaned[key] = Boolean(formData[key]);
        }
      }

      const brandObj = brands.find((b: any) => b.brandId === cleaned.brandId);
      const locationObj = locations.find((l: any) => (l.locationId || l.id) === cleaned.locationId);
      const skuRes = await mastersApi.generateSku({
        brandName: brandObj?.brandName || '',
        locationName: locationObj?.locationName || locationObj?.name || '',
        productName: cleaned.productName || 'PRODUCT',
        unitSize: cleaned.unitSize || '',
        packingSize: cleaned.packingSize || '',
      });
      const generatedSku = typeof skuRes?.data === 'string' ? skuRes.data : skuRes?.data?.sku;
      if (generatedSku) cleaned.sku = generatedSku;

      const res = await mastersApi.createProduct(cleaned);
      return res;
    },
    onSuccess: async (res: any) => {
      const newProduct = res?.data;
      if (newProduct && masterCreateItem) {
        const catObj = categories.find((c: any) => c.categoryId === newProduct.categoryId);
        const brandObj = brands.find((b: any) => b.brandId === newProduct.brandId);
        const gstObj = gstRates.find((g: any) => g.gstRateId === newProduct.gstRateId);
        const rawGst = newProduct.gstRate?.gstPercent || gstObj?.gstPercent || gstObj?.rate;
        const updatePayload: any = {
          productId: newProduct.productId,
          masterProductId: newProduct.productId,
          sku: newProduct.sku || '',
          productName: newProduct.productName,
          categoryId: newProduct.categoryId,
          categoryName: newProduct.category?.categoryName || catObj?.categoryName || '',
          brandId: newProduct.brandId,
          brandName: newProduct.brand?.brandName || brandObj?.brandName || '',
          unitSize: newProduct.unitSize || '',
          unitPerCarton: newProduct.unitsPerCase || newProduct.unitsPerCarton || 1,
          cbmPerBox: newProduct.cbmPerBox ? Number(newProduct.cbmPerBox) : 0,
          isManualEntry: false,
          masterStatus: 'master_product',
        };
        if (newProduct.mrp) updatePayload.mrp = Number(newProduct.mrp);
        if (newProduct.buyingPrice) updatePayload.buyingPrice = Number(newProduct.buyingPrice);
        if (newProduct.landingCost || newProduct.buyingPrice) updatePayload.expectedRate = Number(newProduct.landingCost || newProduct.buyingPrice);
        if (newProduct.landingCost) updatePayload.landingCost = Number(newProduct.landingCost);
        if (rawGst) updatePayload.gstPercent = Number(rawGst);
        await salesApi.updateEnquiryItem(masterCreateItem.itemId, updatePayload);
      }
      toast.success('Product added to Master successfully');
      setMasterCreateOpen(false);
      setMasterCreateItem(null);
      setMasterCreateForm({});
      setMasterCreateSku('');
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create product in master'),
  });

  const openMasterCreate = (item: any) => {
    setMasterCreateItem(item);
    setMasterCreateForm({
      productName: item.productName || item.manualProductName || '',
      description: '',
      productType: '',
      categoryId: item.categoryId || '',
      segmentId: '',
      groupId: '',
      brandId: item.brandId || '',
      uomId: '',
      gstRateId: '',
      unitSize: item.unitSize || '',
      unitsPerCase: item.unitPerCarton || item.unitsPerCase || '',
      cbmPerBox: item.cbmPerBox || '',
      weight: '',
      dimensions: '',
      barcode: '',
      hsCode: '',
      packingSize: '',
      locationId: '',
      purchasePersonId: user?.userId || '',
      mrp: item.mrp || '',
      buyingPrice: item.buyingPrice || item.price || '',
      standardCost: '',
    });
    setMasterCreateSku('');
    setMasterCreateOpen(true);
  };

  const openProductReview = (product: any) => {
    setSelectedProduct(product);
    setProductAction('approve');
    setProductRemarks('');
    setProductForm({
      categoryId: product.categoryId || '',
      segmentId: product.segmentId || '',
      groupId: product.groupId || '',
      brandId: product.brandId || '',
      uomId: product.uomId || '',
      gstRateId: product.gstRateId || '',
      unitSize: product.unitSize || '',
      unitsPerCarton: product.unitsPerCarton || '',
      cbmPerBox: product.cbmPerBox || '',
      locationId: product.locationId || '',
    });
    setProductReviewOpen(true);
  };

  const handleUpdateItemField = async (itemId: string, field: string, value: any) => {
    try {
      await salesApi.updateEnquiryItem(itemId, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    } catch (error) {
      toast.error('Failed to update product details');
    }
  };

  const handleApplyToAll = async (field: string, value: any) => {
    if (!enquiry?.data?.items?.length) return;
    try {
      await Promise.all(
        enquiry.data.items.map((item: any) =>
          salesApi.updateEnquiryItem(item.itemId, { [field]: value })
        )
      );
      toast.success(`${field} updated for all products`);
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    } catch {
      toast.error(`Failed to update ${field} for all products`);
    }
  };

  const handleProductSelect = async (product: any) => {
    if (!activeItemForSearch) return;
    try {
      const gstObj = product.gstRate || gstRates.find((g: any) => g.gstRateId === product.gstRateId);
      const rawGst = gstObj?.gstPercent || gstObj?.rate;
      const selectPayload: any = {
        productId: product.productId,
        masterProductId: product.productId,
        sku: product.sku,
        productName: product.productName,
        categoryId: product.categoryId,
        categoryName: product.category?.categoryName || '',
        brandId: product.brandId,
        brandName: product.brand?.brandName || '',
        unitSize: product.unitSize || '',
        unitPerCarton: product.unitsPerCase || product.unitsPerCarton || 1,
        cbmPerBox: product.cbmPerBox ? Number(product.cbmPerBox) : 0,
        isManualEntry: false,
        masterStatus: 'master_product',
      };
      if (product.mrp) selectPayload.mrp = Number(product.mrp);
      if (product.buyingPrice) selectPayload.buyingPrice = Number(product.buyingPrice);
      if (product.landingCost || product.buyingPrice) selectPayload.expectedRate = Number(product.landingCost || product.buyingPrice);
      if (product.landingCost) selectPayload.landingCost = Number(product.landingCost);
      if (rawGst) selectPayload.gstPercent = Number(rawGst);
      await salesApi.updateEnquiryItem(activeItemForSearch.itemId, selectPayload);
      toast.success('Product details mapped from Master successfully');
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    } catch (error) {
      toast.error('Failed to map product details from Master');
    } finally {
      setShowProductSearch(false);
      setProductSearchInput('');
      setActiveItemForSearch(null);
    }
  };

  const handleCloseProductSearch = () => {
    setShowProductSearch(false);
    setProductSearchInput('');
    setActiveItemForSearch(null);
  };

  const misReviewMutation = useMutation({
    mutationFn: ({ action, remarks: r, requoteItemIds }: { action: 'approve' | 'requote'; remarks: string; requoteItemIds?: string[] }) =>
      salesApi.misReview(id, action, r, requoteItemIds),
    onSuccess: () => {
      toast.success(`MIS Review submitted: ${misAction}`);
      setMisReviewDialogOpen(false);
      setMisRemarks('');
      setSelectedItemsForRequote([]);
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit MIS review');
    }
  });

  const { data: enquiry, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => salesApi.getEnquiry(id),
    enabled: !!id,
    retry: 2,
    refetchInterval: 3000,
  });
  const { data: tasksData } = useQuery({ queryKey: ['enquiry-tasks', id], queryFn: () => fmsApi.getTasks({ limit: 50 }), enabled: !!enquiry });

  const statusMutation = useMutation({
    mutationFn: ({ status, remarks: r }: { status: string; remarks?: string }) => salesApi.updateEnquiryStatus(id, status, r),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
      setRemarksDialog({ open: false, action: '', nextStatus: '', title: '' });
      setRemarks('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const sendToPurchaseMutation = useMutation({
    mutationFn: () => salesApi.sendToPurchase(id),
    onSuccess: () => { toast.success('Sent to purchase'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  const wonMutation = useMutation({
    mutationFn: (r?: string) => salesApi.markWon(id),
    onSuccess: () => { toast.success('Enquiry marked as won'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && document.referrer.includes('/dashboard/purchase')) {
      router.push('/dashboard/purchase');
    } else if (isPurchase && !isSales) {
      router.push('/dashboard/purchase');
    } else {
      router.push('/dashboard/sales');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (isError || !enquiry?.data) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="text-lg font-medium text-slate-800">
          {isError ? (error as any)?.response?.data?.message || 'Failed to load enquiry details' : 'Enquiry not found'}
        </h3>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Button onClick={handleBackClick}>Back</Button>
        </div>
      </div>
    );
  }

  const currentStatus = enquiry.data.status;
  const ADMIN_ONLY_TRANSITIONS = ['purchase_assigned', 'rate_calculation', 'approval_pending', 'quotation_created'];
  const actions = (STATUS_ACTIONS[currentStatus] || []).filter(
    (a) => !ADMIN_ONLY_TRANSITIONS.includes(a.nextStatus) || isAdmin
  );
  const currentStepIndex = STATUS_FLOW.findIndex((s) => s.status === currentStatus);

  const canSalesEdit = isSales && currentStatus === 'draft';
  const canEdit = isMIS || isPurchase || user?.isSuperAdmin || canSalesEdit;
  const relatedTasks = tasksData?.data?.data?.filter((t: any) => t.entityId === id || t.referenceId === id) || [];

  const getSourceBadge = (item: any) => {
    if (item.masterStatus === 'not_in_master' || item.isManualEntry) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">NOT IN MASTER</Badge>;
    }
    if (item.masterStatus === 'pending_review') {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">REVIEW PENDING</Badge>;
    }
    if (item.masterStatus === 'mapped') {
      return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">MAPPED</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">MASTER</Badge>;
  };

  const getField = (value: string | undefined) => {
    if (!value || value === 'NOT IN MASTER') return <span className="text-amber-500 font-medium">NOT IN MASTER</span>;
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{enquiry.data.enquiryOrderNo || enquiry.data.enquiryNumber}</h1>
              <Badge className={getStatusColor(currentStatus)}>{currentStatus?.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-gray-500">Created {formatDate(enquiry.data.enquiryDate)} by {enquiry.data.createdByUser?.name || 'Unknown'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.nextStatus} variant={action.variant as any} onClick={() => {
                if (action.nextStatus === 'won' || action.nextStatus === 'lost') {
                  setRemarksDialog({ open: true, action: action.nextStatus, nextStatus: action.nextStatus, title: action.label });
                } else {
                  statusMutation.mutate({ status: action.nextStatus });
                }
              }} disabled={statusMutation.isPending}>
                <Icon className="h-4 w-4 mr-2" />{action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center overflow-x-auto pb-2 gap-2">
            {STATUS_FLOW.map((step, index) => {
              const isDone = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs mt-2 whitespace-nowrap ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>{step.label}</span>
                  </div>
                  {index < STATUS_FLOW.length - 1 && <div className={`w-8 h-1 mx-1 rounded ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products ({enquiry.data.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({relatedTasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Buyer Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Buyer Code', enquiry.data.buyerCode],
                  ['Company', enquiry.data.buyerName],
                  ['Sales Person', enquiry.data.createdByUser?.name || enquiry.data.salesPersonName || '-'],
                  ['Contact', enquiry.data.contactName],
                  ['Phone', enquiry.data.contactNumber],
                  ['Email', enquiry.data.buyerEmail],
                  ['Location', [enquiry.data.city, enquiry.data.state, enquiry.data.country].filter(Boolean).join(', ') || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">{value || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Logistics Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['PO Number', enquiry.data.poNumber],
                  ['PO Date', formatDate(enquiry.data.poDate)],
                  ['POD', enquiry.data.pod],
                  ['Payment Terms', enquiry.data.paymentTerms?.termsName],
                  ['Currency', enquiry.data.currency?.currencyCode],
                  ['Port of Loading', enquiry.data.portOfLoading],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">{value || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {isMIS && currentStatus === 'mis_review' && (
              <Card className="lg:col-span-2 border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    MIS Review Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-purple-800 font-medium">
                    Verify all product lines, costs, and assignments. Approve to move this enquiry to Rate Calculation, or request a Requote for any problematic items.
                  </p>
                  {selectedItemsForRequote.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                      <strong>Selected for Requote:</strong> {selectedItemsForRequote.length} items will be sent back to their assigned purchase users.
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setMisAction('approve');
                        setMisReviewDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Procurement
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setMisAction('requote');
                        setMisReviewDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin-slow" />
                      Request Requote {selectedItemsForRequote.length > 0 ? `(${selectedItemsForRequote.length} Items)` : '(All Items)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                {currentStatus === 'submitted' && (
                  <Button variant="outline" onClick={() => statusMutation.mutate({ status: 'purchase_assigned' })} disabled={statusMutation.isPending}>
                    <User className="h-4 w-4 mr-2" />Assign Purchase
                  </Button>
                )}
                {currentStatus === 'purchase_assigned' && (
                  <Button variant="outline" onClick={() => statusMutation.mutate({ status: 'purchase_in_progress' })} disabled={statusMutation.isPending}>
                    <ShoppingCart className="h-4 w-4 mr-2" />Start Purchase Costing
                  </Button>
                )}
                {currentStatus === 'purchase_in_progress' && (
                  <Button
                    variant="outline"
                    onClick={() => statusMutation.mutate({ status: 'purchase_completed' })}
                    disabled={
                      statusMutation.isPending ||
                      !enquiry?.data?.items?.length ||
                      enquiry.data.items.some((it: any) => it.purchaseStatus !== 'submitted' && it.purchaseStatus !== 'completed')
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />Complete Purchase
                  </Button>
                )}
                {currentStatus === 'purchase_completed' && (
                  <Button variant="outline" onClick={() => statusMutation.mutate({ status: 'mis_review' })} disabled={statusMutation.isPending}>
                    <Activity className="h-4 w-4 mr-2" />Send to MIS Review
                  </Button>
                )}
                {currentStatus === 'mis_approved' && isAdmin && (
                  <Button variant="outline" onClick={() => statusMutation.mutate({ status: 'rate_calculation' })} disabled={statusMutation.isPending}>
                    <Activity className="h-4 w-4 mr-2" />Start Rate Analysis
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Product Items Spreadsheet</span>
                <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                  Total CBM: {Number(enquiry.data.totalCbm || 0).toFixed(4)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enquiry?.data?.items && enquiry.data.items.length > 0 ? (
                <div className="space-y-3">
                  {/* ─── Global Apply-All Controls ─── */}
                  {canEdit && (
                    <div className="flex flex-wrap gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg items-end">
                      {/* Currency Toggle */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={applyAllCurrency} onChange={(e) => setApplyAllCurrency(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs font-semibold text-slate-600">Currency {applyAllCurrency ? '(All)' : '(Per Product)'}</span>
                        </div>
                        {applyAllCurrency && (
                          <div className="flex items-center gap-1">
                            <select
                              className="h-7 text-xs border border-slate-300 rounded px-1.5 bg-white outline-none"
                              value={globalCurrency}
                              onChange={(e) => setGlobalCurrency(e.target.value)}
                            >
                              <option value="">Select</option>
                              {currencies.map((c: any) => (
                                <option key={c.id || c.currencyId} value={c.currencyCode}>{c.currencyCode}</option>
                              ))}
                            </select>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" disabled={!globalCurrency}
                              onClick={() => handleApplyToAll('currency', globalCurrency)}>
                              Apply All
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Freight Toggle */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={applyAllFreight} onChange={(e) => setApplyAllFreight(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs font-semibold text-slate-600">Freight {applyAllFreight ? '(All)' : '(Per Product)'}</span>
                        </div>
                        {applyAllFreight && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number" step="0.01" placeholder="0.00"
                              className="h-7 w-24 text-xs border border-slate-300 rounded px-1.5 bg-white outline-none"
                              value={globalFreight}
                              onChange={(e) => setGlobalFreight(e.target.value)}
                            />
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" disabled={!globalFreight}
                              onClick={() => handleApplyToAll('freight', Number(globalFreight))}>
                              Apply All
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Haulage Toggle */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={applyAllHaulage} onChange={(e) => setApplyAllHaulage(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs font-semibold text-slate-600">Haulage {applyAllHaulage ? '(All)' : '(Per Product)'}</span>
                        </div>
                        {applyAllHaulage && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number" step="0.01" placeholder="0.00"
                              className="h-7 w-24 text-xs border border-slate-300 rounded px-1.5 bg-white outline-none"
                              value={globalHaulage}
                              onChange={(e) => setGlobalHaulage(e.target.value)}
                            />
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" disabled={!globalHaulage}
                              onClick={() => handleApplyToAll('haulage', Number(globalHaulage))}>
                              Apply All
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="sales-grid-container">
                    <table className="sales-grid-table">
                      <thead>
                        <tr>
                          {isMIS && currentStatus === 'mis_review' && (
                            <th className="w-16 text-center">Requote?</th>
                          )}
                          <th className="sales-sticky-col-num-hdr w-10 text-center">#</th>
                          <th className="sales-sticky-col-sku-hdr min-w-[150px]">Product Code (SKU)</th>
                          <th className="min-w-[200px]">Product Name</th>
                          <th className="min-w-[120px]">Quote Status</th>
                          <th className="min-w-[120px]">Category</th>
                          <th className="min-w-[180px]">Purchase Person</th>
                          <th className="min-w-[120px]">Brand</th>
                          <th className="min-w-[100px]">Unit Size</th>
                          <th className="w-24 text-right">Units Per Case</th>
                          <th className="w-24 text-right bg-yellow-50 text-yellow-800">Quantity</th>
                          <th className="w-24 text-right">CBM/Box</th>
                          <th className="w-28 text-right">Total CBM</th>
                          <th className="w-28 text-right">Buying Price</th>
                          <th className="w-28 text-right">Expected Rate</th>
                          <th className="w-24 text-right">MRP</th>
                          <th className="w-24 text-right">GST %</th>
                          <th className="w-28 text-right bg-yellow-50 text-yellow-800">Freight</th>
                          <th className="w-28 text-right bg-yellow-50 text-yellow-800">Landing Cost</th>
                          <th className="min-w-[200px] bg-yellow-50 text-yellow-800">Remarks</th>
                          <th className="w-32 text-center bg-yellow-50 text-yellow-800">Unit (Per Kg / Per Pcs)</th>
                          <th className="w-28 text-center bg-yellow-50 text-yellow-800">Currency</th>
                          <th className="w-28 text-right bg-yellow-50 text-yellow-800">Haulage</th>
                          <th className="w-32 text-center bg-yellow-50 text-yellow-800">Re-Quote</th>
                          <th className="w-32 text-center">Source</th>
                          <th className="w-28 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enquiry.data.items.map((item: any, index: number) => {
                          const isMasterProduct = Boolean(item.productId) || Boolean(!item.isManualEntry && item.sku && item.sku !== 'NOT IN MASTER' && !item.sku?.startsWith('TEMP-'));
                          return (
                            <tr key={item.itemId || index} className="sales-grid-row">
                              {isMIS && currentStatus === 'mis_review' && (
                                <td className="px-2 py-1 text-center">
                                  <input
                                    type="checkbox"
                                    title="Select item for requote"
                                    checked={selectedItemsForRequote.includes(item.itemId)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedItemsForRequote(prev => [...prev, item.itemId]);
                                      } else {
                                        setSelectedItemsForRequote(prev => prev.filter(id => id !== item.itemId));
                                      }
                                    }}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="sales-sticky-col-num text-center font-medium text-xs">
                                {index + 1}
                              </td>
                              <td className="sales-sticky-col-sku p-0.5">
                                <div className="flex items-center gap-1 w-full px-1">
                                  <input
                                    type="text"
                                    className="w-full border-none bg-transparent outline-none py-1 text-xs font-mono text-blue-600 font-semibold"
                                    defaultValue={item.sku || item.productCode || ''}
                                    onBlur={(e) => {
                                      if (e.target.value !== (item.sku || item.productCode || '')) {
                                        handleUpdateItemField(item.itemId, 'sku', e.target.value);
                                      }
                                    }}
                                    placeholder="Product Code"
                                    disabled={!canEdit || isMasterProduct}
                                  />
                                  {canEdit && !isMasterProduct && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 shrink-0 rounded-sm"
                                      onClick={() => {
                                        setActiveItemForSearch(item);
                                        setProductSearchInput(item.productName || item.manualProductName || '');
                                        setShowProductSearch(true);
                                      }}
                                    >
                                      <Search className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs font-medium"
                                  defaultValue={item.productName || item.manualProductName || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.productName || item.manualProductName || '')) {
                                      handleUpdateItemField(item.itemId, 'productName', e.target.value);
                                    }
                                  }}
                                  placeholder="Product Name"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="px-2 py-1 text-sm">
                                <Badge variant={item.purchaseStatus === 'submitted' || item.purchaseStatus === 'completed' ? 'default' : 'secondary'} className={item.purchaseStatus === 'submitted' || item.purchaseStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {item.purchaseStatus || 'pending'}
                                </Badge>
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs"
                                  defaultValue={item.categoryName || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.categoryName || '')) {
                                      handleUpdateItemField(item.itemId, 'categoryName', e.target.value);
                                    }
                                  }}
                                  placeholder="Category"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="px-2 py-1 text-sm min-w-[180px]">
                                {(item.purchasePersonName || item.productPurchasePersonName) ? (
                                  <span className="font-semibold text-slate-700 text-xs">
                                    {item.purchasePersonName || item.productPurchasePersonName}
                                  </span>
                                ) : canEdit ? (
                                  <Select
                                    value={item.purchasePersonId || item.assignedPurchaseUserId || ''}
                                    onValueChange={async (val) => {
                                      try {
                                        await salesApi.updateEnquiryItem(item.itemId, { purchasePersonId: val });
                                        toast.success('Purchase Person updated');
                                        refetch();
                                      } catch (e) {
                                        toast.error('Failed to update assignment');
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[160px] h-7 text-xs">
                                      <SelectValue placeholder="Select Person" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {purchaseUsers.map((u: any) => (
                                        <SelectItem key={u.userId} value={u.userId} className="text-xs">
                                          {u.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs"
                                  defaultValue={item.brandName || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.brandName || '')) {
                                      handleUpdateItemField(item.itemId, 'brandName', e.target.value);
                                    }
                                  }}
                                  placeholder="Brand"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right"
                                  defaultValue={item.unitSize || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.unitSize || '')) {
                                      handleUpdateItemField(item.itemId, 'unitSize', e.target.value);
                                    }
                                  }}
                                  placeholder="Size"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right"
                                  defaultValue={item.unitPerCarton || item.unitsPerCase || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.unitPerCarton || item.unitsPerCase || null)) {
                                      handleUpdateItemField(item.itemId, 'unitPerCarton', val);
                                    }
                                  }}
                                  placeholder="Units Per Case"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5 bg-yellow-50/40">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-semibold"
                                  defaultValue={item.quantity || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.quantity || null)) {
                                      handleUpdateItemField(item.itemId, 'quantity', val);
                                    }
                                  }}
                                  placeholder="Qty"
                                  disabled={!canEdit || (isMasterProduct && !isSales && !isMIS && !user?.isSuperAdmin)}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  step="0.0001"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right"
                                  defaultValue={item.cbmPerBox || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.cbmPerBox || null)) {
                                      handleUpdateItemField(item.itemId, 'cbmPerBox', val);
                                    }
                                  }}
                                  placeholder="CBM"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="px-2 py-1 text-sm text-right font-medium">{item.totalCbm !== undefined && item.totalCbm !== null ? Number(item.totalCbm).toFixed(4) : '-'}</td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-semibold text-indigo-600"
                                  defaultValue={item.buyingPrice || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.buyingPrice || null)) {
                                      handleUpdateItemField(item.itemId, 'buyingPrice', val);
                                    }
                                  }}
                                  placeholder="Price"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-semibold text-emerald-600"
                                  defaultValue={item.expectedRate || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.expectedRate || null)) {
                                      handleUpdateItemField(item.itemId, 'expectedRate', val);
                                    }
                                  }}
                                  placeholder="Rate"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right"
                                  defaultValue={item.mrp || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.mrp || null)) {
                                      handleUpdateItemField(item.itemId, 'mrp', val);
                                    }
                                  }}
                                  placeholder="MRP"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="number"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right"
                                  defaultValue={item.gstPercent || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.gstPercent || null)) {
                                      handleUpdateItemField(item.itemId, 'gstPercent', val);
                                    }
                                  }}
                                  placeholder="GST %"
                                  disabled={!canEdit || isMasterProduct}
                                />
                              </td>
                              <td className="p-0.5 bg-yellow-50/40">
                                {applyAllFreight ? (
                                  <span className="text-xs text-slate-500 italic text-right block px-1.5">{globalFreight || item.freight || '-'}</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-medium"
                                    defaultValue={item.freight || ''}
                                    onBlur={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : null;
                                      if (val !== (item.freight || null)) {
                                        handleUpdateItemField(item.itemId, 'freight', val);
                                      }
                                    }}
                                    placeholder="0.00"
                                    disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                  />
                                )}
                              </td>
                              <td className="p-0.5 bg-yellow-50/40">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-bold"
                                  defaultValue={item.landingCost || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    if (val !== (item.landingCost || null)) {
                                      handleUpdateItemField(item.itemId, 'landingCost', val);
                                    }
                                  }}
                                  placeholder="0.00"
                                  disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                />
                              </td>
                              <td className="p-0.5 bg-yellow-50/40">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs"
                                  defaultValue={item.remarks || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.remarks || '')) {
                                      handleUpdateItemField(item.itemId, 'remarks', e.target.value);
                                    }
                                  }}
                                  placeholder="Remarks"
                                  disabled={!canEdit}
                                />
                              </td>
                              <td className="p-0.5 bg-yellow-50/40 text-center">
                                <select
                                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 outline-none text-[11px] cursor-pointer"
                                  defaultValue={item.uom || 'Per Pcs'}
                                  onChange={(e) => {
                                    handleUpdateItemField(item.itemId, 'uom', e.target.value);
                                  }}
                                  disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                >
                                  <option value="Per Pcs">Per Pcs</option>
                                  <option value="Per Kg">Per Kg</option>
                                </select>
                              </td>
                              {/* Currency per product */}
                              <td className="p-0.5 bg-yellow-50/40 text-center">
                                {applyAllCurrency ? (
                                  <span className="text-xs text-slate-500 italic">{globalCurrency || item.currency || '-'}</span>
                                ) : (
                                  <select
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200 outline-none text-[11px] cursor-pointer"
                                    defaultValue={item.currency || ''}
                                    onChange={(e) => handleUpdateItemField(item.itemId, 'currency', e.target.value)}
                                    disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                  >
                                    <option value="">Select</option>
                                    {currencies.map((c: any) => (
                                      <option key={c.id || c.currencyId} value={c.currencyCode}>{c.currencyCode}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              {/* Haulage per product */}
                              <td className="p-0.5 bg-yellow-50/40">
                                {applyAllHaulage ? (
                                  <span className="text-xs text-slate-500 italic text-right block px-1.5">{globalHaulage || item.haulage || '-'}</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs text-right font-medium"
                                    defaultValue={item.haulage || ''}
                                    onBlur={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : null;
                                      if (val !== (item.haulage || null)) {
                                        handleUpdateItemField(item.itemId, 'haulage', val);
                                      }
                                    }}
                                    placeholder="0.00"
                                    disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                  />
                                )}
                              </td>
                              {/* Re-Quote select per product */}
                              <td className="p-0.5 bg-yellow-50/40 text-center">
                                <select
                                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200 outline-none text-[11px] cursor-pointer"
                                  defaultValue={item.requoteStatus || 'none'}
                                  onChange={(e) => handleUpdateItemField(item.itemId, 'requoteStatus', e.target.value)}
                                  disabled={!(isPurchase || isMIS || user?.isSuperAdmin)}
                                >
                                  <option value="none">No Re-Quote</option>
                                  <option value="requote_requested">Re-Quote Requested</option>
                                  <option value="requote_in_progress">Re-Quote In Progress</option>
                                  <option value="requote_completed">Re-Quote Completed</option>
                                </select>
                              </td>
                              <td className="p-1 text-center">{getSourceBadge(item)}</td>
                              <td className="p-1 text-center font-sans">
                                <div className="flex items-center justify-center gap-1">
                                  {canEdit && (!item.productId || item.sku === 'NOT IN MASTER' || item.sku?.startsWith('TEMP-') || item.categoryName === 'NOT IN MASTER' || item.isManualEntry) && (
                                    isPurchase ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] h-5 px-2 py-0 font-semibold"
                                        onClick={() => openMasterCreate(item)}
                                      >
                                        Take
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] h-5 px-1 py-0"
                                        onClick={() => {
                                          openProductReview({
                                            productId: item.productId,
                                            tempProductName: item.productName || item.manualProductName,
                                            sku: item.sku,
                                            categoryId: item.categoryId,
                                            brandId: item.brandId,
                                            unitSize: item.unitSize,
                                            unitsPerCarton: item.unitPerCarton || item.unitsPerCase,
                                            cbmPerBox: item.cbmPerBox,
                                            sourceEnquiryNo: enquiry.data.enquiryOrderNo || enquiry.data.enquiryNumber,
                                          });
                                        }}
                                      >
                                        + Master
                                      </Button>
                                    )
                                  )}
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      type="button"
                                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this product line?')) {
                                          try {
                                            await salesApi.deleteEnquiryItem(item.itemId);
                                            toast.success('Product line deleted');
                                            refetch();
                                          } catch (e) {
                                            toast.error('Failed to delete item');
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {canEdit && (
                    <div className="flex justify-between items-center bg-white border border-slate-200 rounded-md p-1.5 shadow-sm shrink-0">
                      <Button
                        onClick={async () => {
                          try {
                            await salesApi.addEnquiryItem(id, {
                              productName: 'New Product',
                              quantity: 1,
                              isManualEntry: true,
                            });
                            toast.success('New product line added');
                            refetch();
                          } catch (e) {
                            toast.error('Failed to add product line');
                          }
                        }}
                        variant="outline"
                        type="button"
                        size="sm"
                        className="border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 h-7 text-xs py-0 px-2"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Product Line
                      </Button>
                      <span className="text-[10px] text-slate-400 italic">
                        💡 Changes to product cells save automatically when clicking away (auto-save on blur).
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="mb-4">No items added</p>
                  {canEdit && (
                    <Button
                      onClick={async () => {
                        try {
                          await salesApi.addEnquiryItem(id, {
                            productName: 'New Product',
                            quantity: 1,
                            isManualEntry: true,
                          });
                          toast.success('New product line added');
                          refetch();
                        } catch (e) {
                          toast.error('Failed to add product line');
                        }
                      }}
                      variant="outline"
                      className="border-dashed border-indigo-300 text-indigo-600"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add First Product Line
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader><CardTitle>Related Tasks</CardTitle></CardHeader>
            <CardContent>
              {relatedTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead><TableHead>Task Name</TableHead>
                      <TableHead>Assigned To</TableHead><TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedTasks.map((task: any) => (
                      <TableRow key={task.taskId}>
                        <TableCell className="font-mono text-sm">{task.taskCode || task.taskId?.slice(0, 8)}</TableCell>
                        <TableCell>{task.taskName}</TableCell>
                        <TableCell>{task.assignedToUser?.name || '-'}</TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell><Badge className={getStatusColor(task.status)}>{task.status?.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell><Button asChild variant="ghost" size="sm"><Link href={`/dashboard/fms/${task.taskId}`}>View</Link></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No tasks created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="text-center py-12 text-gray-500"><FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No documents uploaded</p></CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Activity History</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Enquiry Created</p>
                  <p className="text-sm text-gray-500">{formatDate(enquiry.data.createdAt)}</p>
                </div>
              </div>
              {enquiry.data.status !== 'draft' && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium">Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(enquiry.data.updatedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remarks Dialog */}
      <Dialog open={remarksDialog.open} onOpenChange={(open) => setRemarksDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{remarksDialog.title}</DialogTitle>
            <DialogDescription>Add remarks for this action</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksDialog({ open: false, action: '', nextStatus: '', title: '' })}>Cancel</Button>
            <Button onClick={() => {
              if (remarksDialog.nextStatus === 'won') wonMutation.mutate(remarks);
              else statusMutation.mutate({ status: remarksDialog.nextStatus, remarks });
            }} isLoading={statusMutation.isPending || wonMutation.isPending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MIS Review Dialog */}
      <Dialog open={misReviewDialogOpen} onOpenChange={setMisReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm MIS Review Action: {misAction === 'approve' ? 'Approve Procurement' : 'Request Requote'}
            </DialogTitle>
            <DialogDescription>
              {misAction === 'approve'
                ? 'This will approve all procurement costs and move the enquiry to the Rate Calculation stage.'
                : `This will flag the selected product lines for a requote and notify the respective Purchase managers.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>MIS Remarks (Required)</Label>
              <Textarea
                placeholder="Enter review remarks..."
                value={misRemarks}
                onChange={(e) => setMisRemarks(e.target.value)}
                rows={3}
              />
            </div>
            {misAction === 'requote' && selectedItemsForRequote.length === 0 && (
              <p className="text-xs text-amber-600 font-medium">
                Note: No specific items were selected in the checkbox. The entire quotation list will be sent back for requoting.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMisReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={misAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              onClick={() => {
                if (!misRemarks.trim()) {
                  toast.error('Remarks are required for MIS Review');
                  return;
                }
                misReviewMutation.mutate({
                  action: misAction!,
                  remarks: misRemarks,
                  requoteItemIds: misAction === 'requote' ? selectedItemsForRequote : undefined,
                });
              }}
              disabled={misReviewMutation.isPending}
            >
              {misReviewMutation.isPending ? 'Submitting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Product Review Dialog ──────────────────────────────────────── */}
      <Dialog open={productReviewOpen} onOpenChange={setProductReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <Package className="h-5 w-5 text-amber-600" />
              Product MIS Review
            </DialogTitle>
            <DialogDescription>
              Review the product submitted by the Purchase team and either approve it (generates a SKU) or reject it.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product info */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{selectedProduct.tempProductName || selectedProduct.productName}</p>
                    <p className="text-sm text-slate-500">Source enquiry: <span className="font-medium">{selectedProduct.sourceEnquiryNo || 'N/A'}</span></p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">PENDING MIS</Badge>
                </div>
                {selectedProduct.remarks && (
                  <p className="text-sm text-slate-600 bg-white rounded p-2 border border-amber-200">
                    <strong>Purchase remarks:</strong> {selectedProduct.remarks}
                  </p>
                )}
              </div>

              {/* Action toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProductAction('approve')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${productAction === 'approve' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <CheckCircle className={`h-5 w-5 mb-1 ${productAction === 'approve' ? 'text-green-600' : 'text-slate-400'}`} />
                  <p className="font-semibold text-sm">Approve &amp; Generate SKU</p>
                </button>
                <button
                  onClick={() => setProductAction('reject')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${productAction === 'reject' ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <XCircle className={`h-5 w-5 mb-1 ${productAction === 'reject' ? 'text-red-500' : 'text-slate-400'}`} />
                  <p className="font-semibold text-sm">Reject Product</p>
                </button>
              </div>

              {/* Product form (only when approving) */}
              {productAction === 'approve' && (
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-slate-50">
                  <p className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Product Catalog Details (required for SKU generation)
                  </p>

                  <div>
                    <Label className="text-xs">Category <span className="text-red-500">*</span></Label>
                    <Select value={productForm.categoryId} onValueChange={v => setProductForm((p: any) => ({ ...p, categoryId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Segment <span className="text-red-500">*</span></Label>
                    <Select value={productForm.segmentId} onValueChange={v => setProductForm((p: any) => ({ ...p, segmentId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select segment" /></SelectTrigger>
                      <SelectContent>
                        {segments.map((s: any) => <SelectItem key={s.segmentId} value={s.segmentId}>{s.segmentName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Component Group <span className="text-red-500">*</span></Label>
                    <Select value={productForm.groupId} onValueChange={v => setProductForm((p: any) => ({ ...p, groupId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select group" /></SelectTrigger>
                      <SelectContent>
                        {groups.map((g: any) => <SelectItem key={g.groupId} value={g.groupId}>{g.groupName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Brand</Label>
                    <Select value={productForm.brandId} onValueChange={v => setProductForm((p: any) => ({ ...p, brandId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {brands.map((b: any) => <SelectItem key={b.brandId} value={b.brandId}>{b.brandName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">UOM</Label>
                    <Select value={productForm.uomId} onValueChange={v => setProductForm((p: any) => ({ ...p, uomId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select UOM" /></SelectTrigger>
                      <SelectContent>
                        {uoms.map((u: any) => <SelectItem key={u.uomId} value={u.uomId}>{u.uomName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">GST Rate</Label>
                    <Select value={productForm.gstRateId} onValueChange={v => setProductForm((p: any) => ({ ...p, gstRateId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select GST rate" /></SelectTrigger>
                      <SelectContent>
                        {gstRates.map((g: any) => <SelectItem key={g.gstRateId} value={g.gstRateId}>{g.rate}% – {g.description || g.gstCode}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Unit Size</Label>
                    <Input
                      className="mt-1"
                      placeholder="e.g. 500ml"
                      value={productForm.unitSize}
                      onChange={e => setProductForm((p: any) => ({ ...p, unitSize: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Units Per Carton</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      placeholder="e.g. 24"
                      value={productForm.unitsPerCarton}
                      onChange={e => setProductForm((p: any) => ({ ...p, unitsPerCarton: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Location</Label>
                    <Select value={productForm.locationId} onValueChange={v => setProductForm((p: any) => ({ ...p, locationId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                      <SelectContent>
                        {locations.map((l: any) => <SelectItem key={l.locationId || l.id} value={l.locationId || l.id}>{l.locationName || l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">CBM</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      step="0.001"
                      placeholder="e.g. 0.025"
                      value={productForm.cbmPerBox}
                      onChange={e => setProductForm((p: any) => ({ ...p, cbmPerBox: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <Label className="text-slate-700">
                  MIS Remarks {productAction === 'reject' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder={productAction === 'approve' ? 'Optional remarks...' : 'Reason for rejection...'}
                  value={productRemarks}
                  onChange={e => setProductRemarks(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProductReviewOpen(false)}>Cancel</Button>
            <Button
              className={productAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              disabled={productMisReviewMutation.isPending || (productAction === 'approve' && (!productForm.categoryId || !productForm.segmentId || !productForm.groupId))}
              onClick={() => {
                if (productAction === 'reject' && !productRemarks.trim()) {
                  toast.error('Rejection reason is required');
                  return;
                }
                productMisReviewMutation.mutate({
                  id: selectedProduct.productId,
                  body: {
                    action: productAction,
                    remarks: productRemarks,
                    ...productForm,
                  },
                });
              }}
            >
              {productMisReviewMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : productAction === 'approve' ? (
                <><CheckCircle className="h-4 w-4 mr-2" /> Approve &amp; Generate SKU</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" /> Reject Product</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Purchase: Create Product in Master Dialog ──────────────── */}
      <Dialog open={masterCreateOpen} onOpenChange={setMasterCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Package className="h-5 w-5 text-emerald-600" />
              Add Product to Master
            </DialogTitle>
            <DialogDescription>
              Product details are pre-fetched from the enquiry. Fill in the remaining details and save to Product Master.
            </DialogDescription>
          </DialogHeader>

          {masterCreateItem && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-sm text-slate-600">
                  Source: <span className="font-semibold">{enquiry.data.enquiryOrderNo || enquiry.data.enquiryNumber}</span>
                  {' — '}Original name: <span className="font-medium">{masterCreateItem.productName || masterCreateItem.manualProductName}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-slate-50">
                <p className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Basic Info</p>

                <div className="col-span-2">
                  <Label className="text-xs">Product Name <span className="text-red-500">*</span></Label>
                  <Input className="mt-1" value={masterCreateForm.productName} onChange={e => setMasterCreateForm((p: any) => ({ ...p, productName: e.target.value }))} />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea className="mt-1" rows={2} value={masterCreateForm.description} onChange={e => setMasterCreateForm((p: any) => ({ ...p, description: e.target.value }))} />
                </div>

                <div>
                  <Label className="text-xs">Category <span className="text-red-500">*</span></Label>
                  <Select value={masterCreateForm.categoryId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, categoryId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Segment <span className="text-red-500">*</span></Label>
                  <Select value={masterCreateForm.segmentId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, segmentId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select segment" /></SelectTrigger>
                    <SelectContent>
                      {segments.map((s: any) => <SelectItem key={s.segmentId} value={s.segmentId}>{s.segmentName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Component Group <span className="text-red-500">*</span></Label>
                  <Select value={masterCreateForm.groupId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, groupId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g: any) => <SelectItem key={g.groupId} value={g.groupId}>{g.groupName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Brand</Label>
                  <Select value={masterCreateForm.brandId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, brandId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b: any) => <SelectItem key={b.brandId} value={b.brandId}>{b.brandName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">UOM</Label>
                  <Select value={masterCreateForm.uomId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, uomId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select UOM" /></SelectTrigger>
                    <SelectContent>
                      {uoms.map((u: any) => <SelectItem key={u.uomId} value={u.uomId}>{u.uomName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">GST Rate</Label>
                  <Select value={masterCreateForm.gstRateId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, gstRateId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select GST rate" /></SelectTrigger>
                    <SelectContent>
                      {gstRates.map((g: any) => <SelectItem key={g.gstRateId} value={g.gstRateId}>{g.rate}% – {g.description || g.gstCode}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Location</Label>
                  <Select value={masterCreateForm.locationId} onValueChange={v => setMasterCreateForm((p: any) => ({ ...p, locationId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((l: any) => <SelectItem key={l.locationId || l.id} value={l.locationId || l.id}>{l.locationName || l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg bg-slate-50">
                <p className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Physical & Pricing</p>

                <div>
                  <Label className="text-xs">Unit Size</Label>
                  <Input className="mt-1" placeholder="e.g. 500ml" value={masterCreateForm.unitSize} onChange={e => setMasterCreateForm((p: any) => ({ ...p, unitSize: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Units Per Case</Label>
                  <Input className="mt-1" type="number" value={masterCreateForm.unitsPerCase} onChange={e => setMasterCreateForm((p: any) => ({ ...p, unitsPerCase: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">CBM Per Box</Label>
                  <Input className="mt-1" type="number" step="0.001" value={masterCreateForm.cbmPerBox} onChange={e => setMasterCreateForm((p: any) => ({ ...p, cbmPerBox: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input className="mt-1" type="number" step="0.01" value={masterCreateForm.weight} onChange={e => setMasterCreateForm((p: any) => ({ ...p, weight: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Packing Size</Label>
                  <Input className="mt-1" value={masterCreateForm.packingSize} onChange={e => setMasterCreateForm((p: any) => ({ ...p, packingSize: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">HS Code</Label>
                  <Input className="mt-1" value={masterCreateForm.hsCode} onChange={e => setMasterCreateForm((p: any) => ({ ...p, hsCode: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">MRP</Label>
                  <Input className="mt-1" type="number" step="0.01" value={masterCreateForm.mrp} onChange={e => setMasterCreateForm((p: any) => ({ ...p, mrp: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Buying Price</Label>
                  <Input className="mt-1" type="number" step="0.01" value={masterCreateForm.buyingPrice} onChange={e => setMasterCreateForm((p: any) => ({ ...p, buyingPrice: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Standard Cost</Label>
                  <Input className="mt-1" type="number" step="0.01" value={masterCreateForm.standardCost} onChange={e => setMasterCreateForm((p: any) => ({ ...p, standardCost: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">SKU will be auto-generated when you save.</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setMasterCreateOpen(false); setMasterCreateItem(null); }}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={masterCreateMutation.isPending || !masterCreateForm.productName || !masterCreateForm.categoryId || !masterCreateForm.segmentId || !masterCreateForm.groupId}
              onClick={() => {
                masterCreateMutation.mutate({
                  ...masterCreateForm,
                  isActive: true,
                });
              }}
            >
              {masterCreateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Save to Master</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Search Dialog for mapping in sales detail */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-2xl bg-white font-sans">
          <DialogHeader>
            <DialogTitle>Search Product from Master</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-10 text-xs h-9"
                autoFocus
                value={productSearchInput}
                onChange={(e) => setProductSearchInput(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {productsData?.data?.data?.map((product: any) => (
                <div
                  key={product.productId}
                  className="p-3 border rounded-lg hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                  onClick={() => handleProductSelect(product)}
                >
                  <div>
                    <span className="font-mono font-medium text-slate-800 text-xs">{product.sku}</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">{product.productName}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {product.category?.categoryName || 'No Category'}
                  </Badge>
                </div>
              ))}
              {(!productsData?.data?.data || productsData.data.data.length === 0) && (
                <div className="text-center text-gray-500 py-4 text-xs">No products found in masters</div>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCloseProductSearch}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EnquiryDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
      <EnquiryDetailContent params={params} />
    </Suspense>
  );
}
