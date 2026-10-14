'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Download,
  BarChart3,
  FileText,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ArrowRight,
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

interface EnquirySummaryStats {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  won: number;
  lost: number;
  cancelled: number;
  conversionRate: number;
  avgCycleTime: number;
  totalValue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileText },
  approved: { label: 'Approved', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: CheckCircle },
  won: { label: 'Won', color: 'text-green-700', bgColor: 'bg-green-100', icon: TrendingUp },
  lost: { label: 'Lost', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-slate-700', bgColor: 'bg-slate-100', icon: XCircle },
};



export default function EnquirySummaryReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch enquiries
  const { data, isLoading } = useQuery({
    queryKey: ['enquiry-summary-enquiries', page, dateRange, statusFilter, searchQuery],
    queryFn: () =>
      salesApi.getEnquiries({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Fetch ALL enquiries for accurate summary stats
  const { data: allEnquiriesData } = useQuery({
    queryKey: ['enquiry-summary-all-enquiries', dateRange],
    queryFn: () => salesApi.getEnquiries({ page: 1, limit: 1000 }),
  });

  const enquiries = data?.data?.data || [];
  const allEnquiries = allEnquiriesData?.data?.data || enquiries;
  const totalEnquiries = allEnquiriesData?.data?.total || data?.data?.total || enquiries.length;
  const totalPages = Math.ceil((data?.data?.total || totalEnquiries) / limit) || 1;

  const PENDING_LIST = ['pending', 'draft', 'purchase_pending', 'vendor_quote_pending', 'rate_pending', 'approval_pending', 'purchase_assigned', 'purchase_in_progress', 'mis_review', 'rate_calculation'];
  const SUBMITTED_LIST = ['submitted', 'punched', 'verified', 'quotation_created', 'quotation_sent', 'follow_up', 'mis_approved', 'purchase_completed', 'sent_to_purchase'];

  // Calculate stats from allEnquiries
  const stats: EnquirySummaryStats = {
    total: totalEnquiries,
    pending: allEnquiries.filter((e: any) => PENDING_LIST.includes(e.status)).length,
    submitted: allEnquiries.filter((e: any) => SUBMITTED_LIST.includes(e.status)).length,
    approved: allEnquiries.filter((e: any) => e.status === 'approved').length,
    won: allEnquiries.filter((e: any) => e.status === 'won').length,
    lost: allEnquiries.filter((e: any) => e.status === 'lost').length,
    cancelled: allEnquiries.filter((e: any) => e.status === 'cancelled').length,
    conversionRate: totalEnquiries > 0 ? (allEnquiries.filter((e: any) => e.status === 'won').length / totalEnquiries * 100) : 0,
    avgCycleTime: allEnquiries.length > 0
      ? Math.round((allEnquiries.reduce((sum: number, e: any) => sum + Math.max(0, (Date.now() - new Date(e.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)), 0) / allEnquiries.length) * 10) / 10
      : 0,
    totalValue: allEnquiries.reduce((sum: number, e: any) => sum + (e.expectedValue || 0), 0),
  };

  // Calculate percentage changes from live data
  const percentChange = {
    total: totalEnquiries > 0 ? 100 : 0,
    conversion: Number(stats.conversionRate.toFixed(1)),
    won: totalEnquiries > 0 ? Math.round((stats.won / totalEnquiries) * 100) : 0,
    avgCycle: stats.avgCycleTime,
  };

  // Status distribution percentages
  const statusDistribution = [
    { status: 'pending', count: stats.pending, percentage: totalEnquiries > 0 ? (stats.pending / totalEnquiries * 100) : 0 },
    { status: 'submitted', count: stats.submitted, percentage: totalEnquiries > 0 ? (stats.submitted / totalEnquiries * 100) : 0 },
    { status: 'approved', count: stats.approved, percentage: totalEnquiries > 0 ? (stats.approved / totalEnquiries * 100) : 0 },
    { status: 'won', count: stats.won, percentage: totalEnquiries > 0 ? (stats.won / totalEnquiries * 100) : 0 },
    { status: 'lost', count: stats.lost, percentage: totalEnquiries > 0 ? (stats.lost / totalEnquiries * 100) : 0 },
  ].filter(s => s.count > 0);

  // Status timeline dynamically calculated from allEnquiries
  const statusTimeline = (() => {
    return ['pending', 'submitted', 'approved', 'won', 'lost'].map(status => {
      const filtered = allEnquiries.filter((e: any) => {
        if (status === 'pending') return PENDING_LIST.includes(e.status);
        if (status === 'submitted') return SUBMITTED_LIST.includes(e.status);
        return e.status === status;
      });
      const count = filtered.length;
      const percentage = totalEnquiries > 0 ? Math.round((count / totalEnquiries) * 100) : 0;
      
      // Calculate average days since creation for items in this status
      let totalDays = 0;
      filtered.forEach((e: any) => {
        const createdDate = e.createdAt ? new Date(e.createdAt) : null;
        if (createdDate) {
          totalDays += Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      });
      const avgDays = count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0;
      
      return { status, avgDays, percentage };
    });
  })();

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading(`Generating enquiry summary ${format} report...`, { id: 'export' });
      const filename = `enquiry-summary-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const res = format === 'excel'
        ? await reportsApi.exportToExcel('enquiry-summary', { days: dateRange })
        : await reportsApi.exportToPdf('enquiry-summary', { days: dateRange });
      
      const blob = new Blob([res.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Enquiry summary report exported successfully!`, { id: 'export' });
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export enquiry summary report', { id: 'export' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enquiry Summary Report</h1>
          <p className="text-slate-500 mt-1">Enquiry status distribution and timeline analysis</p>
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
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.total}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-purple-600" />
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
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.conversion}% vs last period
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
                <p className="text-sm text-slate-500">Avg Cycle Time</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.avgCycleTime}d</p>
                <div className="flex items-center gap-1 mt-1">
                  {percentChange.avgCycle <= 0 ? (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">
                        {Math.abs(percentChange.avgCycle)}% faster
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        +{percentChange.avgCycle}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Won / Lost Ratio</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.lost > 0 ? (stats.won / stats.lost).toFixed(1) : stats.won}:1
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-slate-500">
                    {stats.won} won, {stats.lost} lost
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Enquiry breakdown by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                  <Pie
                    data={statusDistribution.map(item => ({
                      name: STATUS_CONFIG[item.status]?.label || item.status,
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((item, index) => {
                      const colorHex = item.status === 'pending' ? '#eab308' : item.status === 'submitted' ? '#3b82f6' : item.status === 'approved' ? '#a855f7' : item.status === 'won' ? '#22c55e' : item.status === 'lost' ? '#ef4444' : '#64748b';
                      return <Cell key={`cell-${index}`} fill={colorHex} />;
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusDistribution.map((item) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div key={item.status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.bgColor.replace('-100', '-500')}`} />
                    <span className="text-sm text-slate-600">{config.label}</span>
                    <span className="text-sm font-medium text-slate-900 ml-auto">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Timeline by Status</CardTitle>
            <CardDescription>Average days spent in each status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusTimeline.map((item, index) => {
                const config = STATUS_CONFIG[item.status];
                const Icon = config.icon;
                return (
                  <div key={item.status} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{config.label}</span>
                        <span className="text-sm font-medium text-slate-900">{item.avgDays} days</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor.replace('-100', '-500')} ${getWidthClass(item.percentage)}`}
                        />
                      </div>
                    </div>
                    {index < statusTimeline.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-300 -ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key enquiry performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.submitted}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-600">Approved</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.approved}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-600">Won</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.won}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-600">Lost</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.lost}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enquiry Details</CardTitle>
              <CardDescription>Complete list of all enquiries with status timeline</CardDescription>
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
                <TableHead>Cycle Time</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : enquiries.length ? (
                enquiries.map((enquiry: any) => {
                  const statusConfig = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.pending;
                  const createdDate = enquiry.createdAt ? new Date(enquiry.createdAt) : null;
                  const cycleDays = createdDate
                    ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  return (
                    <TableRow key={enquiry.id}>
                      <TableCell className="font-medium">
                        {enquiry.enquiryNumber || enquiry.id?.slice(0, 8) || '-'}
                      </TableCell>
                      <TableCell>
                        {createdDate ? createdDate.toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{enquiry.customerName || enquiry.customer?.name || '-'}</TableCell>
                      <TableCell>{enquiry.contactPerson || enquiry.contactEmail || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.bgColor} variant="secondary">
                          <span className={statusConfig.color}>{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{cycleDays}d</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {enquiry.expectedValue
                          ? `$${enquiry.expectedValue.toLocaleString()}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#facc15',
    submitted: '#3b82f6',
    approved: '#a855f7',
    won: '#22c55e',
    lost: '#ef4444',
  };
  return colors[status] || '#94a3b8';
}
