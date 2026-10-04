'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckSquare,
  Square,
  Calendar,
  Package,
} from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface BulkExportProps {
  open: boolean;
  onClose: () => void;
}

interface ExportItem {
  analysisId: string;
  analysisNo: string;
  enquiryOrderNo?: string;
  analysisDate: Date;
  customerName: string;
  buyerCode: string;
  status: string;
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalMargin: number;
  selected: boolean;
}

const EXPORT_COLUMNS = [
  { id: 'enquiryOrderNo', label: 'Enquiry No.', default: true },
  { id: 'analysisDate', label: 'Date', default: true },
  { id: 'customerName', label: 'Customer', default: true },
  { id: 'buyerCode', label: 'Buyer Code', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'totalPurchaseValue', label: 'Purchase Value', default: true },
  { id: 'totalSellingValue', label: 'Selling Value', default: true },
  { id: 'totalMargin', label: 'Margin %', default: true },
  { id: 'currency', label: 'Currency', default: false },
  { id: 'country', label: 'Country', default: false },
  { id: 'pod', label: 'POD', default: false },
  { id: 'totalItems', label: 'Total Items', default: false },
  { id: 'totalCbm', label: 'Total CBM', default: false },
  { id: 'createdBy', label: 'Created By', default: false },
];

export function BulkExport({ open, onClose }: BulkExportProps) {
  const [format, setFormat] = useState<'excel' | 'csv'>('csv');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(EXPORT_COLUMNS.map((c) => ({ ...c, selected: c.default })));

  // Fetch analyses for export
  const { data: analysesData, isLoading } = useQuery({
    queryKey: ['analyses-for-export', dateRange, statusFilter],
    queryFn: () =>
      rateApi.getAnalysis({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: undefined,
        limit: 1000,
      }),
  });

  const analyses: ExportItem[] = analysesData?.data?.data || [];

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === analyses.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(analyses.map((a) => a.analysisId)));
    }
  };

  // Handle individual select
  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Handle column toggle
  const handleColumnToggle = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, selected: !col.selected } : col
      )
    );
  };

  // Handle export
  const handleExport = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one analysis to export');
      return;
    }

    const selectedColumns = columns.filter((c) => c.selected);
    const exportData = analyses
      .filter((a) => selectedItems.has(a.analysisId))
      .map((item) => {
        const row: any = {};
        selectedColumns.forEach((col) => {
          switch (col.id) {
            case 'enquiryOrderNo':
              row['Enquiry No.'] = item.enquiryOrderNo || (item as any).enquiryNo || item.analysisNo || '';
              break;
            case 'analysisDate':
              row['Date'] = formatDate(item.analysisDate);
              break;
            case 'customerName':
              row['Customer'] = item.customerName;
              break;
            case 'buyerCode':
              row['Buyer Code'] = item.buyerCode;
              break;
            case 'status':
              row['Status'] = item.status;
              break;
            case 'totalPurchaseValue':
              row['Purchase Value'] = item.totalPurchaseValue;
              break;
            case 'totalSellingValue':
              row['Selling Value'] = item.totalSellingValue;
              break;
            case 'totalMargin':
              row['Margin %'] = Number(item.totalMargin || 0).toFixed(2);
              break;
            default:
              row[col.label] = (item as any)[col.id] || '';
          }
        });
        return row;
      });

    if (format === 'csv' || format === 'excel') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rate_analyses_${dateRange.from}_to_${dateRange.to}.csv`;
      link.click();
      toast.success(`Exported ${selectedItems.size} analyses`);
    }

    onClose();
  };

  // Summary stats
  const summaryStats = {
    total: analyses.length,
    selected: selectedItems.size,
    totalPurchaseValue: analyses
      .filter((a) => selectedItems.has(a.analysisId))
      .reduce((sum, a) => sum + (a.totalPurchaseValue || 0), 0),
    totalSellingValue: analyses
      .filter((a) => selectedItems.has(a.analysisId))
      .reduce((sum, a) => sum + (a.totalSellingValue || 0), 0),
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Export
          </DialogTitle>
          <DialogDescription>
            Export multiple rate analyses to CSV or Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date-from">Date From</Label>
                  <input
                    type="date"
                    id="date-from"
                    title="Date From"
                    placeholder="Select start date"
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, from: e.target.value })
                    }
                    className="w-full h-10 px-3 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to">Date To</Label>
                  <input
                    type="date"
                    id="date-to"
                    title="Date To"
                    placeholder="Select end date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, to: e.target.value })
                    }
                    className="w-full h-10 px-3 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <select
                    id="status-filter"
                    title="Status Filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="APPROVED">Approved</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="format-select">Format</Label>
                  <select
                    id="format-select"
                    title="Export Format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel (CSV)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.total}</p>
                <p className="text-sm text-blue-600">Available</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{summaryStats.selected}</p>
                <p className="text-sm text-green-600">Selected</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  ₹{Number(summaryStats.totalPurchaseValue / 100000 || 0).toFixed(1)}L
                </p>
                <p className="text-sm text-purple-600">Purchase</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  ₹{Number(summaryStats.totalSellingValue / 100000 || 0).toFixed(1)}L
                </p>
                <p className="text-sm text-orange-600">Selling</p>
              </CardContent>
            </Card>
          </div>

          {/* Selection Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.size === analyses.length && analyses.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Enquiry No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Purchase</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((analysis) => (
                      <TableRow key={analysis.analysisId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(analysis.analysisId)}
                            onCheckedChange={() => handleSelect(analysis.analysisId)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{analysis.enquiryOrderNo || (analysis as any).enquiryNo || analysis.analysisNo}</TableCell>
                        <TableCell>{formatDate(analysis.analysisDate)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {analysis.customerName}
                        </TableCell>
                        <TableCell>{analysis.buyerCode || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              analysis.status === 'locked'
                                ? 'bg-green-100 text-green-700'
                                : analysis.status === 'approved'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {analysis.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{Number(analysis.totalPurchaseValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(analysis.totalMargin) > 0 ? (
                            <span className="text-green-600">
                              {Number(analysis.totalMargin).toFixed(1)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Column Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Columns to Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {columns.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.selected}
                          onChange={() => handleColumnToggle(column.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedItems.size === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export {selectedItems.size} Analyses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkExport;