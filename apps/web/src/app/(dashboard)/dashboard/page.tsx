'use client';

import { useMemo } from 'react';
import { SalesActivity } from '@/components/dashboard/sales-activity';
import { metricAccents } from '@/lib/workspace-colors';
import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi, fmsApi, purchaseApi, rateApi, reportsApi, productionApi, qualityApi, inventoryApi, accountsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AnimatedContent } from '@/components/ui/animated-content';
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
  Factory,
  ShieldCheck,
  Boxes,
  ArrowLeftRight,
  LayoutDashboard,
  Wrench,
  Calculator,
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
  const isFmsRole = userRoles.includes('FMS_MANAGER') || userRoles.includes('FMS_USER');
  const isProductionRole = userRoles.includes('PRODUCTION_MANAGER') || userRoles.includes('PRODUCTION_USER');
  const isWarehouseRole = userRoles.includes('WAREHOUSE_MANAGER') || userRoles.includes('WAREHOUSE_USER');
  const isQualityRole = userRoles.includes('QUALITY_MANAGER') || userRoles.includes('QUALITY_USER');
  const isInventoryRole = userRoles.includes('INVENTORY_MANAGER') || userRoles.includes('INVENTORY_USER');
  const isFinanceRole = userRoles.includes('FINANCE_USER');
  const isAccountsRole = userRoles.includes('ACCOUNTS_USER') || userRoles.includes('ACCOUNTS_MANAGER');
  const isPlannerRole = userRoles.includes('PLANNER');

  const hasPurchaseAccess = isAdmin || isManagement || isPurchaseRole || isCostingRole || isMIS || userPermissions.includes('PURCHASE_VIEW');
  const hasRateAccess = isAdmin || userRoles.includes('MANAGEMENT') || isCostingRole || userPermissions.includes('RATE_VIEW');
  const hasFmsAccess = isAdmin || isManagement || isCostingRole || isMIS || userPermissions.includes('FMS_VIEW');
  const hasSalesAccess = isAdmin || isManagement || isSalesRole || isMIS || userPermissions.includes('SALES_VIEW');
  const hasProductionAccess = isAdmin || isManagement || isProductionRole || userPermissions.includes('PRODUCTION_VIEW');
  const hasWarehouseAccess = isAdmin || isManagement || isWarehouseRole || isPlannerRole || userPermissions.includes('WAREHOUSE_VIEW');
  const hasQualityAccess = isAdmin || isManagement || isQualityRole || userPermissions.includes('QUALITY_VIEW');
  const hasInventoryAccess = isAdmin || isManagement || isInventoryRole || isWarehouseRole || isPlannerRole || userPermissions.includes('INVENTORY_VIEW');
  const hasFinanceAccess = isAdmin || isManagement || isFinanceRole || isAccountsRole || userPermissions.includes('FINANCE_VIEW');
  const hasAccountsAccess = isAdmin || isManagement || isAccountsRole || userPermissions.includes('ACCOUNTS_VIEW');

  const { data: dashboardStats, dataUpdatedAt, isError: statsFailed } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsApi.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: enquiriesData, isLoading: loadingEnquiries } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['enquiries', { limit: 5 }],
    queryFn: () => salesApi.getEnquiries({ limit: 5 }),
    enabled: hasSalesAccess,
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['tasks', { limit: 5 }],
    queryFn: () => fmsApi.getMyTasks({ limit: 5 }),
    enabled: hasFmsAccess,
  });

  const { data: delayedData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['tasks', 'delayed'],
    queryFn: () => fmsApi.getDelayedTasks({ limit: 10 }),
    enabled: hasFmsAccess,
  });

  const { data: fmsStats } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['fms-dashboard-stats'],
    queryFn: () => fmsApi.getDashboardStats(),
    enabled: hasFmsAccess,
  });

  const { data: purchaseData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['purchase-quotes'],
    queryFn: () => purchaseApi.getQuotes({ limit: 10 }),
    enabled: hasPurchaseAccess,
  });

  const { data: rateData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['rate-analysis'],
    queryFn: () => rateApi.getAnalysis({ limit: 10 }),
    enabled: hasRateAccess,
  });

  const { data: currencyData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['currency-rates'],
    queryFn: rateApi.getCurrencyRates,
    enabled: hasRateAccess,
  });

  const { data: productionData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['production-jobs', { limit: 5 }],
    queryFn: () => productionApi.getJobs({ limit: 5 }),
    enabled: hasProductionAccess,
  });

  const { data: qualityData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['quality-inspections', { limit: 5 }],
    queryFn: () => qualityApi.getInspections({ limit: 5 }),
    enabled: hasQualityAccess,
  });

  const { data: warehouseStockData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['warehouse-stock-summary'],
    queryFn: () => inventoryApi.getStockSummary(),
    enabled: hasWarehouseAccess && !hasSalesAccess,
  });

  const { data: stockMovementsData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['stock-movements', { limit: 5 }],
    queryFn: () => inventoryApi.getMovements({ limit: 5 }),
    enabled: hasInventoryAccess && !hasSalesAccess,
  });

  const { data: accountsStatsData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['accounts-stats'],
    queryFn: () => accountsApi.getStats(),
    enabled: hasAccountsAccess,
  });

  const { data: pendingPOsData } = useQuery({
    meta: { dashboardOverview: true },
    queryKey: ['accounts-pending-pos', { limit: 5 }],
    queryFn: () => accountsApi.getPendingPOs({ limit: 5 }),
    enabled: hasAccountsAccess,
  });

  const stats = dashboardStats?.data;
  const taskStats = fmsStats?.data?.taskStats;
  const kpis = useMemo(() => {
    const items: Array<{title: string; value: number | string; icon: typeof ShoppingCart; href: string; detail?: string}> = [];

    if (hasSalesAccess && (isSalesRole || isAdmin || isManagement || isMIS)) {
      items.push({
        title: 'Total Enquiries',
        value: stats?.totalEnquiries ?? '—',
        icon: ShoppingCart,
        href: '/dashboard/sales',
      });
      items.push({
        title: 'Win Rate',
        value: stats?.conversionRate == null ? '—' : `${stats.conversionRate}%`,
        icon: Target,
        href: '/dashboard/reports',
      });
    }

    if (hasFmsAccess && (isSalesRole || isFmsRole || isAdmin || isManagement || isMIS)) {
      items.push({
        title: 'Pending Tasks',
        value: taskStats?.pending ?? '—',
        detail: taskStats?.delayed > 0 ? `${taskStats.delayed} delayed` : undefined,
        icon: ClipboardList,
        href: '/dashboard/fms',
      });
      items.push({
        title: 'Completed Today',
        value: taskStats?.todayCompleted ?? '—',
        icon: CheckCircle,
        href: '/dashboard/fms?filter=completed',
      });
    }

    if (isCostingRole) {
      const analyses = rateData?.data?.data || [];
      items.push({
        title: 'Rate Analyses',
        value: analyses.length,
        icon: TrendingUp,
        href: '/dashboard/rate',
      });
    }

    if (isPurchaseRole && !isSalesRole) {
      items.push({
        title: 'Purchase Quotes',
        value: stats?.totalQuotes ?? purchaseData?.data?.total ?? '—',
        icon: FileText,
        href: '/dashboard/purchase',
      });
    }

    if (hasProductionAccess) {
      items.push({
        title: 'Production Jobs',
        value: productionData?.data?.total ?? '—',
        icon: Factory,
        href: '/dashboard/production',
      });
    }

    if (hasQualityAccess) {
      items.push({
        title: 'QC Inspections',
        value: qualityData?.data?.total ?? '—',
        icon: ShieldCheck,
        href: '/dashboard/quality',
      });
    }

    if (hasWarehouseAccess && !hasSalesAccess && !hasFmsAccess) {
      const stockSummary = warehouseStockData?.data;
      items.push({
        title: 'Stock Items',
        value: stockSummary?.totalItems ?? '—',
        icon: Boxes,
        href: '/dashboard/warehouse/stock-report',
      });
    }

    if (hasAccountsAccess && !hasSalesAccess && !hasFmsAccess) {
      const accStats = accountsStatsData?.data;
      items.push({
        title: 'Pending Approvals',
        value: accStats?.pendingApprovals ?? '—',
        icon: CheckCircle,
        href: '/dashboard/accounts/approvals',
      });
    }

    if (hasFinanceAccess && !hasSalesAccess && !hasFmsAccess && !hasAccountsAccess) {
      items.push({
        title: 'Finance',
        value: '—',
        icon: Calculator,
        href: '/dashboard/finance',
      });
    }

    return items;
  }, [hasSalesAccess, hasFmsAccess, hasPurchaseAccess, hasProductionAccess, hasQualityAccess, hasWarehouseAccess, hasAccountsAccess, hasFinanceAccess, isSalesRole, isFmsRole, isCostingRole, isPurchaseRole, isAdmin, isManagement, isMIS, stats, taskStats, purchaseData, productionData, qualityData, warehouseStockData, accountsStatsData, rateData]);

  const quickActions = useMemo(() => {
    const actions: Array<{title: string; icon: any; href: string; color: string}> = [];

    if (hasSalesAccess) {
      actions.push({ title: 'New Enquiry', icon: ShoppingCart, href: '/dashboard/sales/new', color: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700' });
      actions.push({ title: 'Add Customer', icon: Users, href: '/dashboard/masters/customers', color: 'hover:border-[#fcfeff] hover:bg-[#fcfeff]/20 hover:text-[#2563eb]' });
    }

    if (hasPurchaseAccess) {
      actions.push({ title: 'Add Product', icon: Package, href: '/dashboard/masters/products', color: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' });
    }

    if (hasRateAccess) {
      actions.push({ title: 'Rate Analysis', icon: TrendingUp, href: '/dashboard/rate/new', color: 'hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700' });
    }

    if (hasProductionAccess) {
      actions.push({ title: 'Production', icon: Factory, href: '/dashboard/production', color: 'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700' });
      actions.push({ title: 'Daily Log', icon: ClipboardList, href: '/dashboard/production/daily-log', color: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700' });
      actions.push({ title: 'BOM', icon: Wrench, href: '/dashboard/production/bom', color: 'hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700' });
    }

    if (hasQualityAccess) {
      actions.push({ title: 'Quality', icon: ShieldCheck, href: '/dashboard/quality', color: 'hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700' });
      actions.push({ title: 'Reject Actions', icon: AlertTriangle, href: '/dashboard/quality/reject-actions', color: 'hover:border-red-300 hover:bg-red-50 hover:text-red-700' });
    }

    if (hasWarehouseAccess) {
      actions.push({ title: 'Stock Report', icon: Boxes, href: '/dashboard/warehouse/stock-report', color: 'hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700' });
      actions.push({ title: 'Bin Rack', icon: LayoutDashboard, href: '/dashboard/warehouse/bin-rack', color: 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700' });
      actions.push({ title: 'Receiving', icon: Truck, href: '/dashboard/warehouse/receiving-history', color: 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700' });
    }

    if (hasInventoryAccess && !hasWarehouseAccess) {
      actions.push({ title: 'Inventory', icon: Package, href: '/dashboard/inventory', color: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' });
      actions.push({ title: 'Movements', icon: ArrowLeftRight, href: '/dashboard/inventory/movements', color: 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700' });
    }

    if (hasFinanceAccess) {
      actions.push({ title: 'Finance', icon: Calculator, href: '/dashboard/finance', color: 'hover:border-green-300 hover:bg-green-50 hover:text-green-700' });
    }

    if (hasAccountsAccess) {
      actions.push({ title: 'Approvals', icon: CheckCircle, href: '/dashboard/accounts/approvals', color: 'hover:border-lime-300 hover:bg-lime-50 hover:text-lime-700' });
    }

    actions.push({ title: 'Reports', icon: BarChart3, href: '/dashboard/reports', color: 'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700' });

    if (hasFmsAccess) {
      actions.push({ title: 'View Tasks', icon: Zap, href: '/dashboard/fms', color: 'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700' });
    }

    return actions;
  }, [hasSalesAccess, hasPurchaseAccess, hasRateAccess, hasFmsAccess, hasProductionAccess, hasQualityAccess, hasWarehouseAccess, hasInventoryAccess, hasFinanceAccess, hasAccountsAccess]);

  const queryClient = useQueryClient();
  const overviewQueries = { predicate: (query: { meta?: Record<string, unknown> }) => query.meta?.dashboardOverview === true };
  const refreshing = useIsFetching(overviewQueries) > 0;
  const handleRefresh = () => queryClient.refetchQueries({ ...overviewQueries, type: 'active' });

  const dashboardTitle = (() => {
    if (isAdmin) return 'Operations dashboard';
    if (isProductionRole) return 'Production Dashboard';
    if (isWarehouseRole) return 'Warehouse Dashboard';
    if (isQualityRole) return 'Quality Dashboard';
    if (isPlannerRole) return 'Planner Dashboard';
    if (isSalesRole) return 'Sales Dashboard';
    if (isPurchaseRole) return 'Purchase Dashboard';
    if (isCostingRole) return 'Costing Dashboard';
    if (isFinanceRole) return 'Finance Dashboard';
    if (isAccountsRole) return 'Accounts Dashboard';
    if (isFmsRole) return 'FMS Dashboard';
    if (isMIS) return 'MIS Dashboard';
    return 'Dashboard';
  })();

  const dashboardSubtitle = (() => {
    if (isAdmin) return 'Enquiries, task queues, and production activity across your teams.';
    if (isProductionRole) return 'Production jobs, daily logs, and BOM management.';
    if (isWarehouseRole) return 'Stock levels, bin racks, and receiving operations.';
    if (isQualityRole) return 'Inspections, reject actions, and quality control.';
    if (isPlannerRole) return 'Inventory planning, transfers, and stock allocation.';
    if (isSalesRole) return 'Your sales enquiries, orders, and performance.';
    if (isPurchaseRole) return 'Purchase orders, quotes, and vendor tracking.';
    if (isCostingRole) return 'Rate analysis and costing overview.';
    if (isFinanceRole) return 'Journal entries, P&L, and balance sheets.';
    if (isAccountsRole) return 'Approvals, ledger, and three-way matching.';
    if (isFmsRole) return 'Tasks, PO tracking, and follow-up management.';
    if (isMIS) return 'Enquiry review and data analysis.';
    return 'Enquiries, task queues, and production activity across your teams.';
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <AnimatedContent variant="fade-up" className="overview-hero">
        <svg className="overview-engraving" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <path key={i} d={`M -40 ${230 + i * 4} C 95 ${230 - i * 7}, 210 ${-75 + i * 9}, 330 ${55 + i * 5} S 520 ${205 - i * 9}, 650 ${28 - i * 3}`} />
          ))}
        </svg>
        <div className="relative">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-200">
            {(() => {
              if (isAdmin || isManagement) return 'Operations overview';
              if (isSalesRole) return 'Sales overview';
              if (isPurchaseRole) return 'Purchase overview';
              if (isProductionRole) return 'Production overview';
              if (isWarehouseRole) return 'Warehouse overview';
              if (isQualityRole) return 'Quality overview';
              if (isPlannerRole) return 'Planner overview';
              if (isCostingRole) return 'Costing overview';
              if (isFinanceRole) return 'Finance overview';
              if (isAccountsRole) return 'Accounts overview';
              if (isFmsRole) return 'FMS overview';
              if (isMIS) return 'MIS overview';
              return 'Operations overview';
            })()}
          </span>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-plum-50">{dashboardTitle}</h1>
          <p className="mt-1 text-sm text-plum-200">{dashboardSubtitle}</p>
        </div>
        <div className="relative flex flex-col items-start gap-2 sm:items-end">
          <button onClick={handleRefresh} disabled={refreshing} className="overview-refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
          <span className="text-xs text-plum-200" aria-live="polite">
            {statsFailed ? 'Overview unavailable' : dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading overview'}
          </span>
        </div>
      </AnimatedContent>

      {kpis.length > 0 && (
        <section aria-labelledby="metrics-heading" className="overview-metrics">
          <h2 id="metrics-heading" className="mb-3 text-xl font-semibold tracking-tight text-plum-900">Key metrics</h2>
          <div className="overview-ledger">
            {kpis.map(({ title, value, icon: Icon, href, detail }) => (
              <Link key={title} href={href} data-icon-accent={metricAccents[title] ?? 'plum'} className="overview-metric group">
                <span className="flex items-center justify-between">
                  <span className="overview-symbol"><Icon size={17} /></span>
                  <ArrowRight size={14} className="text-white transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="overview-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                <span className="text-sm font-semibold text-white">{title}</span>
                {detail && <span className="text-xs text-white">{detail}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasRateAccess && (
        <section aria-label="Currency rates" className="overview-rates">
          <div className="flex items-center gap-2"><DollarSign size={17} /><h2 className="text-sm font-semibold">Exchange rates</h2></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {currencyData?.data?.slice(0, 4).map((rate: any) => (
              <div key={rate.rateId || rate.id || rate.currencyCode} className="flex items-baseline gap-2">
                <span className="text-xs font-semibold tracking-wide text-plum-700">{rate.currencyCode}</span>
                <span className="font-semibold tabular-nums">₹{Number(((rate.actualRate && typeof rate.actualRate === 'object' ? rate.actualRate.rate : rate.actualRate) || rate.rate || 0)).toFixed(2)}</span>
              </div>
            ))}
            {!currencyData?.data?.length && <Link href="/dashboard/masters/currencies" className="font-semibold underline">View currencies</Link>}
          </div>
        </section>
      )}

      {(isAdmin || isManagement) && <SalesActivity />}

      {/* Main Grid */}
      <div className={`grid grid-cols-1 gap-5 ${(hasFmsAccess && hasSalesAccess) || (hasProductionAccess && hasQualityAccess && !hasSalesAccess) ? 'lg:grid-cols-3' : ''}`}>
        {/* Recent Enquiries */}
        {hasSalesAccess && (isSalesRole || isAdmin || isManagement || isMIS) && (
          <div className={`animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 ${hasFmsAccess ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-full bg-sky-50 p-2.5 text-sky-700">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Enquiries</h2>
              </div>
              <Link href="/dashboard/sales" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loadingEnquiries ? null : enquiriesData?.data?.data?.slice(0, 5).length ? (
                enquiriesData.data.data.slice(0, 5).map((enquiry: any) => (
                  <Link
                    key={enquiry.enquiryOrderId || enquiry.enquiryId}
                    href={`/dashboard/sales/${enquiry.enquiryOrderId || enquiry.enquiryId}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No enquiries yet</p>
                  <p className="text-sm text-slate-400 mt-1">Start by creating your first enquiry</p>
                  <Link href="/dashboard/sales/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                    Create Enquiry <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Tasks - only for FMS/Sales/Admin roles */}
        {hasFmsAccess && (isSalesRole || isFmsRole || isAdmin || isManagement || isMIS) && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-full bg-violet-50 p-2.5 text-violet-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">My Tasks</h2>
              </div>
              <Link href="/dashboard/fms" className="text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loadingTasks ? null : tasksData?.data?.data?.length ? (
                tasksData.data.data.map((task: any) => (
                  <Link
                    key={task.taskId}
                    href={`/dashboard/fms/${task.taskId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className={`p-2 rounded-full ${
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
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
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
        {hasPurchaseAccess && (isPurchaseRole || isAdmin || isManagement) && !isSalesRole && !isCostingRole && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-full bg-blue-50 p-2.5 text-blue-700">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Purchase Quotes</h2>
              </div>
              <Link href="/dashboard/purchase" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {purchaseData?.data?.data?.slice(0, 5).length ? (
                purchaseData.data.data.slice(0, 5).map((quote: any) => (
                  <Link
                    key={quote.quoteId || quote.id}
                    href={`/dashboard/purchase/${quote.quoteId || quote.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Truck className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-slate-600 font-medium">No purchase quotes</p>
                  <p className="text-sm text-slate-400 mt-1">Start by creating a purchase quote</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Production Jobs */}
        {hasProductionAccess && !hasSalesAccess && (
          <div className={`animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 ${hasQualityAccess ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-full bg-orange-50 p-2.5 text-orange-700">
                  <Factory className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Production Jobs</h2>
              </div>
              <Link href="/dashboard/production" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {productionData?.data?.data?.slice(0, 5).length ? (
                productionData.data.data.slice(0, 5).map((job: any) => (
                  <Link
                    key={job.productionJobId || job.id}
                    href="/dashboard/production"
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white shadow-sm">
                        {(job.jobNumber || job.productionJobNo || 'JOB').slice(-4)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{job.jobNumber || job.productionJobNo || 'Production Job'}</p>
                        <p className="text-sm text-slate-500">{job.productName || job.product?.name || 'No product'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'completed' || job.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'in_progress' || job.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      job.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {(job.status || 'draft').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Factory className="h-8 w-8 text-orange-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No production jobs</p>
                  <p className="text-sm text-slate-400 mt-1">Jobs will appear here when created</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QC Inspections */}
        {hasQualityAccess && !hasSalesAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-full bg-teal-50 p-2.5 text-teal-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">QC Inspections</h2>
              </div>
              <Link href="/dashboard/quality" className="text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {qualityData?.data?.data?.slice(0, 5).length ? (
                qualityData.data.data.slice(0, 5).map((inspection: any) => (
                  <Link
                    key={inspection.inspectionId || inspection.id}
                    href="/dashboard/quality"
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className={`p-2 rounded-full ${
                      inspection.status === 'completed' || inspection.status === 'passed' ? 'bg-emerald-100' :
                      inspection.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      {inspection.status === 'completed' || inspection.status === 'passed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : inspection.status === 'failed' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-slate-950">{inspection.inspectionNumber || 'Inspection'}</p>
                      <p className="text-sm text-slate-500">{inspection.productName || 'Pending review'}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inspection.status === 'completed' || inspection.status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                      inspection.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {(inspection.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                    <ShieldCheck className="h-6 w-6 text-teal-500" />
                  </div>
                  <p className="text-slate-600 font-medium">No inspections</p>
                  <p className="text-sm text-slate-400 mt-1">Quality checks will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warehouse Stock Overview */}
        {isWarehouseRole && !hasSalesAccess && !hasProductionAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cyan-50 p-2.5 text-cyan-700">
                  <Boxes className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Stock Overview</h2>
              </div>
              <Link href="/dashboard/warehouse/stock-report" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                Full report <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {warehouseStockData?.data?.items?.slice(0, 5).length ? (
                warehouseStockData.data.items.slice(0, 5).map((item: any, idx: number) => (
                  <div key={item.productId || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white shadow-sm">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{item.productName || item.name || 'Item'}</p>
                        <p className="text-sm text-slate-500">{item.warehouseName || item.warehouse || 'Main warehouse'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-950">{item.quantity || item.currentStock || 0}</p>
                      <p className="text-xs text-slate-400">{item.unit || 'units'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
                    <Boxes className="h-8 w-8 text-cyan-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No stock data</p>
                  <p className="text-sm text-slate-400 mt-1">Stock levels will appear here</p>
                  <Link href="/dashboard/warehouse/stock-report" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                    View Stock Report <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory Movements */}
        {isInventoryRole && !hasSalesAccess && !hasWarehouseAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-700">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Stock Movements</h2>
              </div>
              <Link href="/dashboard/inventory/movements" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stockMovementsData?.data?.data?.slice(0, 5).length ? (
                stockMovementsData.data.data.slice(0, 5).map((movement: any, idx: number) => (
                  <div key={movement.movementId || movement.id || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${movement.type === 'in' || movement.type === 'receipt' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        {movement.type === 'in' || movement.type === 'receipt' ? (
                          <ArrowUp className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{movement.productName || movement.product?.name || 'Item'}</p>
                        <p className="text-sm text-slate-500">{movement.warehouseName || 'Warehouse'} &middot; {formatDate(movement.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.type === 'in' || movement.type === 'receipt' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {movement.type === 'in' || movement.type === 'receipt' ? '+' : '-'}{movement.quantity || 0} {movement.unit || ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <ArrowLeftRight className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No recent movements</p>
                  <p className="text-sm text-slate-400 mt-1">Stock movements will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accounts - Pending POs */}
        {hasAccountsAccess && !hasSalesAccess && !hasPurchaseAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-lime-50 p-2.5 text-lime-700">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Pending PO Approvals</h2>
              </div>
              <Link href="/dashboard/accounts/approvals" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingPOsData?.data?.data?.slice(0, 5).length ? (
                pendingPOsData.data.data.slice(0, 5).map((po: any, idx: number) => (
                  <div key={po.poId || po.id || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-600 text-xs font-bold text-white shadow-sm">
                        {(po.poNumber || 'PO').slice(-4)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{po.poNumber || 'Purchase Order'}</p>
                        <p className="text-sm text-slate-500">{po.vendorName || 'Vendor'} &middot; ₹{Number(po.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime-100">
                    <CheckCircle className="h-8 w-8 text-lime-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No pending approvals</p>
                  <p className="text-sm text-slate-400 mt-1">All approvals are up to date</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Panel */}
        {hasFinanceAccess && !hasSalesAccess && !hasAccountsAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-50 p-2.5 text-green-700">
                  <Calculator className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Finance Overview</h2>
              </div>
              <Link href="/dashboard/finance" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                Go to Finance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Calculator className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-slate-600 font-medium">Finance Module</p>
              <p className="text-sm text-slate-400 mt-1">Journal entries, P&L statements, and balance sheets</p>
              <Link href="/dashboard/finance" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                Open Finance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Costing / Rate Analysis Panel */}
        {isCostingRole && !isSalesRole && !isPurchaseRole && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-violet-50 p-2.5 text-violet-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Rate Analysis</h2>
              </div>
              <Link href="/dashboard/rate" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {rateData?.data?.data?.slice(0, 5).length ? (
                rateData.data.data.slice(0, 5).map((analysis: any, idx: number) => (
                  <Link
                    key={analysis.rateAnalysisId || analysis.id || idx}
                    href={`/dashboard/rate/${analysis.rateAnalysisId || analysis.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fcfeff]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{analysis.enquiryNumber || analysis.rateAnalysisNo || 'Rate Analysis'}</p>
                        <p className="text-sm text-slate-500">{analysis.customerName || analysis.productName || 'Costing'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      analysis.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      analysis.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {(analysis.status || 'draft').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                    <TrendingUp className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No rate analyses</p>
                  <p className="text-sm text-slate-400 mt-1">Create a new rate analysis to get started</p>
                  <Link href="/dashboard/rate/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                    New Rate Analysis <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Planner Panel */}
        {isPlannerRole && !hasSalesAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-700">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Inventory Planner</h2>
              </div>
              <Link href="/dashboard/planner" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                Open Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <LayoutDashboard className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-slate-600 font-medium">Inventory Planning</p>
              <p className="text-sm text-slate-400 mt-1">Manage stock allocation, transfers, and receiving plans</p>
              <Link href="/dashboard/planner" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                Open Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* MIS Panel */}
        {isMIS && !hasSalesAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-sm transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#fcfeff]/15 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2.5 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">MIS Reports</h2>
              </div>
              <Link href="/dashboard/mis" className="flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#2563eb]">
                Open MIS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <BarChart3 className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-600 font-medium">Data & Analysis</p>
              <p className="text-sm text-slate-400 mt-1">Enquiry review, reports, and data insights</p>
              <Link href="/dashboard/mis" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]">
                Open MIS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up rounded-2xl border border-[#fcfeff]/20 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-950">Quick Actions</h2>
        <div
          className="stagger-children grid gap-2 overflow-x-auto p-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(quickActions.length / 2))}, minmax(6rem, 1fr))` }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`ripple-effect group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#fcfeff]/20 bg-white px-2 py-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${action.color}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 transition-all duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-center text-xs font-bold">{action.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
