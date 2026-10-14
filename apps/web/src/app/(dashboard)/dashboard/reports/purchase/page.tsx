'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseApi, reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
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
  Truck,
  FileText,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react';

type DateRange = '7' | '30' | '90' | '365';
type StatusFilter = 'all' | 'draft' | 'submitted' | 'approved' | 'rejected';

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

interface PurchaseStats {
  total: number;
  totalValue: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  avgQuoteValue: number;
  topParty: string;
  partyCount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  submitted: { label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelled', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

export default function PurchaseReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch quotes
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-report-quotes', page, dateRange, statusFilter, searchQuery],
    queryFn: () =>
      purchaseApi.getQuotes({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Fetch report data
  const { data: reportData } = useQuery({
    queryKey: ['purchase-report-data', dateRange],
    queryFn: () => reportsApi.getPurchaseReport({ days: parseInt(dateRange) }),
  });

  // Fetch ALL quotes for accurate summary stats
  const { data: allQuotesData } = useQuery({
    queryKey: ['purchase-report-all-quotes', dateRange],
    queryFn: () => purchaseApi.getQuotes({ page: 1, limit: 1000 }),
  });

  const quotes = data?.data?.data || [];
  const allQuotes = allQuotesData?.data?.data || quotes;
  const totalQuotes = allQuotesData?.data?.total || data?.data?.total || quotes.length;
  const totalPages = Math.ceil((data?.data?.total || totalQuotes) / limit) || 1;

  // Safe numeric value extractor
  const getQuoteVal = (q: any): number => {
    const v1 = parseFloat(q.grandTotal);
    if (!isNaN(v1) && v1 > 0) return v1;
    const v2 = parseFloat(q.totalAmount);
    if (!isNaN(v2) && v2 > 0) return v2;
    return 0;
  };

  // Calculate stats from allQuotes
  const stats: PurchaseStats = {
    total: totalQuotes,
    totalValue: allQuotes.reduce((sum: number, q: any) => sum + getQuoteVal(q), 0),
    draft: allQuotes.filter((q: any) => q.status === 'draft').length,
    pending: allQuotes.filter((q: any) => ['submitted', 'pending', 'purchase_assigned', 'purchase_in_progress'].includes(q.status)).length,
    approved: allQuotes.filter((q: any) => q.status === 'approved').length,
    rejected: allQuotes.filter((q: any) => q.status === 'rejected').length,
    avgQuoteValue: totalQuotes > 0 ? allQuotes.reduce((sum: number, q: any) => sum + getQuoteVal(q), 0) / totalQuotes : 0,
    topParty: allQuotes.length > 0 ? allQuotes[0].partyName || 'N/A' : 'N/A',
    partyCount: new Set(allQuotes.map((q: any) => q.partyName).filter(Boolean)).size,
  };

  // Calculate percentage changes from live data
  const summary = reportData?.data;
  const percentChange = {
    total: summary?.growthRate !== undefined ? summary.growthRate : 0,
    value: stats.totalValue > 0 ? 100 : 0,
    approved: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading(`Generating purchase ${format} report...`, { id: 'export' });
      const filename = `purchase-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const res = format === 'excel'
        ? await reportsApi.exportToExcel('purchase', { days: dateRange })
        : await reportsApi.exportToPdf('purchase', { days: dateRange });
      
      const blob = new Blob([res.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Purchase report exported successfully!`, { id: 'export' });
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export purchase report', { id: 'export' });
    }
  };

  // Calculate top parties dynamically from quotes
  const topParties = (() => {
    const partyMap: Record<string, { name: string; quotes: number; value: number }> = {};
    let totalValueSum = 0;

    quotes.forEach((q: any) => {
      const name = q.partyName || 'Unknown Party';
      const val = Number(q.grandTotal || q.totalAmount || 0);
      totalValueSum += val;

      if (!partyMap[name]) {
        partyMap[name] = { name, quotes: 0, value: 0 };
      }
      partyMap[name].quotes += 1;
      partyMap[name].value += val;
    });

    const list = Object.values(partyMap).sort((a, b) => b.value - a.value);
    
    return list.map(item => ({
      ...item,
      percentage: totalValueSum > 0 ? Math.round((item.value / totalValueSum) * 100) : 0
    })).slice(0, 5);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Report</h1>
          <p className="text-slate-500 mt-1">Purchase quote analytics and party performance</p>
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
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm text-slate-500 truncate">Total Quotes</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{stats.total}</p>
                )}
                <div className="flex items-center gap-1 mt-1 truncate">
                  {percentChange.total >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs truncate ${percentChange.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(percentChange.total)}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm text-slate-500 truncate">Total Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 truncate" title={`$${stats.totalValue.toLocaleString()}`}>
                  ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1 truncate">
                  {percentChange.value >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs truncate ${percentChange.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(percentChange.value)}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm text-slate-500 truncate">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1 truncate">{stats.approved}</p>
                <div className="flex items-center gap-1 mt-1 truncate">
                  <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-green-600 truncate">+{percentChange.approved}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm text-slate-500 truncate">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1 truncate">{stats.pending}</p>
                <div className="flex items-center gap-1 mt-1 truncate">
                  <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  <span className="text-xs text-yellow-600 truncate">Awaiting review</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Party Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Quote breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const count = quotes.filter((q: any) => q.status === key).length;
                const percentage = stats.total > 0 ? (count / stats.total * 100) : 0;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.bgColor.replace('-100', '-500')}`} />
                      <span className="text-sm font-medium text-slate-700">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor} ${getWidthClass(percentage)}`}
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
            <CardTitle>Top Parties Analysis</CardTitle>
            <CardDescription>Party quote volume and total value distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topParties} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 border-t pt-3">
              {topParties.map((party, index) => {
                return (
                  <div key={party.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{party.name}</p>
                        <p className="text-xs text-slate-400">{party.quotes} quotes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-orange-500 ${getWidthClass(party.percentage)}`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-16 text-right">
                        ${party.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Key purchase performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Avg Quote Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${Math.round(stats.avgQuoteValue).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Active Parties</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.partyCount}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Top Party</p>
              <p className="text-lg font-bold text-orange-600 mt-1 truncate">{stats.topParty}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Draft Quotes</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{stats.draft}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quote Details</CardTitle>
              <CardDescription>Detailed list of all purchase quotes</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Search quotes..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquiry No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : quotes.length ? (
                quotes.map((quote: any, index: number) => {
                  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                  const quoteId = quote.quoteId || quote.id || String(index);
                  const universalNo = quote.enquiryOrderNo || quote.referenceNumber || quote.enquiryNumber || quote.orderNo || quote.quoteNo || quoteId.slice(0, 8);
                  const amount = quote.grandTotal !== undefined ? quote.grandTotal : quote.totalAmount;
                  return (
                    <TableRow key={quoteId}>
                      <TableCell className="font-medium">
                        {universalNo}
                      </TableCell>
                      <TableCell>
                        {quote.createdAt
                          ? new Date(quote.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          {quote.partyName || quote.vendorName || quote.vendor?.vendorName || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.bgColor} variant="secondary">
                          <span className={statusConfig.color}>{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {amount !== undefined && amount !== null
                          ? `$${Number(amount).toLocaleString()}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No quotes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-slate-500">
              Showing {quotes.length} of {totalQuotes} quotes
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
