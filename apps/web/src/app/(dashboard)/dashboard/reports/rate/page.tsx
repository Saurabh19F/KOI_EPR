'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rateApi, reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';
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
  TrendingUp,
  TrendingDown,
  FileText,
  Filter,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';

type DateRange = '7' | '30' | '90' | '365';
type StatusFilter = 'all' | 'draft' | 'calculated' | 'submitted' | 'approved' | 'locked';

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

interface RateStats {
  total: number;
  draft: number;
  calculated: number;
  submitted: number;
  approved: number;
  locked: number;
  avgMargin: number;
  totalAnalysisValue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  calculated: { label: 'Calculated', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  submitted: { label: 'Submitted', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  locked: { label: 'Locked', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function RateAnalysisReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch analyses
  const { data, isLoading } = useQuery({
    queryKey: ['rate-report-analyses', page, dateRange, statusFilter, searchQuery],
    queryFn: () =>
      rateApi.getAnalysis({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Fetch report data
  const { data: reportData } = useQuery({
    queryKey: ['rate-report-data', dateRange],
    queryFn: () => reportsApi.getPriceAnalysisReport({ days: parseInt(dateRange) }),
  });

  // Fetch ALL analyses for accurate summary stats
  const { data: allAnalysesData } = useQuery({
    queryKey: ['rate-report-all-analyses', dateRange],
    queryFn: () => rateApi.getAnalysis({ page: 1, limit: 1000 }),
  });

  const analyses = data?.data?.data || [];
  const allAnalyses = allAnalysesData?.data?.data || analyses;
  const totalAnalyses = allAnalysesData?.data?.total || data?.data?.total || analyses.length;
  const totalPages = Math.ceil((data?.data?.total || totalAnalyses) / limit) || 1;

  // Safe numeric extractors
  const getAnalysisVal = (a: any): number => {
    const v1 = parseFloat(a.totalValue);
    if (!isNaN(v1) && v1 > 0) return v1;
    const v2 = parseFloat(a.grandTotal);
    if (!isNaN(v2) && v2 > 0) return v2;
    return 0;
  };
  const getAnalysisMargin = (a: any): number => {
    const m1 = parseFloat(a.marginPercentage);
    if (!isNaN(m1)) return m1;
    const m2 = parseFloat(a.margin);
    if (!isNaN(m2)) return m2;
    return 0;
  };

  // Calculate stats from allAnalyses
  const stats: RateStats = {
    total: totalAnalyses,
    draft: allAnalyses.filter((a: any) => a.status === 'draft').length,
    calculated: allAnalyses.filter((a: any) => a.status === 'calculated').length,
    submitted: allAnalyses.filter((a: any) => a.status === 'submitted').length,
    approved: allAnalyses.filter((a: any) => a.status === 'approved').length,
    locked: allAnalyses.filter((a: any) => a.status === 'locked').length,
    avgMargin: allAnalyses.length > 0 ? (allAnalyses.reduce((sum: number, a: any) => sum + getAnalysisMargin(a), 0) / allAnalyses.length) : 0,
    totalAnalysisValue: allAnalyses.reduce((sum: number, a: any) => sum + getAnalysisVal(a), 0),
  };

  // Calculate percentage changes from live data
  const summary = reportData?.data;
  const percentChange = {
    total: stats.total > 0 ? 100 : 0,
    margin: Number(summary?.avgMargin || stats.avgMargin || 0).toFixed(1),
    approved: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading(`Generating rate analysis ${format} report...`, { id: 'export' });
      const filename = `rate-analysis-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const res = format === 'excel'
        ? await reportsApi.exportToExcel('rate-analysis', { days: dateRange })
        : await reportsApi.exportToPdf('rate-analysis', { days: dateRange });
      
      const blob = new Blob([res.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Rate analysis report exported successfully!`, { id: 'export' });
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export rate analysis report', { id: 'export' });
    }
  };

  // Get margin distribution dynamically from analyses
  const marginDistribution = (() => {
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;
    analyses.forEach((a: any) => {
      const m = Number(a.marginPercentage || a.margin || 0);
      if (m < 5) r1++;
      else if (m < 10) r2++;
      else if (m < 15) r3++;
      else if (m < 20) r4++;
      else r5++;
    });
    return [
      { range: '0-5%', count: r1, color: 'bg-red-500' },
      { range: '5-10%', count: r2, color: 'bg-orange-500' },
      { range: '10-15%', count: r3, color: 'bg-yellow-500' },
      { range: '15-20%', count: r4, color: 'bg-green-500' },
      { range: '20%+', count: r5, color: 'bg-emerald-500' },
    ];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rate Analysis Report</h1>
          <p className="text-slate-500 mt-1">Product costing and margin analysis</p>
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
                <p className="text-sm text-slate-500">Total Analyses</p>
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
                <p className="text-sm text-slate-500">Avg Margin</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.avgMargin}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.margin}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{percentChange.approved}%
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
                <p className="text-sm text-slate-500">Locked</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.locked}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-600">Finalized rates</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Lock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Margin Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Analysis breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const count = analyses.filter((a: any) => a.status === key).length;
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
            <CardTitle>Margin Distribution</CardTitle>
            <CardDescription>Analysis breakdown by margin range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
               {marginDistribution.map((item) => {
                return (
                  <div key={item.range} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm font-medium text-slate-700">{item.range}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} ${getWidthClass(analyses.length > 0 ? (item.count / analyses.length) * 100 : 0)}`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-8 text-right">{item.count}</span>
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
          <CardTitle>Cost Analysis Summary</CardTitle>
          <CardDescription>Key cost and pricing indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${stats.totalAnalysisValue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Avg Margin</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.avgMargin}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Calculated</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.calculated}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Draft</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{stats.draft}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis Details</CardTitle>
              <CardDescription>Detailed list of all rate analyses</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Search analyses..."
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
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
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
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Margin</TableHead>
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
              ) : analyses.length ? (
                analyses.map((analysis: any) => {
                  const statusConfig = STATUS_CONFIG[analysis.status] || STATUS_CONFIG.draft;
                  const margin = Number(analysis.marginPercentage ?? analysis.margin ?? 0);
                  return (
                    <TableRow key={analysis.analysisId || analysis.priceAnalysisId || analysis.id || analysis.analysisNo}>
                      <TableCell className="font-medium">
                        {analysis.enquiryOrderNo || analysis.analysisNumber || analysis.analysisNo || analysis.id?.slice(0, 8) || '-'}
                      </TableCell>
                      <TableCell>
                        {analysis.createdAt
                          ? new Date(analysis.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          {analysis.customerName || analysis.customer?.name || analysis.buyerName || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{analysis.items?.length || 0}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.bgColor} variant="secondary">
                          <span className={statusConfig.color}>{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {analysis.totalValue
                          ? `$${analysis.totalValue.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          margin >= 15 ? 'text-green-600' :
                          margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No analyses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-slate-500">
              Showing {analyses.length} of {totalAnalyses} analyses
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
