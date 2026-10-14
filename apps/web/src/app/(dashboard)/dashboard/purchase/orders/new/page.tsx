'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { purchaseOrderApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Search, X, Building2, Phone, Mail, MapPin, CreditCard, User, FileText, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const YELLOW_CELL = 'bg-yellow-100 border border-yellow-300';

interface POItem {
  id: string;
  productName: string;
  productCode: string;
  hsnCode: string;
  uomName: string;
  orderQtyPerCase: number;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  remark: string;
  leadTimeDays: number;
  noNeed: boolean;
  enquiryNo: string;
  quotedPrice: number;
  approvedByJatinSir: string;
  currentStock: number;
  indentQty: string;
  balanceQty: number;
}

function createEmptyItem(): POItem {
  return {
    id: crypto.randomUUID(),
    productName: '',
    productCode: '',
    hsnCode: '',
    uomName: 'PCS',
    orderQtyPerCase: 0,
    quantity: 0,
    unitPrice: 0,
    gstRate: 18,
    remark: '',
    leadTimeDays: 0,
    noNeed: false,
    enquiryNo: '',
    quotedPrice: 0,
    approvedByJatinSir: '',
    currentStock: 0,
    indentQty: '',
    balanceQty: 0,
  };
}

function calcTaxableAmount(item: POItem) {
  return item.quantity * item.unitPrice;
}

function calcGstAmount(item: POItem) {
  return calcTaxableAmount(item) * (item.gstRate / 100);
}

function calcTotalAmount(item: POItem) {
  return calcTaxableAmount(item) + calcGstAmount(item);
}

