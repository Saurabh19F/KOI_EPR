'use client';

import { useState, useMemo, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi, mastersApi } from '@/lib/api';
import '@/components/sales/SalesEnquiryGrid.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Package,
  ShoppingCart,
  Eye,
  XCircle,
  Search,
  Loader2,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

// --- Stat Card -------------------------------------------------------------
function StatCard({ title, value, icon: Icon, color, sub }: { title: string; value: number | string; icon: any; color: string; sub?: string }) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 group overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-105 transition-transform`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Status Badge -----------------------------------------------------------
function StatusBadge({ status }: { status?: string }) {
  const safeStatus = status || 'draft';
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    submitted: 'bg-blue-100 text-blue-700 border-blue-300',
    purchase_assigned: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    purchase_in_progress: 'bg-amber-100 text-amber-700 border-amber-300',
    purchase_completed: 'bg-teal-100 text-teal-700 border-teal-300',
    mis_review: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    mis_approved: 'bg-green-100 text-green-700 border-green-300',
    mis_requote_required: 'bg-red-100 text-red-700 border-red-300',
    rate_calculation: 'bg-purple-100 text-purple-700 border-purple-300',
    pending_mis_review: 'bg-amber-100 text-amber-700 border-amber-300',
    active: 'bg-green-100 text-green-700 border-green-300',
    inactive: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <Badge variant="outline" className={`${map[safeStatus] || 'bg-slate-100 text-slate-600'} text-xs font-medium`}>
      {safeStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </Badge>
  );
}

// --- Main Page Component ---------------------------------------------------
function MISContent() {
  const queryClient = useQueryClient();
  const [enquirySearch, setEnquirySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // --- Enquiry MIS Review States --
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [enquiryReviewOpen, setEnquiryReviewOpen] = useState(false);
  const [misAction, setMisAction] = useState<'approve' | 'requote'>('approve');
  const [misRemarks, setMisRemarks] = useState('');
  const [selectedItemsForRequote, setSelectedItemsForRequote] = useState<string[]>([]);

  // --- Product MIS Review States --
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productReviewOpen, setProductReviewOpen] = useState(false);
  const [productAction, setProductAction] = useState<'approve' | 'reject'>('approve');
  const [productRemarks, setProductRemarks] = useState('');
  const [productForm, setProductForm] = useState<any>({});

  // --- Search from Master States for mapping ---
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [activeItemForSearch, setActiveItemForSearch] = useState<any>(null);
  const [isNewItemMode, setIsNewItemMode] = useState(false); // true when adding NEW item from master

  // --- Fetch products for mapping ---
  const { data: productsData } = useQuery({
    queryKey: ['products-for-mapping', productSearchInput],
    queryFn: () => mastersApi.getProducts({ limit: 100, search: productSearchInput }),
    enabled: showProductSearch,
  });

  // --- Fetch reference data ---
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: mastersApi.getCategories });
  const { data: segmentsData } = useQuery({ queryKey: ['segments'], queryFn: mastersApi.getSegments });
  const { data: groupsData } = useQuery({ queryKey: ['groups'], queryFn: mastersApi.getGroups });
  const { data: brandsData } = useQuery({ queryKey: ['brands'], queryFn: mastersApi.getBrands });
  const { data: uomsData } = useQuery({ queryKey: ['uoms'], queryFn: mastersApi.getUoms });
  const { data: gstRatesData } = useQuery({ queryKey: ['gst-rates'], queryFn: mastersApi.getGstRates });
  const { data: locationsData } = useQuery({ queryKey: ['locations'], queryFn: mastersApi.getLocations });

  const categories = categoriesData?.data || [];
  const segments = segmentsData?.data || [];
  const groups = groupsData?.data || [];
  const brands = brandsData?.data || [];
  const uoms = uomsData?.data || [];
  const gstRates = gstRatesData?.data || [];
  const locations = locationsData?.data || [];

  // --- Fetch all enquiries in mis_review --
  const { data: enquiriesData, isLoading: loadingEnquiries, refetch: refetchEnquiries } = useQuery({
    queryKey: ['mis-enquiries'],
    queryFn: () => salesApi.getEnquiries({ status: 'mis_review', limit: 200 }),
    refetchInterval: 30000,
  });

  // --- Fetch enquiry items when one is selected --
  const { data: enquiryItemsData } = useQuery({
    queryKey: ['enquiry-items-mis', selectedEnquiry?.enquiryOrderId],
    queryFn: () => salesApi.getEnquiryItems(selectedEnquiry.enquiryOrderId),
    enabled: !!selectedEnquiry?.enquiryOrderId,
  });

  // --- Fetch products pending MIS review --
  const { data: pendingProductsData, isLoading: loadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['mis-pending-products'],
    queryFn: () => mastersApi.getPendingMisReviewProducts(),
    refetchInterval: 30000,
  });

  // --- Fetch pre-MIS tracking enquiries (Created -> Purchase -> Before MIS) ---
  const PRE_MIS_STATUSES = 'draft,submitted,punched,verified,purchase_pending,purchase_assigned,purchase_in_progress,purchase_completed,vendor_quote_pending';
  const { data: preMisData, isLoading: loadingPreMis, refetch: refetchPreMis } = useQuery({
    queryKey: ['pre-mis-enquiries'],
    queryFn: () => salesApi.getEnquiries({ status: PRE_MIS_STATUSES, limit: 300 }),
    refetchInterval: 30000,
  });

  // --- Fetch completed/reviewed enquiries ---
  const { data: completedEnquiriesData, isLoading: loadingCompletedEnquiries, refetch: refetchCompletedEnquiries } = useQuery({
    queryKey: ['mis-completed-enquiries'],
    queryFn: () => salesApi.getEnquiries({ status: 'mis_approved,rate_calculation,mis_requote_required', limit: 200 }),
    refetchInterval: 30000,
  });

  const enquiries = useMemo(() => Array.isArray(enquiriesData?.data?.data) ? enquiriesData.data.data : (Array.isArray(enquiriesData?.data) ? enquiriesData.data : []), [enquiriesData]);
  const pendingProducts = useMemo(() => Array.isArray(pendingProductsData?.data) ? pendingProductsData.data : [], [pendingProductsData]);
  const completedEnquiries = useMemo(() => Array.isArray(completedEnquiriesData?.data?.data) ? completedEnquiriesData.data.data : (Array.isArray(completedEnquiriesData?.data) ? completedEnquiriesData.data : []), [completedEnquiriesData]);
  const preMisEnquiries = useMemo(() => Array.isArray(preMisData?.data?.data) ? preMisData.data.data : (Array.isArray(preMisData?.data) ? preMisData.data : []), [preMisData]);

  const filteredPreMisEnquiries = useMemo(() =>
    preMisEnquiries.filter(e =>
      !enquirySearch ||
      e.enquiryOrderNo?.toLowerCase().includes(enquirySearch.toLowerCase()) ||
      e.buyerName?.toLowerCase().includes(enquirySearch.toLowerCase()) ||
      e.salesPersonName?.toLowerCase().includes(enquirySearch.toLowerCase())
    ), [preMisEnquiries, enquirySearch]);

  const filteredEnquiries = useMemo(() =>
    enquiries.filter(e =>
      !enquirySearch ||
      e.enquiryOrderNo?.toLowerCase().includes(enquirySearch.toLowerCase()) ||
      e.buyerName?.toLowerCase().includes(enquirySearch.toLowerCase())
    ), [enquiries, enquirySearch]);

  const filteredProducts = useMemo(() =>
    pendingProducts.filter((p: any) =>
      !productSearch ||
      p.productName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.tempProductName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ), [pendingProducts, productSearch]);

  const filteredCompletedEnquiries = useMemo(() =>
    completedEnquiries.filter(e =>
      !enquirySearch ||
      e.enquiryOrderNo?.toLowerCase().includes(enquirySearch.toLowerCase()) ||
      e.buyerName?.toLowerCase().includes(enquirySearch.toLowerCase())
    ), [completedEnquiries, enquirySearch]);

  // --- Mutations ----------------------------------------------------------
  const enquiryMisReviewMutation = useMutation({
    mutationFn: ({ id, action, remarks, requoteItemIds }: any) =>
      salesApi.misReview(id, action, remarks, requoteItemIds),
    onSuccess: () => {
      toast.success(misAction === 'approve' ? '✅ Enquiry approved for Rate Calculation' : '🔄 Requote requested from Purchase team');
      setEnquiryReviewOpen(false);
      setMisRemarks('');
      setSelectedItemsForRequote([]);
      setSelectedEnquiry(null);
      queryClient.invalidateQueries({ queryKey: ['mis-enquiries'] });
      refetchEnquiries();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'MIS review failed'),
  });

  const productMisReviewMutation = useMutation({
    mutationFn: ({ id, body }: any) => mastersApi.misReviewProduct(id, body),
    onSuccess: (_, vars: any) => {
      toast.success(vars.body.action === 'approve' ? '✅ Product approved and SKU generated' : '❌ Product rejected');
      setProductReviewOpen(false);
      setProductRemarks('');
      setProductForm({});
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['mis-pending-products'] });
      refetchProducts();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Product review failed'),
  });

  // --- Open enquiry review dialog --
  const openEnquiryReview = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setMisAction('approve');
    setMisRemarks('');
    setSelectedItemsForRequote([]);
    setEnquiryReviewOpen(true);
  };

  // --- Open product review dialog --
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

  const toggleItemForRequote = (itemId: string) => {
    setSelectedItemsForRequote(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const enquiryItems = enquiryItemsData?.data || [];

  const handleUpdateItemField = async (itemId: string, field: string, value: any) => {
    try {
      await salesApi.updateEnquiryItem(itemId, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['enquiry-items-mis', selectedEnquiry?.enquiryOrderId] });
    } catch (error) {
      toast.error('Failed to update product details');
    }
  };

  const handleProductSelect = async (product: any) => {
    try {
      if (isNewItemMode) {
        // Create a NEW enquiry item using the master product's details
        await salesApi.addEnquiryItem(selectedEnquiry.enquiryOrderId, {
          productId: product.productId,
          masterProductId: product.productId,
          sku: product.sku,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.category?.categoryName || '',
          brandId: product.brandId,
          brandName: product.brand?.brandName || '',
          unitSize: product.unitSize || '',
          unitPerCarton: product.unitsPerCarton || 1,
          cbmPerBox: product.cbmPerBox || 0,
          quantity: 1,
          isManualEntry: false,
          masterStatus: 'master_product',
        });
        toast.success('Product added from Master successfully');
      } else {
        if (!activeItemForSearch) return;
        await salesApi.updateEnquiryItem(activeItemForSearch.itemId, {
          productId: product.productId,
          masterProductId: product.productId,
          sku: product.sku,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.category?.categoryName || '',
          brandId: product.brandId,
          brandName: product.brand?.brandName || '',
          unitSize: product.unitSize || '',
          unitPerCarton: product.unitsPerCarton || 1,
          isManualEntry: false,
          masterStatus: 'master_product',
        });
        toast.success('Product details mapped from Master successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['enquiry-items-mis', selectedEnquiry?.enquiryOrderId] });
    } catch (error) {
      toast.error('Failed to map product details from Master');
    } finally {
      setShowProductSearch(false);
      setProductSearchInput('');
      setActiveItemForSearch(null);
      setIsNewItemMode(false);
    }
  };

  const handleCloseProductSearch = () => {
    setShowProductSearch(false);
    setProductSearchInput('');
    setActiveItemForSearch(null);
  };

  // --- Stats ---------------------------------------------------------------
  const stats = [
    {
      title: 'Enquiries Awaiting MIS',
      value: enquiries.length,
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      sub: 'Require procurement review',
    },
    {
      title: 'Products Pending Approval',
      value: pendingProducts.length,
      icon: Package,
      color: 'from-amber-500 to-amber-600',
      sub: 'Submitted by Purchase team',
    },
    {
      title: 'Approved Today',
      value: enquiries.filter((e: any) => {
        const today = new Date().toDateString();
        return e.misReviewedAt && new Date(e.misReviewedAt).toDateString() === today;
      }).length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      sub: 'Moved to Rate Calculation',
    },
    {
      title: 'Total Items to Verify',
      value: enquiries.reduce((acc: number, e: any) => acc + (e.itemCount || 0), 0),
      icon: Layers,
      color: 'from-blue-500 to-blue-600',
      sub: 'Line items across all enquiries',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            MIS Review Panel
          </h1>
          <p className="text-slate-500 mt-1">
            Verify procurement costs and approve enquiries for rate calculation. Review &amp; approve new products.
          </p>
        </div>
        <button
          onClick={() => { refetchEnquiries(); refetchProducts(); refetchCompletedEnquiries(); refetchPreMis(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enquiries">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="pre_mis" className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Pre-MIS Status Tracker
            {preMisEnquiries.length > 0 && (
              <Badge className="bg-blue-600 text-white text-xs ml-1">{preMisEnquiries.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Enquiry Review
            {enquiries.length > 0 && (
              <Badge className="bg-indigo-600 text-white text-xs ml-1">{enquiries.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Approval
            {pendingProducts.length > 0 && (
              <Badge className="bg-amber-500 text-white text-xs ml-1">{pendingProducts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Reviews
            {completedEnquiries.length > 0 && (
              <Badge className="bg-emerald-600 text-white text-xs ml-1">{completedEnquiries.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- Pre-MIS Tracker Tab (Live Status Before MIS) ---------------- */}
        <TabsContent value="pre_mis" className="mt-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Pre-MIS Enquiries Status Tracker
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tracks Sales Enquiries from Creation &amp; Purchase Assignment before reaching MIS Review.
                  </p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search enquiry, buyer or sales..."
                    className="pl-9 text-xs"
                    value={enquirySearch}
                    onChange={e => setEnquirySearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPreMis ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-3 text-slate-500">Loading live status tracker...</span>
                </div>
              ) : filteredPreMisEnquiries.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No pre-MIS enquiries found</p>
                  <p className="text-slate-400 text-sm mt-1">Newly created sales enquiries will automatically show here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead className="font-semibold text-slate-700">Enquiry Ref.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Buyer / Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Sales Person</TableHead>
                      <TableHead className="font-semibold text-slate-700">Current Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Purchase Progress</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreMisEnquiries.map((enquiry: any) => {
                      const totalItems = enquiry.items?.length || enquiry.itemCount || 0;
                      const isEnquiryPurchaseComplete = enquiry.status === 'purchase_completed' || enquiry.status === 'mis_review' || enquiry.status === 'mis_approved' || enquiry.status === 'rate_calculation';

                      let submittedItems = 0;
                      if (enquiry.submittedItemCount !== undefined && enquiry.submittedItemCount !== null) {
                        submittedItems = Number(enquiry.submittedItemCount);
                      } else if (enquiry.items && Array.isArray(enquiry.items)) {
                        submittedItems = enquiry.items.filter((it: any) => it.purchaseStatus === 'submitted' || it.purchaseStatus === 'completed').length;
                      }

                      if (isEnquiryPurchaseComplete && submittedItems === 0 && totalItems > 0) {
                        submittedItems = totalItems;
                      }

                      const pendingItems = Math.max(0, totalItems - submittedItems);
                      const isComplete = totalItems > 0 && submittedItems === totalItems;

                      return (
                        <TableRow key={enquiry.enquiryOrderId || enquiry.enquiryId} className="hover:bg-blue-50/20 transition-colors border-slate-100">
                          <TableCell className="font-mono font-semibold text-slate-900">
                            {enquiry.enquiryOrderNo || enquiry.enquiryNumber || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium">
                            {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-slate-900 text-sm block">
                                {enquiry.buyerName || '-'}
                              </span>
                              {enquiry.buyerCode && (
                                <span className="text-xs text-slate-500 font-mono">
                                  {enquiry.buyerCode}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-medium">
                            {enquiry.salesPersonName || enquiry.createdByUser?.name || '-'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={enquiry.status} />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 max-w-[140px]">
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className={isComplete ? 'text-emerald-700' : 'text-slate-600'}>
                                  {isComplete ? 'Ready for MIS' : `${submittedItems}/${totalItems} Submitted`}
                                </span>
                                <span className="text-slate-400">
                                  {totalItems > 0 ? Math.round((submittedItems / totalItems) * 100) : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isComplete ? 'bg-emerald-500' : submittedItems > 0 ? 'bg-blue-500' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${totalItems > 0 ? (submittedItems / totalItems) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {submittedItems > 0 && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5">
                                  ✓ {submittedItems} Submitted
                                </Badge>
                              )}
                              {pendingItems > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0 px-1.5">
                                  ⏳ {pendingItems} Pending
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/sales/${enquiry.enquiryOrderId || enquiry.enquiryId}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200 hover:bg-slate-50">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Track &amp; View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Enquiry Review Tab ---------------------------------------- */}
        <TabsContent value="enquiries" className="mt-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Enquiries Pending MIS Review
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search enquiry or buyer..."
                    className="pl-9"
                    value={enquirySearch}
                    onChange={e => setEnquirySearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingEnquiries ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <span className="ml-3 text-slate-500">Loading enquiries...</span>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No enquiries pending MIS review</p>
                  <p className="text-slate-400 text-sm mt-1">All caught up! Enquiries will appear here once purchase is completed.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Enquiry No.</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Sales Person</TableHead>
                      <TableHead>Enquiry Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries.map((enquiry: any) => (
                      <TableRow key={enquiry.enquiryOrderId} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono font-medium text-indigo-600 hover:underline">
                          {enquiry.enquiryOrderNo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{enquiry.buyerName || '-'}</p>
                            <p className="text-xs text-slate-400">{enquiry.buyerCode}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{enquiry.salesPersonName || '-'}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(enquiry.enquiryDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {enquiry.itemCount || 0} items
                          </Badge>
                        </TableCell>
                        <TableCell><StatusBadge status={enquiry.status} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => openEnquiryReview(enquiry)}
                            >
                              <Activity className="h-3.5 w-3.5 mr-1.5" />
                              Review
                            </Button>
                            <Link href={`/dashboard/sales/${enquiry.enquiryOrderId}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Completed Reviews Tab --------------------------------------- */}
        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Completed MIS Reviews
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search enquiry or buyer..."
                    className="pl-9"
                    value={enquirySearch}
                    onChange={e => setEnquirySearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCompletedEnquiries ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <span className="ml-3 text-slate-500">Loading completed reviews...</span>
                </div>
              ) : filteredCompletedEnquiries.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No completed reviews found</p>
                  <p className="text-slate-400 text-sm mt-1">Historically approved or requoted enquiries will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Enquiry No.</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Sales Person</TableHead>
                      <TableHead>Enquiry Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompletedEnquiries.map((enquiry: any) => (
                      <TableRow key={enquiry.enquiryOrderId} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono font-medium text-indigo-600 hover:underline">
                          {enquiry.enquiryOrderNo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{enquiry.buyerName || '-'}</p>
                            <p className="text-xs text-slate-400">{enquiry.buyerCode}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{enquiry.salesPersonName || '-'}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(enquiry.enquiryDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {enquiry.itemCount || 0} items
                          </Badge>
                        </TableCell>
                        <TableCell><StatusBadge status={enquiry.status} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/sales/${enquiry.enquiryOrderId}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Product Approval Tab --------------------------------------- */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Products Pending MIS Approval
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search product or SKU..."
                    className="pl-9"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="ml-3 text-slate-500">Loading products...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No products pending approval</p>
                  <p className="text-slate-400 text-sm mt-1">Products submitted by the Purchase team will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU (Temp)</TableHead>
                      <TableHead>Source Enquiry</TableHead>
                      <TableHead>Reviewed By Purchase</TableHead>
                      <TableHead>Submitted / Added At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: any) => (
                      <TableRow key={product.productId} className="hover:bg-amber-50/30 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">
                              {product.tempProductName || product.productName}
                            </p>
                            {product.tempProductName && product.productName !== product.tempProductName && (
                              <p className="text-xs text-slate-400">Mapped: {product.productName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {product.sku || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{product.sourceEnquiryNo || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{product.purchasePersonName || '-'}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(product.reviewedAt || product.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => openProductReview(product)}
                          >
                            <Package className="h-3.5 w-3.5 mr-1.5" />
                            Approve / Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Enquiry Review Dialog ---------------------------------------- */}
      <Dialog open={enquiryReviewOpen} onOpenChange={setEnquiryReviewOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col p-6 gap-4 overflow-hidden bg-white">
          <DialogHeader className="space-y-1 shrink-0 border-b pb-3">
            <DialogTitle className="text-slate-900 font-bold text-xl flex items-center justify-between">
              <span>MIS Review: <span className="text-indigo-600 font-mono">{selectedEnquiry?.enquiryOrderNo}</span></span>
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                {selectedEnquiry?.status?.replace(/_/g, ' ')}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Verify procurement costs and product assignments. Approve to move this enquiry to Rate Calculation, or request a requote for problematic items.
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Buyer</p>
                  <p className="font-semibold text-slate-800">{selectedEnquiry.buyerName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Sales Person</p>
                  <p className="font-semibold text-slate-800">{selectedEnquiry.createdByUser?.name || selectedEnquiry.salesPersonName || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Total Items</p>
                  <p className="font-semibold text-slate-800">{enquiryItems.length || selectedEnquiry.itemCount || 0}</p>
                </div>
              </div>

              {/* Items table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-semibold text-slate-700">Product Lines (Purchase Quotes)</h3>
                  {misAction === 'requote' && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      ✓ Check items to flag for requote. Leave unchecked to approve all.
                    </p>
                  )}
                </div>
                {enquiryItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="sales-grid-container max-h-[360px]">
                      <table className="sales-grid-table">
                        <thead>
                          <tr>
                            {misAction === 'requote' && (
                              <th className="w-16 text-center">Requote?</th>
                            )}
                            <th className="sales-sticky-col-num-hdr w-10 text-center">#</th>
                            <th className="sales-sticky-col-sku-hdr min-w-[150px]">Product Code (SKU)</th>
                            <th className="min-w-[200px]">Product Name</th>
                            <th className="min-w-[120px]">Purchase Status</th>
                            <th className="min-w-[120px]">Category</th>
                            <th className="min-w-[120px]">Brand</th>
                            <th className="min-w-[100px]">Unit Size</th>
                            <th className="w-24 text-right">Units Per Case</th>
                            <th className="w-24 text-right">Quantity</th>
                            <th className="w-28 text-right">Buying Price</th>
                            <th className="min-w-[200px]">Remarks</th>
                            <th className="w-24 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enquiryItems.map((item: any, index: number) => (
                            <tr
                              key={item.itemId || index}
                              className={`sales-grid-row ${
                                selectedItemsForRequote.includes(item.itemId) ? 'bg-red-50' : ''
                              }`}
                            >
                              {misAction === 'requote' && (
                                <td className="px-2 py-1 text-center">
                                  <input
                                    type="checkbox"
                                    title="Select item for requote"
                                    checked={selectedItemsForRequote.includes(item.itemId)}
                                    onChange={() => toggleItemForRequote(item.itemId)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
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
                                  />
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
                                </div>
                              </td>
                              <td className="p-0.5">
                                <input
                                  type="text"
                                  className="w-full border-none bg-transparent outline-none px-1.5 py-1 text-xs"
                                  defaultValue={item.productName || item.manualProductName || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.productName || item.manualProductName || '')) {
                                      handleUpdateItemField(item.itemId, 'productName', e.target.value);
                                    }
                                  }}
                                  placeholder="Product Name"
                                />
                              </td>
                              <td className="px-2 py-1 text-sm">
                                <Badge variant="outline" className={`text-xs ${item.purchaseStatus === 'completed' || item.purchaseStatus === 'submitted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
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
                                />
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
                                />
                              </td>
                              <td className="p-0.5">
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
                                />
                              </td>
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
                                />
                              </td>
                              <td className="p-0.5">
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
                                />
                              </td>
                              <td className="p-1 text-center font-sans">
                                <div className="flex items-center justify-center gap-1">
                                  {(!item.productId || item.sku === 'NOT IN MASTER' || item.sku?.startsWith('TEMP-') || item.categoryName === 'NOT IN MASTER' || item.isManualEntry) && (
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
                                          sourceEnquiryNo: selectedEnquiry.enquiryOrderNo,
                                        });
                                      }}
                                    >
                                      + Master
                                    </Button>
                                  )}
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
                                          queryClient.invalidateQueries({ queryKey: ['enquiry-items-mis', selectedEnquiry?.enquiryOrderId] });
                                        } catch (e) {
                                          toast.error('Failed to delete item');
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center bg-white border border-slate-200 rounded-md p-1.5 shadow-sm shrink-0">
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            try {
                              await salesApi.addEnquiryItem(selectedEnquiry.enquiryOrderId, {
                                productName: 'New Product',
                                quantity: 1,
                                isManualEntry: true,
                              });
                              toast.success('New product line added');
                              queryClient.invalidateQueries({ queryKey: ['enquiry-items-mis', selectedEnquiry?.enquiryOrderId] });
                            } catch (e) {
                              toast.error('Failed to add product line');
                            }
                          }}
                          variant="outline"
                          type="button"
                          size="sm"
                          className="border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 h-7 text-xs py-0 px-2"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Blank Line
                        </Button>
                        <Button
                          onClick={() => {
                            setIsNewItemMode(true);
                            setProductSearchInput('');
                            setShowProductSearch(true);
                          }}
                          variant="outline"
                          type="button"
                          size="sm"
                          className="border-dashed border-emerald-400 hover:border-emerald-500 text-emerald-700 h-7 text-xs py-0 px-2"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add from Master
                        </Button>
                      </div>
                      <span className="text-[10px] text-slate-400 italic">
                        💡 Changes to product cells save automatically when clicking away (auto-save on blur).
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-sm">Loading items...</p>
                  </div>
                )}
              </div>

              {/* Action selection */}
              <div className="flex justify-center gap-2 max-w-md mx-auto w-full">
                <button
                  onClick={() => setMisAction('approve')}
                  className={`w-1/2 p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${misAction === 'approve' ? 'border-green-500 bg-green-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <CheckCircle className={`h-4 w-4 shrink-0 ${misAction === 'approve' ? 'text-green-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-semibold text-[11px] text-slate-800 leading-tight">Approve Procurement</p>
                    <p className="text-[9px] text-slate-500 leading-tight">Move to Rate Calculation.</p>
                  </div>
                </button>
                <button
                  onClick={() => setMisAction('requote')}
                  className={`w-1/2 p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${misAction === 'requote' ? 'border-red-400 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${misAction === 'requote' ? 'text-red-500' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-semibold text-[11px] text-slate-800 leading-tight">Request Requote</p>
                    <p className="text-[9px] text-slate-500 leading-tight">Send back to Purchase.</p>
                  </div>
                </button>
              </div>

              {/* Remarks */}
              <div>
                <Label className="text-slate-700">
                  MIS Remarks <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder={misAction === 'approve' ? 'e.g. All procurement costs verified and approved.' : 'e.g. Item 3 pricing is too high, needs requote from alternate vendor.'}
                  value={misRemarks}
                  onChange={e => setMisRemarks(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {misAction === 'requote' && selectedItemsForRequote.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    No items selected — the <strong>entire quotation</strong> will be sent back for requoting. Use checkboxes in the table above to flag specific items.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setEnquiryReviewOpen(false)}>Cancel</Button>
            <Button
              className={misAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              disabled={!misRemarks.trim() || enquiryMisReviewMutation.isPending}
              onClick={() => {
                if (!misRemarks.trim()) {
                  toast.error('Remarks are required');
                  return;
                }
                enquiryMisReviewMutation.mutate({
                  id: selectedEnquiry.enquiryOrderId,
                  action: misAction,
                  remarks: misRemarks,
                  requoteItemIds: misAction === 'requote' ? selectedItemsForRequote : undefined,
                });
              }}
            >
              {enquiryMisReviewMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : misAction === 'approve' ? (
                <><CheckCircle className="h-4 w-4 mr-2" /> Approve &amp; Move to Rate Calculation</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Request Requote {selectedItemsForRequote.length > 0 ? `(${selectedItemsForRequote.length} items)` : '(All items)'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Product Review Dialog ---------------------------------------- */}
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
                        {locations.map((l: any) => <SelectItem key={l.id || l.locationId} value={l.id || l.locationId}>{l.name || l.locationName}</SelectItem>)}
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

      {/* Product Search Dialog for mapping in MIS review */}
      <Dialog open={showProductSearch} onOpenChange={(open) => { if (!open) { setShowProductSearch(false); setProductSearchInput(''); setActiveItemForSearch(null); setIsNewItemMode(false); } }}>
        <DialogContent className="max-w-2xl bg-white font-sans">
          <DialogHeader>
            <DialogTitle>
              {isNewItemMode ? '➕ Add Product from Master' : '🔍 Map Existing Product to Master'}
            </DialogTitle>
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

export default function MISPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-slate-500">Loading MIS Panel...</div>}>
      <MISContent />
    </Suspense>
  );
}

