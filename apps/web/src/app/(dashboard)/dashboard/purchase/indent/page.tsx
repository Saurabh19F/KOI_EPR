'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseIndentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  raised: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function IndentDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardFilters, setDashboardFilters] = useState({
    search: '',
    salesPersonName: '',
    status: '',
    page: 1,
  });
  const [reportFilters, setReportFilters] = useState({
    search: '',
    salesPersonName: '',
    assignedTo: '',
    status: '',
    page: 1,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['indent-stats'],
    queryFn: () => purchaseIndentApi.getStats(),
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['indent-dashboard', dashboardFilters],
    queryFn: () =>
      purchaseIndentApi.getDashboard({
        page: dashboardFilters.page,
        limit: 50,
        search: dashboardFilters.search || undefined,
        salesPersonName: dashboardFilters.salesPersonName || undefined,
        status: dashboardFilters.status || undefined,
      }),
  });

  // Fetch report data
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['indent-report', reportFilters],
    queryFn: () =>
      purchaseIndentApi.getReport({
        page: reportFilters.page,
        limit: 100,
        search: reportFilters.search || undefined,
        salesPersonName: reportFilters.salesPersonName || undefined,
        assignedTo: reportFilters.assignedTo || undefined,
        status: reportFilters.status || undefined,
      }),
    enabled: activeTab === 'report',
  });

  // Fetch pendancy data
  const { data: pendancyData, isLoading: pendancyLoading } = useQuery({
    queryKey: ['indent-pendancy'],
    queryFn: () => purchaseIndentApi.getPendancy(),
    enabled: activeTab === 'pendancy',
  });

  const stats = statsData?.data || {};
  const dashboard = dashboardData?.data || { data: [], persons: [], pagination: {} };
  const report = reportData?.data || { data: [], pagination: {} };
  const pendancy = pendancyData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Indent Dashboard</h1>
        <p className="text-gray-500">Track indent assignments per person per order</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Items</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalItems || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Across all orders</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Indent Raised</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.raisedItems || 0}</p>
                <p className="text-xs text-slate-400 mt-1">{stats.raisedPercent || 0}% complete</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Items</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingItems || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Not yet raised</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Orders Completed</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.completedOrders || 0}/{stats.totalOrders || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">{stats.pendingOrders || 0} pending</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Dashboard / Report / Pendancy */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="pendancy" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Pendancy
          </TabsTrigger>
        </TabsList>

        {/* ========== DASHBOARD TAB ========== */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search order no, sales person..."
                      className="pl-9"
                      value={dashboardFilters.search}
                      onChange={(e) =>
                        setDashboardFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                      }
                    />
                  </div>
                </div>
                <Select
                  value={dashboardFilters.status}
                  onValueChange={(v) =>
                    setDashboardFilters((f) => ({ ...f, status: v === 'all' ? '' : v, page: 1 }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Per-Order Indent Tracking by Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : dashboard.data.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-12">
                  No indent data available. Sync orders from Sales Enquiry to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white z-10 min-w-[60px]">S.No</TableHead>
                        <TableHead className="min-w-[120px]">Order No.</TableHead>
                        <TableHead className="min-w-[100px]">Order Date</TableHead>
                        <TableHead className="min-w-[120px]">Sales Person</TableHead>
                        {/* Dynamic person columns */}
                        {(dashboard.persons || []).map((person: string) => (
                          <TableHead
                            key={person}
                            colSpan={3}
                            className="text-center border-l min-w-[240px]"
                          >
                            {person}
                          </TableHead>
                        ))}
                        <TableHead className="border-l min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[150px]">Pending From</TableHead>
                      </TableRow>
                      <TableRow className="bg-slate-50">
                        <TableHead className="sticky left-0 bg-slate-50 z-10" />
                        <TableHead />
                        <TableHead />
                        <TableHead />
                        {(dashboard.persons || []).map((person: string) => (
                          <>
                            <TableHead
                              key={`${person}-total`}
                              className="text-center text-xs border-l"
                            >
                              Total Per Item
                            </TableHead>
                            <TableHead
                              key={`${person}-raised`}
                              className="text-center text-xs"
                            >
                              Indent Raised
                            </TableHead>
                            <TableHead
                              key={`${person}-not`}
                              className="text-center text-xs"
                            >
                              Not Raised
                            </TableHead>
                          </>
                        ))}
                        <TableHead className="border-l" />
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.data.map((row: any, idx: number) => (
                        <TableRow key={row.indentOrderId || idx}>
                          <TableCell className="sticky left-0 bg-white z-10 font-medium">
                            {(dashboardFilters.page - 1) * 50 + idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium text-blue-600">
                            {row.orderNo || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.orderDate ? formatDate(row.orderDate) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{row.salesPersonName || '-'}</TableCell>
                          {/* Per-person breakdown */}
                          {(dashboard.persons || []).map((person: string) => {
                            const pb = row.personBreakdown?.[person];
                            return (
                              <>
                                <TableCell
                                  key={`${row.indentOrderId}-${person}-total`}
                                  className="text-center border-l font-medium"
                                >
                                  {pb?.totalPerItemOrder || 0}
                                </TableCell>
                                <TableCell
                                  key={`${row.indentOrderId}-${person}-raised`}
                                  className="text-center"
                                >
                                  {pb?.indentRaisedPerItem ? (
                                    <span className="text-green-600 font-medium">
                                      {pb.indentRaisedPerItem}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">0</span>
                                  )}
                                </TableCell>
                                <TableCell
                                  key={`${row.indentOrderId}-${person}-not`}
                                  className="text-center"
                                >
                                  {pb?.indentNotRaisedPerItem ? (
                                    <span className="text-red-600 font-medium">
                                      {pb.indentNotRaisedPerItem}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">0</span>
                                  )}
                                </TableCell>
                              </>
                            );
                          })}
                          <TableCell className="border-l">
                            <Badge className={STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}>
                              {row.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.pendingFrom ? (
                              <span className="text-amber-600 font-medium">{row.pendingFrom}</span>
                            ) : (
                              <span className="text-green-600">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {dashboard.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {dashboard.pagination.page} of {dashboard.pagination.totalPages} ({dashboard.pagination.total} orders)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dashboardFilters.page <= 1}
                      onClick={() => setDashboardFilters((f) => ({ ...f, page: f.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dashboardFilters.page >= dashboard.pagination.totalPages}
                      onClick={() => setDashboardFilters((f) => ({ ...f, page: f.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== REPORT TAB ========== */}
        <TabsContent value="report" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search order, product, description..."
                      className="pl-9"
                      value={reportFilters.search}
                      onChange={(e) =>
                        setReportFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                      }
                    />
                  </div>
                </div>
                <Select
                  value={reportFilters.assignedTo || 'all'}
                  onValueChange={(v) =>
                    setReportFilters((f) => ({ ...f, assignedTo: v === 'all' ? '' : v, page: 1 }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {(dashboard.persons || []).map((person: string) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={reportFilters.status || 'all'}
                  onValueChange={(v) =>
                    setReportFilters((f) => ({ ...f, status: v === 'all' ? '' : v, page: 1 }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="raised">Raised</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Report Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item-Level Indent Report</CardTitle>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : report.data.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-12">No report data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[60px]">S.No</TableHead>
                        <TableHead className="min-w-[120px]">Order No.</TableHead>
                        <TableHead className="min-w-[100px]">Order Date</TableHead>
                        <TableHead className="min-w-[100px]">Product Code</TableHead>
                        <TableHead className="min-w-[150px]">Product Name</TableHead>
                        <TableHead className="min-w-[120px]">Brand</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                        <TableHead className="min-w-[80px]">Unit Size</TableHead>
                        <TableHead className="min-w-[80px]">Unit/Ctn</TableHead>
                        <TableHead className="min-w-[100px]">Category</TableHead>
                        <TableHead className="min-w-[80px]">Quantity</TableHead>
                        <TableHead className="min-w-[120px]">Sales Person</TableHead>
                        <TableHead className="min-w-[120px]">Assigned To</TableHead>
                        <TableHead className="min-w-[100px]">Indent Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.data.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {(reportFilters.page - 1) * 100 + idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium text-blue-600">
                            {item.orderNo || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.orderDate ? formatDate(item.orderDate) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.productCode || '-'}</TableCell>
                          <TableCell className="text-sm">{item.productName || '-'}</TableCell>
                          <TableCell className="text-sm">{item.brandName || '-'}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {item.productDescription || '-'}
                          </TableCell>
                          <TableCell className="text-sm">{item.unitSize || '-'}</TableCell>
                          <TableCell className="text-sm">{item.unitPerCarton || '-'}</TableCell>
                          <TableCell className="text-sm">{item.categoryName || '-'}</TableCell>
                          <TableCell className="font-medium">{item.quantity || 0}</TableCell>
                          <TableCell className="text-sm">{item.salesPersonName || '-'}</TableCell>
                          <TableCell className="text-sm font-medium">{item.assignedToName || '-'}</TableCell>
                          <TableCell>
                            {item.isIndentRaised ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Raised
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Not Raised
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {report.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {report.pagination.page} of {report.pagination.totalPages} ({report.pagination.total} items)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reportFilters.page <= 1}
                      onClick={() => setReportFilters((f) => ({ ...f, page: f.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reportFilters.page >= report.pagination.totalPages}
                      onClick={() => setReportFilters((f) => ({ ...f, page: f.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== PENDANCY TAB ========== */}
        <TabsContent value="pendancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <Users className="h-4 w-4 inline mr-2 text-amber-500" />
                Indent Pendancy by Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendancyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : pendancy.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-12">
                  No pending indents found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">S.No</TableHead>
                        <TableHead className="min-w-[200px]">Person Name</TableHead>
                        <TableHead className="min-w-[160px] text-center">Total Pending Orders</TableHead>
                        <TableHead className="min-w-[160px] text-center">Total Indent Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendancy.map((row: any, idx: number) => (
                        <TableRow key={row.personName}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {row.personName}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {row.totalPendingOrder}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                              {row.totalIndentPending}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell />
                        <TableCell className="text-slate-900">Total</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full bg-blue-200 text-blue-800 font-bold text-sm">
                            {pendancy.reduce((sum: number, r: any) => sum + r.totalPendingOrder, 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full bg-amber-200 text-amber-800 font-bold text-sm">
                            {pendancy.reduce((sum: number, r: any) => sum + r.totalIndentPending, 0)}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
