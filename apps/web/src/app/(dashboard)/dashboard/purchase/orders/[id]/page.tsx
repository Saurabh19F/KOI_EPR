'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileDown,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Building2,
  Calendar,
  MapPin,
  FileText,
  Search,
  X,
  Phone,
  Mail,
  CreditCard,
  User,
  Package,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received: 'bg-emerald-100 text-emerald-800',
  invoiced: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-600',
};

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num || 0);
}

function formatDate(date: string | Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInputValue(date: string | Date | null) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
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

// ============ READ-ONLY DETAIL VIEW (non-draft) ============
function ReadOnlyView({ order, orderId }: { order: any; orderId: string }) {
  const queryClient = useQueryClient();
  const items = order?.items || [];
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrderApi.approveOrder(orderId),
    onSuccess: () => { toast.success('Purchase order approved'); queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrderApi.cancelOrder(orderId),
    onSuccess: () => { toast.success('Purchase order cancelled'); queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to cancel'),
  });

  const handleDownloadPdf = async () => {
    try {
      const response = await purchaseOrderApi.downloadPdf(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-${order?.orderNumber?.replace(/\//g, '-') || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to download PDF'); }
  };

  const isBusy = approveMutation.isPending || cancelMutation.isPending;
  const canApprove = ['submitted', 'pending_approval'].includes(order?.status);
  const canCancel = !['cancelled', 'received', 'invoiced', 'closed'].includes(order?.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchase/orders"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
              <Badge className={`${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} text-xs uppercase font-bold`}>
                {order.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-gray-500">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}><FileDown className="h-4 w-4 mr-2" /> Download PDF</Button>
          {canApprove && <Button onClick={() => approveMutation.mutate()} disabled={isBusy}><CheckCircle className="h-4 w-4 mr-2" /> Approve</Button>}
          {canCancel && <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={isBusy}><XCircle className="h-4 w-4 mr-2" /> Cancel</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Vendor</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{order.vendorName || 'TBD'}</span></div>
            {order.vendorCode && <div><span className="text-gray-500">Code:</span> <span className="font-mono">{order.vendorCode}</span></div>}
            {order.vendorGstin && <div><span className="text-gray-500">GSTIN:</span> <span className="font-mono">{order.vendorGstin}</span></div>}
            {order.purchasePerson && <div><span className="text-gray-500">Purchase Person:</span> <span>{order.purchasePerson}</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Dates & References</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-gray-500">Order Date:</span> <span className="font-medium">{formatDate(order.orderDate || order.createdAt)}</span></div>
            {order.expectedDeliveryDate && <div><span className="text-gray-500">Expected Delivery:</span> <span>{formatDate(order.expectedDeliveryDate)}</span></div>}
            {order.soNo && <div><span className="text-gray-500">SO Ref:</span> <span className="font-mono">{order.soNo}</span></div>}
            {order.enquiryNo && <div><span className="text-gray-500">Enquiry:</span> <span className="font-mono">{order.enquiryNo}</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Addresses</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.billingAddress && <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Billing</span><span className="whitespace-pre-line">{order.billingAddress}</span></div>}
            {order.shippingAddress && <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Shipping</span><span className="whitespace-pre-line">{order.shippingAddress}</span></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Line Items ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">GST %</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">GST Amt</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Lead Days</TableHead>
                  <TableHead className="text-center">No Need</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any, idx: number) => {
                  const taxableAmt = Number(item.taxableAmount || item.quantity * item.unitPrice || 0);
                  const gstAmt = Number(item.taxAmount || (item.cgstAmount || 0) + (item.sgstAmount || 0) || 0);
                  const total = Number(item.totalAmount || taxableAmt + gstAmt);
                  return (
                    <TableRow key={item.itemId || idx} className={item.noNeed ? 'bg-red-50/50' : ''}>
                      <TableCell className="text-sm text-gray-500 font-mono">{item.lineNumber || idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">{item.productName}</span>
                          {item.productCode && <span className="text-xs text-gray-500 block font-mono">{item.productCode}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{item.hsnCode || '-'}</TableCell>
                      <TableCell className="text-sm">{item.uomName || '-'}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right text-sm">{item.gstRate || 0}%</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(taxableAmt)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(gstAmt)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatCurrency(total)}</TableCell>
                      <TableCell className="text-right text-sm">{item.leadTimeDays || '-'}</TableCell>
                      <TableCell className="text-center">
                        {item.noNeed ? <Badge variant="destructive" className="text-[10px]"><Ban className="h-3 w-3 mr-1" />NO NEED</Badge> : <span className="text-gray-400 text-xs">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-6">
            <div className="w-80 space-y-2 text-sm border rounded-lg p-4 bg-slate-50">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">{formatCurrency(order.subtotal || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax Amount:</span><span>{formatCurrency(order.taxAmount || 0)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Grand Total:</span><span className="font-bold text-blue-700">{formatCurrency(order.totalAmount || 0)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(order.notes || order.termsAndConditions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {order.notes && <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p></CardContent></Card>}
          {order.termsAndConditions && <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Terms & Conditions</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-700 whitespace-pre-line">{order.termsAndConditions}</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}

const YELLOW_CELL = 'bg-yellow-100 border border-yellow-300';

// ============ EDITABLE FORM VIEW (draft POs) ============
function EditableView({ order, orderId }: { order: any; orderId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const orderItems = order?.items || [];

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const [vendorCode, setVendorCode] = useState(order.vendorCode || '');
  const [vendorGstin, setVendorGstin] = useState(order.vendorGstin || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(toDateInputValue(order.expectedDeliveryDate));
  const [billingAddress, setBillingAddress] = useState(order.billingAddress || '');
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [termsAndConditions, setTermsAndConditions] = useState(order.termsAndConditions || '');
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const [items, setItems] = useState<any[]>(() =>
    orderItems.map((item: any, idx: number) => ({
      ...item,
      lineNumber: item.lineNumber || idx + 1,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      gstRate: Number(item.gstRate || 0),
      remark: item.remark || item.description || '',
      quotedPrice: Number(item.quotedPrice || 0),
      approvedByJatinSir: item.approvedBy || item.approvedByJatinSir || '',
      currentStock: Number(item.currentStock || 0),
      noNeed: item.noNeed || false,
      indentQty: item.indentQty || '',
      leadTimeDays: Number(item.leadTimeDays || 0),
      balanceQty: Number(item.balanceQty || 0),
    }))
  );

  const updateItem = (idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const hasExistingVendor = order.vendorName && order.vendorName !== 'TBD';

  useEffect(() => {
    if (hasExistingVendor) {
      setSelectedVendor({
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        vendorCode: order.vendorCode,
        gstNumber: order.vendorGstin,
      });
    }
  }, []);

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', vendorSearch],
    queryFn: () => mastersApi.getVendors({ limit: 50, search: vendorSearch || undefined }),
  });
  const vendors = vendorsData?.data?.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.updateOrder(orderId, data),
    onSuccess: () => {
      toast.success('Purchase order updated');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update PO'),
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: (remarks?: string) => purchaseOrderApi.submitForApproval({ orderId, remarks }),
    onSuccess: () => {
      toast.success('Submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] });
      setApprovalDialog(false);
      setApprovalRemarks('');
      router.push('/dashboard/purchase/orders');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to submit'),
  });

  const handleVendorSelect = (vendor: any) => {
    setSelectedVendor(vendor);
    setVendorCode(vendor.vendorCode || '');
    setVendorGstin(vendor.gstNumber || vendor.gstin || '');
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
    setVendorSearch('');
    setShowVendorDropdown(false);
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await purchaseOrderApi.downloadPdf(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-${order?.orderNumber?.replace(/\//g, '-') || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to download PDF'); }
  };

  const handleSave = () => {
    const vendorName = selectedVendor?.vendorName || vendorSearch || order.vendorName;
    if (!vendorName || vendorName === 'TBD') { toast.error('Please select a vendor'); return; }

    updateMutation.mutate({
      vendorId: selectedVendor?.vendorId || order.vendorId || undefined,
      vendorName,
      vendorCode: vendorCode || undefined,
      vendorGstin: vendorGstin || undefined,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      billingAddress,
      shippingAddress,
      notes: notes || undefined,
      termsAndConditions: termsAndConditions || undefined,
      items: items.map((item: any) => ({
        lineNumber: item.lineNumber,
        productName: item.productName,
        productCode: item.productCode || undefined,
        hsnCode: item.hsnCode || undefined,
        uomName: item.uomName || 'PCS',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate || 0),
        description: item.remark || item.description || undefined,
        leadTimeDays: Number(item.leadTimeDays) || undefined,
        noNeed: item.noNeed || false,
        quotedPrice: Number(item.quotedPrice) || undefined,
        approvedByJatinSir: item.approvedByJatinSir || undefined,
        currentStock: Number(item.currentStock) || undefined,
        indentQty: item.indentQty || undefined,
        orderQtyPerCase: Number(item.orderQtyPerCase) || Number(item.quantity) || undefined,
        balanceQty: Number(item.balanceQty) || undefined,
      })),
    });
  };

  const isBusy = updateMutation.isPending || submitForApprovalMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchase/orders"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
              <Badge className={`${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} text-xs uppercase font-bold`}>
                {order.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-gray-500">Edit Purchase Order — Select vendor and update details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}><FileDown className="h-4 w-4 mr-2" /> PDF</Button>
          <Button variant="outline" onClick={() => setApprovalDialog(true)} disabled={isBusy || !selectedVendor}>
            <Send className="h-4 w-4 mr-2" /> Submit for Approval
          </Button>
          <Button onClick={handleSave} disabled={isBusy}>
            {updateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
          </Button>
        </div>
      </div>

      {/* Vendor Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Vendor Details
              {(!selectedVendor || order.vendorName === 'TBD') && (
                <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
              )}
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
              <div className="relative">
                <Label>Search Vendor *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchRef}
                    value={vendorSearch}
                    onChange={(e) => { setVendorSearch(e.target.value); setShowVendorDropdown(true); }}
                    onFocus={() => setShowVendorDropdown(true)}
                    placeholder="Search vendor by name, code, or GSTIN..."
                    className="pl-9"
                    autoFocus
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
                            {v.vendorCode && <Badge variant="secondary" className="text-xs">{v.vendorCode}</Badge>}
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
                        {vendorSearch ? 'No vendors found' : 'Type to search vendors...'}
                      </div>
                    )}
                  </div>
                )}
                {showVendorDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowVendorDropdown(false)} />}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.vendorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(selectedVendor.vendorCode || vendorCode) && <Badge variant="outline" className="font-mono text-xs">{selectedVendor.vendorCode || vendorCode}</Badge>}
                    {selectedVendor.category && <Badge variant="secondary" className="text-xs">{selectedVendor.category}</Badge>}
                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <InfoField label="Contact Person" value={selectedVendor.contactPerson} icon={User} />
                <InfoField label="Phone" value={selectedVendor.phone || selectedVendor.mobileNo || selectedVendor.contactPersonNo} icon={Phone} />
                <InfoField label="Email" value={selectedVendor.email} icon={Mail} />
                <InfoField label="GSTIN" value={selectedVendor.gstNumber || selectedVendor.gstin || vendorGstin} icon={FileText} />
                <InfoField label="PAN Number" value={selectedVendor.panNumber} icon={FileText} />
                <InfoField label="Address" value={[selectedVendor.address, selectedVendor.city, selectedVendor.state, selectedVendor.country, selectedVendor.pincode].filter(Boolean).join(', ')} icon={MapPin} />
                <InfoField label="Bank Name" value={selectedVendor.bankName} icon={CreditCard} />
                <InfoField label="Account / IFSC" value={[selectedVendor.bankAccountNo, selectedVendor.bankIfsc].filter(Boolean).join(' / ') || undefined} icon={CreditCard} />
                <InfoField label="Payment Terms" value={selectedVendor.paymentTerms} icon={FileText} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Order Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Order Date</Label>
              <div className="text-sm font-medium mt-1">{formatDate(order.orderDate || order.createdAt)}</div>
            </div>
            <div>
              <Label>Expected Delivery</Label>
              <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-gray-500">SO Reference</Label>
              <div className="text-sm font-medium font-mono mt-1">{order.soNo || '-'}</div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">PO Number</Label>
              <div className="text-sm font-medium font-mono mt-1">{order.orderNumber}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Billing Address</Label>
              <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Shipping Address</Label>
              <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table — Excel-style with yellow editable cells */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Product Details ({items.length})</CardTitle>
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
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.unitPrice) || 0;
                  const gstRate = Number(item.gstRate) || 0;
                  const amount = qty * price;
                  const gstAmt = amount * gstRate / 100;
                  const totalAmt = amount + gstAmt;

                  return (
                    <tr key={item.itemId || idx} className={`${item.noNeed ? 'bg-red-50/40' : 'bg-white'} hover:bg-gray-50/50`}>
                      {/* S.No. — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center text-gray-500 font-mono">{item.lineNumber}</td>
                      {/* Unique Code — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-left font-mono text-gray-700">{item.productCode || '-'}</td>
                      {/* Item Description — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-left font-medium text-gray-900">{item.productName}</td>
                      {/* Unit — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center text-gray-600">{item.uomName || '-'}</td>
                      {/* Order Qty — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input
                          type="number"
                          value={item.orderQtyPerCase ?? qty}
                          onChange={(e) => updateItem(idx, 'orderQtyPerCase', Number(e.target.value) || 0)}
                          className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                          min={0}
                          step="any"
                        />
                      </td>
                      {/* Qty (Per Kg/Pcs) — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)}
                          className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                          min={0}
                          step="any"
                        />
                      </td>
                      {/* Best Price — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                          className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                          min={0}
                          step="any"
                        />
                      </td>
                      {/* GST — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center">{gstRate}%</td>
                      {/* Remark — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input
                          type="text"
                          value={item.remark}
                          onChange={(e) => updateItem(idx, 'remark', e.target.value)}
                          className="w-full bg-yellow-50 border-0 text-left text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                          placeholder="-"
                        />
                      </td>
                      {/* Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right font-semibold">{formatCurrency(amount)}</td>
                      {/* GST Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right">{formatCurrency(gstAmt)}</td>
                      {/* Total Amount — calculated */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right font-bold">{formatCurrency(totalAmt)}</td>
                      {/* Enquiry No. — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-left font-mono text-gray-600">{item.enquiryNo || order.enquiryNo || '-'}</td>
                      {/* Date — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-center text-gray-600">{formatDate(order.orderDate || order.createdAt)}</td>
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
                        <select
                          value={item.indentQty || ''}
                          onChange={(e) => updateItem(idx, 'indentQty', e.target.value)}
                          className="w-full bg-yellow-50 border-0 text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                        >
                          <option value="">Select</option>
                          <option value="Close">Close</option>
                          <option value="No Need">No Need</option>
                          <option value="Continue">Continue</option>
                        </select>
                      </td>
                      {/* Lead Time — EDITABLE (yellow) */}
                      <td className={`py-0.5 px-1 ${YELLOW_CELL}`}>
                        <input
                          type="number"
                          value={item.leadTimeDays}
                          onChange={(e) => updateItem(idx, 'leadTimeDays', Number(e.target.value) || 0)}
                          className="w-full bg-yellow-50 border-0 text-right text-xs py-1 px-1 focus:ring-1 focus:ring-yellow-500 focus:outline-none rounded"
                          min={0}
                        />
                      </td>
                      {/* Balance Qty — read-only */}
                      <td className="py-1.5 px-2 border border-gray-200 text-right">{item.balanceQty || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-6 px-6 pb-4">
            <div className="w-80 space-y-2 text-sm border rounded-lg p-4 bg-slate-50">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">{formatCurrency(items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax Amount:</span><span>{formatCurrency(items.reduce((s, it) => { const a = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0); return s + a * (Number(it.gstRate) || 0) / 100; }, 0))}</span></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Grand Total:</span><span className="font-bold text-blue-700">{formatCurrency(items.reduce((s, it) => { const a = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0); return s + a + a * (Number(it.gstRate) || 0) / 100; }, 0))}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={4} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
          <CardContent><Textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} rows={4} /></CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link href="/dashboard/purchase/orders">Cancel</Link></Button>
        <Button onClick={handleSave} disabled={isBusy}>
          {updateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Purchase Order</>}
        </Button>
      </div>

      {/* Submit for Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={(open) => { if (!open) { setApprovalDialog(false); setApprovalRemarks(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>Submit PO {order.orderNumber} for management approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} placeholder="Add remarks for the approver..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApprovalDialog(false); setApprovalRemarks(''); }}>Cancel</Button>
            <Button disabled={submitForApprovalMutation.isPending} onClick={() => submitForApprovalMutation.mutate(approvalRemarks || undefined)}>
              <Send className="h-4 w-4 mr-2" />
              {submitForApprovalMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ MAIN PAGE COMPONENT ============
export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-order', orderId],
    queryFn: () => purchaseOrderApi.getOrder(orderId).then((r) => r.data),
    enabled: !!orderId,
  });

  const order = data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-24">
        <h3 className="text-lg font-medium text-gray-900">Purchase order not found</h3>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/purchase/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const isDraft = ['draft', 'submitted'].includes(order.status);

  if (isDraft) {
    return <EditableView order={order} orderId={orderId} />;
  }

  return <ReadOnlyView order={order} orderId={orderId} />;
}