function InfoField({ label, value, icon: Icon }: { label: string; value?: string; icon?: any }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const fromIds = searchParams.get('from')?.split(',').filter(Boolean) || [];

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const [vendorCode, setVendorCode] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [purchasePerson, setPurchasePerson] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [freightTerm, setFreightTerm] = useState('');
  const [location, setLocation] = useState('');
  const [salesPersonName, setSalesPersonName] = useState('');
  const [salesPersonId, setSalesPersonId] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('');

  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [billingAddress, setBillingAddress] = useState('KRISHNA OVERSEAS INC\nDelhi, India');
  const [shippingAddress, setShippingAddress] = useState('KRISHNA OVERSEAS INC\nDelhi, India');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Delivery within the specified lead time.\n2. Payment as per agreed terms.\n3. Quality must meet specifications.\n4. Any damage during transit is the supplier\'s responsibility.'
  );
  const [soNo, setSoNo] = useState('');
  const [enquiryNo, setEnquiryNo] = useState('');
  const [items, setItems] = useState<POItem[]>([createEmptyItem()]);
  const [sourcePOsLoaded, setSourcePOsLoaded] = useState(false);

  const sourcePoQueries = useQuery({
    queryKey: ['source-pos', fromIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        fromIds.map((id) => purchaseOrderApi.getOrder(id).then((r) => r.data))
      );
      return results;
    },
    enabled: fromIds.length > 0,
  });

  useEffect(() => {
    if (sourcePoQueries.data && !sourcePOsLoaded) {
      const allItems: POItem[] = [];
      const soRefs: string[] = [];
      const enqRefs: string[] = [];

      sourcePoQueries.data.forEach((po: any) => {
        if (po.soNo) soRefs.push(po.soNo);
        if (po.enquiryNo) enqRefs.push(po.enquiryNo);

        (po.items || []).forEach((item: any) => {
          allItems.push({
            id: crypto.randomUUID(),
            productName: item.productName || '',
            productCode: item.productCode || '',
            hsnCode: item.hsnCode || '',
            uomName: item.uomName || 'PCS',
            orderQtyPerCase: Number(item.orderQtyPerCase || item.quantity || 0),
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            gstRate: Number(item.gstRate || 0),
            remark: item.remark || item.description || '',
            leadTimeDays: Number(item.leadTimeDays || 0),
            noNeed: item.noNeed || false,
            enquiryNo: item.enquiryNo || po.enquiryNo || '',
            quotedPrice: Number(item.quotedPrice || 0),
            approvedByJatinSir: item.approvedByJatinSir || '',
            currentStock: Number(item.currentStock || 0),
            indentQty: item.indentQty || '',
            balanceQty: Number(item.balanceQty || 0),
          });
        });
      });

      if (allItems.length > 0) {
        setItems(allItems);
      }
      if (soRefs.length > 0) setSoNo(soRefs.join(', '));
      if (enqRefs.length > 0) setEnquiryNo(enqRefs.join(', '));
      setSourcePOsLoaded(true);
    }
  }, [sourcePoQueries.data, sourcePOsLoaded]);

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', vendorSearch],
    queryFn: () => mastersApi.getVendors({ limit: 50, search: vendorSearch || undefined }),
  });
  const vendors = vendorsData?.data?.data || [];

  const { data: vendorOrdersData } = useQuery({
    queryKey: ['vendor-orders', selectedVendor?.vendorId],
    queryFn: () => purchaseOrderApi.getOrdersByVendor(selectedVendor.vendorId),
    enabled: !!selectedVendor?.vendorId,
  });
  const vendorOrders = vendorOrdersData?.data || [];

  const handleOrderSelect = async (order: any) => {
    setSelectedOrderId(order.orderId);
    setShowOrderDropdown(false);
    setEnquiryNo(order.enquiryNo || '');
    setSoNo(order.soNo || '');
    setPaymentTerm(order.paymentTermsName || '');
    if (order.salesPersonName) setSalesPersonName(order.salesPersonName);
    if (order.salesPersonId) setSalesPersonId(order.salesPersonId);
    if (order.location) setLocation(order.location);
    if (order.freightTerm) setFreightTerm(order.freightTerm);

    try {
      const res = await purchaseOrderApi.getOrder(order.orderId);
      const po = res.data;
      if (po?.items?.length > 0) {
        const loadedItems: POItem[] = po.items.map((item: any) => ({
          id: crypto.randomUUID(),
          productName: item.productName || '',
          productCode: item.productCode || '',
          hsnCode: item.hsnCode || '',
          uomName: item.uomName || 'PCS',
          orderQtyPerCase: Number(item.orderQty || item.quantity || 0),
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          gstRate: Number(item.gstRate || 0),
          remark: item.remark || item.description || '',
          leadTimeDays: Number(item.leadTimeDays || 0),
          noNeed: item.noNeed || false,
          enquiryNo: item.enquiryNo || po.enquiryNo || '',
          quotedPrice: Number(item.quotedPrice || 0),
          approvedByJatinSir: item.approvedBy || '',
          currentStock: Number(item.currentStock || 0),
          indentQty: '',
          balanceQty: Number(item.balanceQty || 0),
        }));
        setItems(loadedItems);
      }
    } catch {
      toast.error('Failed to load order products');
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await purchaseOrderApi.createOrder(data);
      const orderId = res.data?.orderId || res.data?.purchaseOrderId;
      if (orderId) {
        await purchaseOrderApi.submitForApproval({ orderId });
      }
      return res;
    },
    onSuccess: () => {
      const hasHigherPrice = items.some(item => {
        const up = Number(item.unitPrice || 0);
        const qp = Number(item.quotedPrice || 0);
        return qp > 0 && up > qp;
      });
      if (hasHigherPrice) {
        toast.success('Purchase order created & sent for approval (price exceeds quoted price)');
      } else {
        toast.success('Purchase order created & auto-approved');
      }
      router.push('/dashboard/purchase/orders');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to create PO'),
  });

  const handleVendorSelect = (vendor: any) => {
    setSelectedVendor(vendor);
    setVendorCode(vendor.vendorCode || '');
    setVendorGstin(vendor.gstNumber || vendor.gstin || '');
    if (vendor.purchasePerson) setPurchasePerson(vendor.purchasePerson);
    if (vendor.address) {
      const fullAddress = [vendor.address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ');
      setBillingAddress(fullAddress);
      setShippingAddress(fullAddress);
    }
    setVendorSearch('');
    setShowVendorDropdown(false);
  };

  const clearVendor = () => {
    setSelectedVendor(null);
    setVendorCode('');
    setVendorGstin('');
    setPurchasePerson('');
    setVendorSearch('');
    setShowVendorDropdown(false);
    setSelectedOrderId('');
    setShowOrderDropdown(false);
    setSalesPersonName('');
    setSalesPersonId('');
    setFreightTerm('');
    setLocation('');
    setPaymentTerm('');
    setItems([createEmptyItem()]);
  };

  const addItem = () => setItems([...items, createEmptyItem()]);

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const subtotal = items.reduce((sum, item) => sum + calcTaxableAmount(item), 0);
  const totalGst = items.reduce((sum, item) => sum + calcGstAmount(item), 0);
  const grandTotal = subtotal + totalGst;

  const handleSubmit = () => {
    const vendorName = selectedVendor?.vendorName || vendorSearch;
    if (!vendorName) { toast.error('Vendor is required'); return; }
    const validItems = items.filter((item) => item.productName && item.quantity > 0);
    if (validItems.length === 0) { toast.error('Add at least one valid item'); return; }

    createMutation.mutate({
      vendorId: selectedVendor?.vendorId || undefined,
      vendorName,
      vendorCode: vendorCode || undefined,
      vendorGstin: vendorGstin || undefined,
      purchasePerson: purchasePerson || undefined,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      billingAddress,
      shippingAddress,
      notes: notes || undefined,
      termsAndConditions: termsAndConditions || undefined,
      soNo: soNo || undefined,
      enquiryNo: enquiryNo || undefined,
      freightTerm: freightTerm || undefined,
      location: location || undefined,
      salesPersonId: salesPersonId || undefined,
      salesPersonName: salesPersonName || undefined,
      items: validItems.map((item, idx) => ({
        lineNumber: idx + 1,
        productName: item.productName,
        productCode: item.productCode || undefined,
        hsnCode: item.hsnCode || undefined,
        uomName: item.uomName || 'PCS',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate || 0),
        description: item.remark || undefined,
        leadTimeDays: Number(item.leadTimeDays) || undefined,
        noNeed: item.noNeed || false,
        orderQtyPerCase: Number(item.orderQtyPerCase) || undefined,
        indentQty: item.indentQty || undefined,
        quotedPrice: Number(item.quotedPrice) || undefined,
        approvedByJatinSir: item.approvedByJatinSir || undefined,
        currentStock: Number(item.currentStock) || undefined,
        balanceQty: Number(item.balanceQty) || undefined,
      })),
    });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/purchase/orders"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="text-gray-500">
            {fromIds.length > 0
              ? `Creating from ${fromIds.length} selected PO(s) — products pre-filled`
              : 'Create a manual purchase order'}
          </p>
        </div>
      </div>

      {sourcePoQueries.isLoading && fromIds.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Loading products from selected purchase orders...</span>
          </CardContent>
        </Card>
      )}

      {/* Vendor Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Vendor Details
            </CardTitle>
            {selectedVendor && (
              <Button variant="ghost" size="sm" onClick={clearVendor} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                <X className="h-4 w-4 mr-1" /> Change Vendor
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedVendor ? (
            <div className="space-y-4">
              {/* Vendor Search */}
              <div className="relative">
                <Label>Search Vendor *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchRef}
                    value={vendorSearch}
                    onChange={(e) => {
                      setVendorSearch(e.target.value);
                      setShowVendorDropdown(true);
                    }}
                    onFocus={() => setShowVendorDropdown(true)}
                    placeholder="Search vendor by name, code, or GSTIN..."
                    className="pl-9"
                  />
                </div>
                {showVendorDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {vendors.length > 0 ? (
                      vendors.map((v: any) => (
                        <button
                          key={v.vendorId}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                          onClick={() => handleVendorSelect(v)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">{v.vendorName}</span>
                            {v.vendorCode && (
                              <Badge variant="secondary" className="text-xs">{v.vendorCode}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                            {(v.gstNumber || v.gstin) && <span>GSTIN: {v.gstNumber || v.gstin}</span>}
                            {v.contactPerson && <span>Contact: {v.contactPerson}</span>}
                            {v.phone && <span>{v.phone}</span>}
                            {v.city && <span>{v.city}</span>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        {vendorSearch ? 'No vendors found — type manually below' : 'Type to search vendors...'}
                      </div>
                    )}
                  </div>
                )}
                {showVendorDropdown && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowVendorDropdown(false)} />
                )}
              </div>

              {/* Manual Entry Fields */}
              {vendorSearch && !selectedVendor && (
                <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-medium">Vendor not in master? Enter details manually:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Vendor Name</Label>
                      <Input value={vendorSearch} readOnly className="bg-white" />
                    </div>
                    <div>
                      <Label>Vendor Code</Label>
                      <Input value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} placeholder="Code" />
                    </div>
                    <div>
                      <Label>GSTIN</Label>
                      <Input value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} placeholder="GSTIN" />
                    </div>
                  </div>
                  <div>
                    <Label>Purchase Person</Label>
                    <Input value={purchasePerson} onChange={(e) => setPurchasePerson(e.target.value)} placeholder="Person name" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Vendor Details Display */
            <div className="space-y-4">
              {/* Vendor Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.vendorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedVendor.vendorCode && (
                      <Badge variant="outline" className="font-mono text-xs">{selectedVendor.vendorCode}</Badge>
                    )}
                    {selectedVendor.category && (
                      <Badge variant="secondary" className="text-xs">{selectedVendor.category}</Badge>
                    )}
                    {selectedVendor.isActive !== false && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {/* Contact Info */}
                <InfoField label="Contact Person" value={selectedVendor.contactPerson} icon={User} />
                <InfoField label="Phone" value={selectedVendor.phone || selectedVendor.mobileNo || selectedVendor.contactPersonNo} icon={Phone} />
                <InfoField label="Email" value={selectedVendor.email} icon={Mail} />

                {/* Tax & Compliance */}
                <InfoField label="GSTIN" value={selectedVendor.gstNumber || selectedVendor.gstin} icon={FileText} />
                <InfoField label="PAN Number" value={selectedVendor.panNumber} icon={FileText} />
                <InfoField label="FSSAI Number" value={selectedVendor.fssaiNumber} icon={FileText} />

                {/* Address */}
                <InfoField
                  label="Address"
                  value={[selectedVendor.address, selectedVendor.city, selectedVendor.state, selectedVendor.country, selectedVendor.pincode].filter(Boolean).join(', ')}
                  icon={MapPin}
                />

                {/* Bank Details */}
                <InfoField label="Bank Name" value={selectedVendor.bankName} icon={CreditCard} />
                <InfoField
                  label="Account / IFSC"
                  value={[selectedVendor.bankAccountNo, selectedVendor.bankIfsc].filter(Boolean).join(' / ') || undefined}
                  icon={CreditCard}
                />

                {/* Business Info */}
                <InfoField label="Products Supplied" value={selectedVendor.productsSupplied} icon={FileText} />
                <InfoField label="Payment Terms" value={selectedVendor.paymentTerms} icon={FileText} />
                <InfoField label="Purchase Person" value={selectedVendor.purchasePerson} icon={User} />
              </div>

              {/* Editable Purchase Person if vendor doesn't have one */}
              {!selectedVendor.purchasePerson && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="max-w-xs">
                    <Label>Purchase Person</Label>
                    <Input value={purchasePerson} onChange={(e) => setPurchasePerson(e.target.value)} placeholder="Assign purchase person" />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Order No Dropdown */}
            <div className="relative">
              <Label>Order No.</Label>
              {selectedVendor ? (
                <>
                  <div
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                    onClick={() => setShowOrderDropdown(!showOrderDropdown)}
                  >
                    <span className={selectedOrderId ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {selectedOrderId
                        ? vendorOrders.find((o: any) => o.orderId === selectedOrderId)?.orderNumber || 'Selected'
                        : 'Select Order No.'}
                    </span>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showOrderDropdown && (
                    <>
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {vendorOrders.length > 0 ? (
                          vendorOrders.map((o: any) => (
                            <button
                              key={o.orderId}
                              type="button"
                              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 text-sm ${selectedOrderId === o.orderId ? 'bg-blue-50 font-semibold' : ''}`}
                              onClick={() => handleOrderSelect(o)}
                            >
                              <div className="font-medium">{o.orderNumber}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : ''} {o.status ? `• ${o.status}` : ''}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-sm text-gray-500 text-center">No orders found for this vendor</div>
                        )}
                      </div>
                      <div className="fixed inset-0 z-40" onClick={() => setShowOrderDropdown(false)} />
                    </>
                  )}
                </>
              ) : (
                <Input disabled placeholder="Select vendor first" className="bg-gray-50" />
              )}
            </div>
            <div>
              <Label>Order Date *</Label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div>
              <Label>Expected Delivery</Label>
              <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
            </div>
            <div>
              <Label>Purchase Person</Label>
              <Input value={purchasePerson} readOnly className="bg-gray-50" placeholder="From vendor" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Freight Term Dropdown */}
            <div>
              <Label>Freight Term</Label>
              <select
                value={freightTerm}
                onChange={(e) => setFreightTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="Paid">Paid</option>
                <option value="To Pay">To Pay</option>
                <option value="Add in Invoice">Add in Invoice</option>
              </select>
            </div>
            {/* Location Dropdown */}
            <div>
              <Label>Location</Label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
            {/* Sales Person — auto-filled from order */}
            <div>
              <Label>Sales Person Name</Label>
              <Input value={salesPersonName} readOnly className="bg-yellow-50 border-yellow-300 font-medium" placeholder="Auto from order" />
            </div>
            {/* Payment Term */}
            <div>
              <Label>Payment Term</Label>
              <Input value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} placeholder="e.g. 50% Advance" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>SO Reference</Label>
              <Input value={soNo} onChange={(e) => setSoNo(e.target.value)} placeholder="e.g. KOI/SO/24-25/00001" />
            </div>
            <div>
              <Label>Enquiry No</Label>
              <Input value={enquiryNo} onChange={(e) => setEnquiryNo(e.target.value)} placeholder="Enquiry reference" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Billing Address *</Label>
              <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Shipping Address *</Label>
              <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table — Excel-style with yellow editable cells */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Product Details ({items.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[1600px]">
              <thead>
                <tr className="bg-[#003366] text-white text-[10px]">
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-10">S. No.</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold min-w-[140px]">Unique Code</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold min-w-[180px]">Item Description</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Unit (Per Kg / Per Pcs)</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Order Qty (Per Case)</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Qty (Per Kg / Per Pcs)</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">Best Price As on Date</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-16">GST</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold min-w-[100px]">Remark</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">Amount</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">GST Amount</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">Total Amount</th>
                  <th className="py-2 px-2 border-l-4 border-l-blue-400 border border-gray-500 text-center font-bold min-w-[100px]">Enquiry No.</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">Date</th>
                  <th className="py-2 px-2 border-l-4 border-l-blue-400 border border-gray-500 text-center font-bold w-24">Quoted Price With out GST</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-24">Approved By Jatin Sir</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Current Stock</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">No Need</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Indent Qty</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Lead Time</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-20">Balance qty</th>
                  <th className="py-2 px-2 border border-gray-500 text-center font-bold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.unitPrice) || 0;
                  const gstRate = Number(item.gstRate) || 0;
                  const amount = qty * price;
                  const gstAmt = amount * gstRate / 100;
                  const totalAmt = amount + gstAmt;

                  return (
                    <tr key={item.id} className="bg-white hover:bg-gray-50/50">
                      {/* S.No. */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center text-gray-500 font-mono">{idx + 1}</td>
                      {/* Unique Code */}
                      <td className="py-0.5 px-1 border border-gray-200">
                        <input type="text" value={item.productCode} onChange={(e) => updateItem(item.id, 'productCode', e.target.value)} className="w-full border-0 text-xs py-1 px-1 font-mono focus:ring-1 focus:ring-blue-400 focus:outline-none rounded" placeholder="Code" />
                      </td>
                      {/* Item Description */}
                      <td className="py-0.5 px-1 border border-gray-200">
                        <input type="text" value={item.productName} onChange={(e) => updateItem(item.id, 'productName', e.target.value)} className="w-full border-0 text-xs py-1 px-1 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded" placeholder="Product name *" />
                      </td>
                      {/* Unit */}
                      <td className="py-0.5 px-1 border border-gray-200">
                        <input type="text" value={item.uomName} onChange={(e) => updateItem(item.id, 'uomName', e.target.value)} className="w-full border-0 text-center text-xs py-1 px-1 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded" />
                      </td>
                      {/* Order Qty (Per Case) — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input type="number" value={item.orderQtyPerCase || ''} onChange={(e) => updateItem(item.id, 'orderQtyPerCase', Number(e.target.value) || 0)} className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded" min={0} step="any" />
                      </td>
                      {/* Qty (Per Kg/Pcs) — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value) || 0)} className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded" min={0} step="any" />
                      </td>
                      {/* Best Price — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value) || 0)} className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded" min={0} step="any" />
                      </td>
                      {/* GST — read-only */}
                      <td className="py-0.5 px-1 border border-gray-200">
                        <input type="number" value={item.gstRate} onChange={(e) => updateItem(item.id, 'gstRate', Number(e.target.value) || 0)} className="w-full border-0 text-center text-xs py-1 px-1 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded" min={0} max={100} />
                      </td>
                      {/* Remark — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input type="text" value={item.remark} onChange={(e) => updateItem(item.id, 'remark', e.target.value)} className="w-full bg-yellow-50 border-0 text-left text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded" placeholder="-" />
                      </td>
                      {/* Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right font-semibold">{formatCurrency(amount)}</td>
                      {/* GST Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right">{formatCurrency(gstAmt)}</td>
                      {/* Total Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right font-bold">{formatCurrency(totalAmt)}</td>
                      {/* Enquiry No. — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-left font-mono text-gray-600">{enquiryNo || '-'}</td>
                      {/* Date — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center text-gray-600">{orderDate ? new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      {/* Quoted Price — read-only, red if unitPrice > quotedPrice */}
                      <td className={`py-1.5 px-2 border border-gray-200 text-right ${item.quotedPrice && price > Number(item.quotedPrice) ? 'bg-red-50 text-red-600 font-semibold' : ''}`}>
                        {item.quotedPrice ? formatCurrency(item.quotedPrice) : '-'}
                        {item.quotedPrice > 0 && price > Number(item.quotedPrice) && (
                          <span title="Best Price exceeds Quoted Price - needs approval">
                            <AlertTriangle className="inline-block h-3.5 w-3.5 ml-1 text-red-500" />
                          </span>
                        )}
                      </td>
                      {/* Approved By Jatin Sir — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center">
                        {item.approvedByJatinSir ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle2 className="h-4 w-4" /> {item.approvedByJatinSir}
                          </span>
                        ) : item.quotedPrice > 0 && price > Number(item.quotedPrice) ? (
                          <span className="text-orange-500 text-xs font-medium">Pending</span>
                        ) : '-'}
                      </td>
                      {/* Current Stock — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right">{item.currentStock || 0}</td>
                      {/* No Need — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center">
                        {item.noNeed ? <span className="text-red-600 font-semibold">Yes</span> : <span className="text-gray-400">-</span>}
                      </td>
                      {/* Indent Qty — EDITABLE dropdown (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <select value={item.indentQty || ''} onChange={(e) => updateItem(item.id, 'indentQty', e.target.value)} className="w-full bg-yellow-50 border-0 text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded">
                          <option value="">Select</option>
                          <option value="Close">Close</option>
                          <option value="No Need">No Need</option>
                          <option value="Continue">Continue</option>
                        </select>
                      </td>
                      {/* Lead Time — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input type="number" value={item.leadTimeDays || ''} onChange={(e) => updateItem(item.id, 'leadTimeDays', Number(e.target.value) || 0)} className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded" min={0} />
                      </td>
                      {/* Balance Qty — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right">{item.balanceQty || 0}</td>
                      {/* Delete */}
                      <td className="py-1 px-1 border border-gray-200 text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeItem(item.id)} disabled={items.length <= 1}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-6 px-6 pb-4">
            <div className="w-80 space-y-2 text-sm border rounded-lg p-4 bg-slate-50">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax Amount:</span><span>{formatCurrency(totalGst)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Grand Total:</span><span className="font-bold text-blue-700">{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} rows={4} />
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/purchase/orders">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Create Purchase Order</>
          )}
        </Button>
      </div>
    </div>
  );
}
