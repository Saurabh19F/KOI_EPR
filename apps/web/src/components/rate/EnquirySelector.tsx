'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Loader2, CheckCircle, ArrowRight, Package, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnquirySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (enquiry: any) => void;
}

interface Enquiry {
  enquiryId: string;
  enquiryNo: string;
  enquiryOrderId?: string;
  enquiryOrderNo?: string;
  enquiryDate: Date;
  customerName: string;
  buyerCode: string;
  country: string;
  pod: string;
  currency: string;
  paymentTerms: string;
  status: string;
  items: EnquiryItem[];
}

interface EnquiryItem {
  itemId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  orderQuantity: number;
  unitName: string;
  cbmPerBox: number;
  unitsPerCase: number;
}

export function EnquirySelector({ open, onClose, onSelect }: EnquirySelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch enquiries
  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['enquiries-for-rate', search],
    queryFn: () => salesApi.getEnquiries({
      search: search || undefined,
      limit: 100
      // No status filter — show ALL enquiries so nothing is hidden
    }),
    enabled: true,
  });

  // Fetch enquiry details and items when selected
  const { data: enquiryDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['enquiry-details', selectedEnquiry?.enquiryOrderId || selectedEnquiry?.enquiryId],
    queryFn: async () => {
      const id = selectedEnquiry?.enquiryOrderId || selectedEnquiry?.enquiryId;
      if (!id) return null;
      const [enquiryRes, itemsRes] = await Promise.all([
        salesApi.getEnquiry(id),
        salesApi.getEnquiryItems(id)
      ]);
      return {
        ...enquiryRes,
        data: {
          ...enquiryRes.data,
          items: itemsRes.data || []
        }
      };
    },
    enabled: !!(selectedEnquiry?.enquiryOrderId || selectedEnquiry?.enquiryId),
  });

  const enquiryList = enquiries?.data?.data || [];

  const handleSelectEnquiry = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setSelectedItems(new Set());
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!enquiryDetails?.data?.items) return;
    if (selectedItems.size === enquiryDetails.data.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(enquiryDetails.data.items.map((i: any) => i.itemId)));
    }
  };

  const handleConfirm = () => {
    if (!enquiryDetails?.data || selectedItems.size === 0) {
      toast.error('Please select at least one item');
      return;
    }

    const items = enquiryDetails.data.items.filter((i: any) => selectedItems.has(i.itemId));

    onSelect({
      ...enquiryDetails.data,
      items,
      enquiryId: enquiryDetails.data.enquiryId || enquiryDetails.data.id,
      enquiryNo: enquiryDetails.data.enquiryNo || enquiryDetails.data.enquiryOrderNo,
      customerName: enquiryDetails.data.customerName,
      buyerCode: enquiryDetails.data.buyerCode,
      country: enquiryDetails.data.country,
      pod: enquiryDetails.data.pod,
      currency: enquiryDetails.data.currency || 'USD',
      paymentTerms: enquiryDetails.data.paymentTerms,
    });

    onClose();
    setSelectedEnquiry(null);
    setSelectedItems(new Set());
    setSearch('');
  };

  const handleBack = () => {
    setSelectedEnquiry(null);
    setSelectedItems(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedEnquiry ? `Select Items from ${selectedEnquiry.enquiryNo || selectedEnquiry.enquiryOrderNo}` : 'Select Enquiry'}
          </DialogTitle>
          <DialogDescription>
            {selectedEnquiry
              ? 'Select the products you want to include in the rate calculation'
              : 'Search and select an enquiry to create a rate calculation from'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!selectedEnquiry ? (
            // Enquiry List View
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by enquiry no., buyer code, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : enquiryList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enquiry No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiryList.map((enquiry: any, index: number) => (
                      <TableRow
                        key={enquiry.enquiryOrderId || enquiry.enquiryId || enquiry.id || `enquiry-${index}`}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => handleSelectEnquiry(enquiry)}
                      >
                        <TableCell className="font-mono font-medium">
                          {enquiry.enquiryNo || enquiry.enquiryOrderNo}
                        </TableCell>
                        <TableCell>
                          {enquiry.enquiryDate
                            ? new Date(enquiry.enquiryDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{enquiry.buyerCode || '-'}</TableCell>
                        <TableCell>{enquiry.customerName || '-'}</TableCell>
                        <TableCell>{enquiry.country || '-'}</TableCell>
                        <TableCell>{enquiry.currency || 'USD'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              enquiry.status === 'submitted' || enquiry.status === 'rate_pending' || enquiry.status === 'verified'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {enquiry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {search ? 'No enquiries found matching your search' : 'No enquiries available'}
                </div>
              )}
            </div>
          ) : (
            // Item Selection View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  ← Back to Enquiries
                </Button>
                <div className="text-sm text-gray-500">
                  Selected: {selectedItems.size} items
                </div>
              </div>

              {/* Enquiry Summary */}
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Enquiry No.</p>
                      <p className="font-mono font-medium">{selectedEnquiry.enquiryNo || selectedEnquiry.enquiryOrderNo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Customer</p>
                      <p className="font-medium">{selectedEnquiry.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Buyer Code</p>
                      <p className="font-medium">{selectedEnquiry.buyerCode || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Country</p>
                      <p className="font-medium">{selectedEnquiry.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : enquiryDetails?.data?.items?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === enquiryDetails?.data?.items?.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4"
                          aria-label="Select all items"
                        />
                      </TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">CBM/Box</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiryDetails?.data?.items?.map((item: any, index: number) => (
                      <TableRow
                        key={item.itemId || item.id || `item-${index}`}
                        className={selectedItems.has(item.itemId) ? 'bg-blue-50' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.itemId)}
                            onChange={() => handleSelectItem(item.itemId)}
                            className="h-4 w-4"
                            aria-label={`Select item ${item.productName || ''}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{item.productCode || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.productName || '-'}</TableCell>
                        <TableCell>{item.categoryName || '-'}</TableCell>
                         <TableCell className="text-right">
                          {Number(item.quantity || item.orderQuantity || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{item.uom || item.unitName || 'PCS'}</TableCell>
                        <TableCell className="text-right">{item.cbmPerBox || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items found in this enquiry
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedEnquiry && (
            <Button onClick={handleConfirm} disabled={selectedItems.size === 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Rate from {selectedItems.size} Items
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EnquirySelector;