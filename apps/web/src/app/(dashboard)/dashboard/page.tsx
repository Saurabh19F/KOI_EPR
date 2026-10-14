'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, fmsApi, purchaseApi, rateApi, reportsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Package,
  Users,
  BarChart3,
  DollarSign,
  ArrowDownRight,
  Target,
  RefreshCw,
  Zap,
  ArrowUp,
  FileText,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const userRoles = useMemo(() => {
    const roles = user?.roles || [];
    return roles.map((r: any) => (typeof r === 'string' ? r : r.roleCode || r.roleName || ''));
  }, [user]);

  const userPermissions = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = user?.isSuperAdmin || userRoles.includes('ADMIN');
  const isManagement = userRoles.includes('MANAGEMENT');
  const isSalesRole = userRoles.includes('SALES_USER') || userRoles.includes('SALES_MANAGER');
  const isPurchaseRole = userRoles.includes('PURCHASE_USER') || userRoles.includes('PURCHASE_MANAGER');
  const isCostingRole = userRoles.includes('COSTING_USER') || userRoles.includes('COSTING_MANAGER');
  const isMIS = userRoles.includes('MIS_USER') || userRoles.includes('MIS');

  const hasPurchaseAccess = isAdmin || isManagement || isPurchaseRole || isCostingRole || isMIS || userPermissions.includes('PURCHASE_VIEW');
  const hasRateAccess = isAdmin || userRoles.includes('MANAGEMENT') || isCostingRole || userPermissions.includes('RATE_VIEW');
  const hasFmsAccess = isAdmin || isManagement || isCostingRole || isMIS || userPermissions.includes('FMS_VIEW');
  const hasSalesAccess = isAdmin || isManagement || isSalesRole || isMIS || userPermissions.includes('SALES_VIEW');

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsApi.getDashboardStats(),
    refetchInterval: 60000,
  });

  const { data: enquiriesData, isLoading: loadingEnquiries, refetch: refetchEnquiries } = useQuery({
    queryKey: ['enquiries', { limit: 5 }],
    queryFn: () => salesApi.getEnquiries({ limit: 5 }),
    enabled: hasSalesAccess,
  });

  const { data: tasksData, isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', { limit: 5 }],
    queryFn: () => fmsApi.getMyTasks({ limit: 5 }),
    enabled: hasFmsAccess,
  });

  const { data: delayedData, refetch: refetchDelayed } = useQuery({
    queryKey: ['tasks', 'delayed'],
    queryFn: () => fmsApi.getDelayedTasks({ limit: 10 }),
    enabled: hasFmsAccess,
  });

  const { data: fmsStats } = useQuery({
    queryKey: ['fms-dashboard-stats'],
    queryFn: () => fmsApi.getDashboardStats(),
    enabled: hasFmsAccess,
  });

  const { data: purchaseData } = useQuery({
    queryKey: ['purchase-quotes'],
    queryFn: () => purchaseApi.getQuotes({ limit: 100 }),
    enabled: hasPurchaseAccess,
  });

  const { data: rateData } = useQuery({
    queryKey: ['rate-analysis'],
    queryFn: () => rateApi.getAnalysis({ limit: 100 }),
    enabled: hasRateAccess,
  });

  const { data: currencyData } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: rateApi.getCurrencyRates,
    enabled: hasRateAccess,
  });

  const stats = dashboardStats?.data || {};

  const metrics = useMemo(() => {
    const enquiries = enquiriesData?.data?.data || [];
    const purchases = purchaseData?.data?.data || [];

    const totalEnquiries = stats.totalEnquiries || enquiries.length;
    const wonEnquiries = enquiries.filter((e: any) => e.status === 'won').length;
    const conversionRate = totalEnquiries > 0 ? ((wonEnquiries / totalEnquiries) * 100).toFixed(1) : '0';
    const pendingTasks = fmsStats?.data?.pending || 0;
    const delayedTasks = fmsStats?.data?.delayed || 0;
    const completedTasks = fmsStats?.data?.completed || 0;

    return {
      totalEnquiries,
      wonEnquiries,
      conversionRate,
      pendingTasks,
      delayedTasks,
      completedTasks,
      totalQuotes: purchases.length,
    };
  }, [enquiriesData, purchaseData, fmsStats, stats]);

  const kpis = useMemo(() => {
    const items: Array<{title: string; value: any; trend: string; trendUp: boolean; icon: any; tone: string; href: string}> = [];

    if (hasSalesAccess) {
      items.push({
        title: 'Total Enquiries',
        value: metrics.totalEnquiries,
        trend: '+12%',
        trendUp: true,
        icon: ShoppingCart,
        tone: 'bg-sky-50 text-sky-700 border-sky-100',
        href: '/dashboard/sales',
      });
      items.push({
        title: 'Win Rate',
        value: `${metrics.conversionRate}%`,
        trend: '+5%',
        trendUp: true,
        icon: Target,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        href: '/dashboard/reports',
      });
    }

    if (hasFmsAccess) {
      items.push({
        title: 'Pending Tasks',
        value: metrics.pendingTasks,
        trend: metrics.delayedTasks > 0 ? `${metrics.delayedTasks} delayed` : 'On track',
        trendUp: metrics.delayedTasks === 0,
        icon: ClipboardList,
        tone: 'bg-violet-50 text-violet-700 border-violet-100',
        href: '/dashboard/fms',
      });
      items.push({
        title: 'Completed Today',
        value: metrics.completedTasks,
        trend: '+8%',
        trendUp: true,
        icon: CheckCircle,
        tone: 'bg-[#f4eadc] text-[#8a5b25] border-[#ead8bd]',
        href: '/dashboard/fms?filter=completed',
      });
    }

    if (hasPurchaseAccess && !hasSalesAccess && !hasFmsAccess) {
      items.push({
        title: 'Purchase Quotes',
        value: metrics.totalQuotes,
        trend: 'Active',
        trendUp: true,
        icon: FileText,
        tone: 'bg-blue-50 text-blue-700 border-blue-100',
        href: '/dashboard/purchase',
      });
    }

    return items;
  }, [hasSalesAccess, hasFmsAccess, hasPurchaseAccess, metrics]);

  const quickActions = useMemo(() => {
    const actions: Array<{title: string; icon: any; href: string; color: string}> = [];

    if (hasSalesAccess) {
      actions.push({ title: 'New Enquiry', icon: ShoppingCart, href: '/dashboard/sales/new', color: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700' });
      actions.push({ title: 'Add Customer', icon: Users, href: '/dashboard/masters/customers', color: 'hover:border-[#d8bf98] hover:bg-[#f4eadc] hover:text-[#8a5b25]' });
    }

    if (hasPurchaseAccess) {
      actions.push({ title: 'Add Product', icon: Package, href: '/dashboard/masters/products', color: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' });
    }

    if (hasRateAccess) {
      actions.push({ title: 'Rate Analysis', icon: TrendingUp, href: '/dashboard/rate/new', color: 'hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700' });
    }

    actions.push({ title: 'Reports', icon: BarChart3, href: '/dashboard/reports', color: 'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700' });

    if (hasFmsAccess) {
      actions.push({ title: 'View Tasks', icon: Zap, href: '/dashboard/fms', color: 'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700' });
    }

    return actions;
  }, [hasSalesAccess, hasPurchaseAccess, hasRateAccess, hasFmsAccess]);

  const handleRefresh = () => {
    if (hasSalesAccess) refetchEnquiries();
    if (hasFmsAccess) {
      refetchTasks();
      refetchDelayed();
    }
  };

  const dashboardTitle = isSalesRole && !isAdmin
    ? 'Sales Dashboard'
    : isPurchaseRole && !isAdmin
      ? 'Purchase Dashboard'
      : isCostingRole && !isAdmin
        ? 'Costing Dashboard'
        : 'Dashboard';

  const dashboardSubtitle = isSalesRole && !isAdmin
    ? 'Your sales enquiries, orders, and performance.'
    : isPurchaseRole && !isAdmin
      ? 'Purchase orders, quotes, and vendor tracking.'
      : isCostingRole && !isAdmin
        ? 'Rate analysis and costing overview.'
        : 'Live work across sales, purchase, rate, and fulfilment.';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6b36]">
            {isSalesRole && !isAdmin ? 'Sales overview' : 'Operations overview'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{dashboardTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">{dashboardSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700">Live</span>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-lg border border-[#ded4c6] bg-white p-2 transition-colors hover:bg-[#fbfaf6]"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className={`grid grid-cols-2 gap-3 ${kpis.length >= 4 ? 'lg:grid-cols-4' : kpis.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.title} href={kpi.href}>
                <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className={`rounded-lg border p-2 transition-transform group-hover:scale-105 ${kpi.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${kpi.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {kpi.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {kpi.trend}
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950">{kpi.value}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">{kpi.title}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Currency Rates Banner - only for admin/management/costing roles */}
      {hasRateAccess && (
        <Card className="border-[#173f37] bg-[#0f2f29]">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <DollarSign className="h-5 w-5 text-[#f0d7ae]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Live Currency Rates</p>
                  <p className="text-xs text-emerald-50/70">Updated in real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {currencyData?.data?.slice(0, 4).map((rate: any) => (
                  <div key={rate.rateId || rate.id} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                    <Badge variant="outline" className="border-white/20 bg-transparent font-mono text-xs text-emerald-50">
                      {rate.currencyCode}
                    </Badge>
                    <span className="text-sm font-semibold text-white">
                      ₹{Number(((rate.actualRate && typeof rate.actualRate === 'object' ? rate.actualRate.rate : rate.actualRate) || rate.rate || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
                {!currencyData?.data?.length && (
                  <p className="text-sm text-slate-400">
                    No rates configured.{' '}
                    <Link href="/dashboard/masters/currencies" className="text-[#f0d7ae] hover:underline">
                      Set up currencies
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className={`grid grid-cols-1 gap-4 ${hasFmsAccess && hasSalesAccess ? 'lg:grid-cols-3' : ''}`}>
        {/* Recent Enquiries */}
        {hasSalesAccess && (
          <div className={`overflow-hidden rounded-lg border border-[#e5dfd4] bg-white shadow-card ${hasFmsAccess ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Enquiries</h2>
              </div>
              <Link href="/dashboard/sales" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loadingEnquiries ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-8 w-8 rounded-lg bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enquiriesData?.data?.data?.slice(0, 5).length ? (
                enquiriesData.data.data.slice(0, 5).map((enquiry: any) => (
                  <Link
                    key={enquiry.enquiryOrderId || enquiry.enquiryId}
                    href={`/dashboard/sales/${enquiry.enquiryOrderId || enquiry.enquiryId}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2f29] text-xs font-bold text-white shadow-sm">
                        {(enquiry.enquiryOrderNo || enquiry.enquiryNumber || 'ENQ').slice(-4)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{enquiry.enquiryOrderNo || enquiry.enquiryNumber || 'New Enquiry'}</p>
                        <p className="text-sm text-slate-500">{enquiry.customerName || 'No customer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enquiry.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                        enquiry.status === 'lost' ? 'bg-red-100 text-red-700' :
                        enquiry.status === 'approved' ? 'bg-green-100 text-green-700' :
                        enquiry.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {(enquiry.status || 'draft').replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(enquiry.enquiryDate || enquiry.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No enquiries yet</p>
                  <p className="text-sm text-slate-400 mt-1">Start by creating your first enquiry</p>
                  <Link href="/dashboard/sales/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                    Create Enquiry <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Tasks - only for roles with FMS access */}
        {hasFmsAccess && (
          <div className="overflow-hidden rounded-lg border border-[#e5dfd4] bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">My Tasks</h2>
              </div>
              <Link href="/dashboard/fms" className="text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loadingTasks ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-8 w-8 rounded-lg bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tasksData?.data?.data?.length ? (
                tasksData.data.data.map((task: any) => (
                  <Link
                    key={task.taskId}
                    href={`/dashboard/fms/${task.taskId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className={`p-2 rounded-lg ${
                      task.status === 'completed' ? 'bg-emerald-100' :
                      task.status === 'delayed' ? 'bg-red-100' :
                      task.status === 'in_progress' ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : task.status === 'delayed' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : task.status === 'in_progress' ? (
                        <Clock className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ClipboardList className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-slate-950">{task.stepName || task.taskName || 'Task'}</p>
                      <p className="text-sm text-slate-500">Due: {formatDate(task.slaDeadline)}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'delayed' ? 'bg-red-100 text-red-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {(task.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <CheckCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-slate-600 font-medium">All caught up!</p>
                  <p className="text-sm text-slate-400 mt-1">No pending tasks assigned</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase section for purchase-only roles */}
        {hasPurchaseAccess && !hasSalesAccess && !hasFmsAccess && (
          <div className="overflow-hidden rounded-lg border border-[#e5dfd4] bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Purchase Quotes</h2>
              </div>
              <Link href="/dashboard/purchase" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {purchaseData?.data?.data?.slice(0, 5).length ? (
                purchaseData.data.data.slice(0, 5).map((quote: any) => (
                  <Link
                    key={quote.quoteId || quote.id}
                    href={`/dashboard/purchase/${quote.quoteId || quote.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                        {(quote.quoteNumber || 'PQ').slice(-4)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{quote.quoteNumber || 'Quote'}</p>
                        <p className="text-sm text-slate-500">{quote.vendorName || 'No vendor'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      quote.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      quote.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {(quote.status || 'draft').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Truck className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-slate-600 font-medium">No purchase quotes</p>
                  <p className="text-sm text-slate-400 mt-1">Start by creating a purchase quote</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-[#e5dfd4] bg-white p-4 shadow-card">
        <h2 className="mb-3 font-bold text-slate-950">Quick Actions</h2>
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${quickActions.length >= 6 ? 'lg:grid-cols-6' : quickActions.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#dcd4c8] p-3 text-slate-600 transition-all ${action.color}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-center text-sm font-bold">{action.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
