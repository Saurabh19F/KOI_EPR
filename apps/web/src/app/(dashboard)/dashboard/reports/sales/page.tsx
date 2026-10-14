'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';

type DateRange = '7' | '30' | '90' | '365';
type StatusFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'won' | 'lost';

const widthClasses: Record<number, string> = {
  0: 'w-0',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-[50%]',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-[75%]',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-full'
};

function getWidthClass(percentage: number): string {
  const rounded = Math.round(percentage / 5) * 5;
  const clamped = Math.max(0, Math.min(100, rounded));
  return widthClasses[clamped] || 'w-0';
}

interface EnquiryStats {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  won: number;
  lost: number;
  conversionRate: number;
  avgResponseTime: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  submitted: { label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  approved: { label: 'Approved', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  won: { label: 'Won', color: 'text-green-600', bgColor: 'bg-green-100' },
  lost: { label: 'Lost', color: 'text-red-600', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch enquiries
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-enquiries', page, dateRange, statusFilter, searchQuery],
    queryFn: () =>
      salesApi.getEnquiries({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Fetch report data
  const { data: reportData } = useQuery({
    queryKey: ['sales-report-data', dateRange],
    queryFn: () => reportsApi.getSalesReport({ days: parseInt(dateRange) }),
  });

  // Fetch ALL enquiries for accurate summary stats
  const { data: allEnquiriesData } = useQuery({
    queryKey: ['sales-report-all-enquiries', dateRange],
    queryFn: () => salesApi.getEnquiries({ page: 1, limit: 1000 }),
  });

  const enquiries = data?.data?.data || [];
  const allEnquiries = allEnquiriesData?.data?.data || enquiries;
  const totalEnquiries = allEnquiriesData?.data?.total || data?.data?.total || enquiries.length;
  const totalPages = Math.ceil((data?.data?.total || totalEnquiries) / limit) || 1;

  const PENDING_LIST = ['pending', 'draft', 'purchase_pending', 'vendor_quote_pending', 'rate_pending', 'approval_pending', 'purchase_assigned', 'purchase_in_progress', 'mis_review', 'rate_calculation'];
  const SUBMITTED_LIST = ['submitted', 'punched', 'verified', 'quotation_created', 'quotation_sent', 'follow_up', 'mis_approved', 'purchase_completed', 'sent_to_purchase'];

  // Calculate stats from allEnquiries
  const stats: EnquiryStats = {
    total: totalEnquiries,
    pending: allEnquiries.filter((e: any) => PENDING_LIST.includes(e.status)).length,
    submitted: allEnquiries.filter((e: any) => SUBMITTED_LIST.includes(e.status)).length,
    approved: allEnquiries.filter((e: any) => e.status === 'approved').length,
    won: allEnquiries.filter((e: any) => e.status === 'won').length,
    lost: allEnquiries.filter((e: any) => e.status === 'lost').length,
    conversionRate: totalEnquiries > 0 ? (allEnquiries.filter((e: any) => e.status === 'won').length / totalEnquiries * 100) : 0,
    avgResponseTime: 24,
  };

  // Calculate real metrics from summary data if available
  const summary = reportData?.data;
  const percentChange = {
    total: summary?.growthRate !== undefined ? summary.growthRate : 0,
    conversion: stats.conversionRate,
    won: summary?.byStatus?.find((s: any) => s.status === 'won')?.percentage || 0,
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading(`Generating sales ${format} report...`, { id: 'export' });
      const filename = `sales-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const res = format === 'excel'
        ? await reportsApi.exportToExcel('sales', { days: dateRange })
        : await reportsApi.exportToPdf('sales', { days: dateRange });
      
      const blob = new Blob([res.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Sales report exported successfully!`, { id: 'export' });
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export sales report', { id: 'export' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
          <p className="text-slate-500 mt-1">Sales enquiry analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Enquiries</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {percentChange.total >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${percentChange.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(percentChange.total)}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.conversion}% improvement
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Won Enquiries</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.won}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.won}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-600">Awaiting action</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Enquiry breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const count = allEnquiries.filter((e: any) => {
                  if (key === 'pending') return PENDING_LIST.includes(e.status);
                  if (key === 'submitted') return SUBMITTED_LIST.includes(e.status);
                  return e.status === key;
                }).length;
                const percentage = stats.total > 0 ? (count / stats.total * 100) : 0;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                      <span className="text-sm font-medium text-slate-700">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor} ${config.color.replace('text-', 'bg-')} ${getWidthClass(percentage)}`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Avg Response Time</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.avgResponseTime}h</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Lost Rate</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.total > 0 ? (stats.lost / stats.total * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.submitted}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enquiry Details</CardTitle>
              <CardDescription>Detailed list of all sales enquiries</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Search enquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquiry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Expected Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : enquiries.length ? (
                enquiries.map((enquiry: any, index: number) => {
                  const statusConfig = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.pending;
                  const enquiryId = enquiry.enquiryOrderId || enquiry.id || String(index);
                  const enquiryNo = enquiry.enquiryOrderNo || enquiry.enquiryNumber || enquiryId.slice(0, 8);
                  const contact = enquiry.contactName || enquiry.contactPerson || enquiry.buyerEmail || enquiry.contactEmail || '-';
                  const val = enquiry.totalValue || enquiry.expectedValue;
                  return (
                    <TableRow key={enquiryId}>
                      <TableCell className="font-medium">
                        {enquiryNo}
                      </TableCell>
                      <TableCell>
                        {enquiry.createdAt
                          ? new Date(enquiry.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{enquiry.customerName || enquiry.customer?.name || enquiry.buyerName || '-'}</TableCell>
                      <TableCell>{contact}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.bgColor} variant="secondary">
                          <span className={statusConfig.color}>{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {val !== undefined
                          ? `$${Number(val).toLocaleString()}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No enquiries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-slate-500">
              Showing {enquiries.length} of {totalEnquiries} enquiries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
