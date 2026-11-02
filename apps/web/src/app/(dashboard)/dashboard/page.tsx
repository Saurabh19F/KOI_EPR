'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, fmsApi, purchaseApi, rateApi, reportsApi, productionApi, qualityApi, inventoryApi, accountsApi } from '@/lib/api';
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

  const { data: productionData } = useQuery({
    queryKey: ['production-jobs', { limit: 5 }],
    queryFn: () => productionApi.getJobs({ limit: 5 }),
    enabled: hasProductionAccess,
  });

  const { data: qualityData } = useQuery({
    queryKey: ['quality-inspections', { limit: 5 }],
    queryFn: () => qualityApi.getInspections({ limit: 5 }),
    enabled: hasQualityAccess,
  });

  const { data: warehouseStockData } = useQuery({
    queryKey: ['warehouse-stock-summary'],
    queryFn: () => inventoryApi.getStockSummary(),
    enabled: hasWarehouseAccess && !hasSalesAccess,
  });

  const { data: stockMovementsData } = useQuery({
    queryKey: ['stock-movements', { limit: 5 }],
    queryFn: () => inventoryApi.getMovements({ limit: 5 }),
    enabled: hasInventoryAccess && !hasSalesAccess,
  });

  const { data: accountsStatsData } = useQuery({
    queryKey: ['accounts-stats'],
    queryFn: () => accountsApi.getStats(),
    enabled: hasAccountsAccess,
  });

  const { data: pendingPOsData } = useQuery({
    queryKey: ['accounts-pending-pos', { limit: 5 }],
    queryFn: () => accountsApi.getPendingPOs({ limit: 5 }),
    enabled: hasAccountsAccess,
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

    if (hasSalesAccess && (isSalesRole || isAdmin || isManagement || isMIS)) {
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

    if (hasFmsAccess && (isSalesRole || isFmsRole || isAdmin || isManagement || isMIS)) {
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

    if (isCostingRole) {
      const analyses = rateData?.data?.data || [];
      items.push({
        title: 'Rate Analyses',
        value: analyses.length,
        trend: 'Active',
        trendUp: true,
        icon: TrendingUp,
        tone: 'bg-violet-50 text-violet-700 border-violet-100',
        href: '/dashboard/rate',
      });
    }

    if (isPurchaseRole && !isSalesRole) {
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

    if (hasProductionAccess) {
      const prodJobs = productionData?.data?.data || [];
      items.push({
        title: 'Production Jobs',
        value: prodJobs.length,
        trend: 'Active',
        trendUp: true,
        icon: Factory,
        tone: 'bg-orange-50 text-orange-700 border-orange-100',
        href: '/dashboard/production',
      });
    }

    if (hasQualityAccess) {
      const inspections = qualityData?.data?.data || [];
      items.push({
        title: 'QC Inspections',
        value: inspections.length,
        trend: 'Quality',
        trendUp: true,
        icon: ShieldCheck,
        tone: 'bg-teal-50 text-teal-700 border-teal-100',
        href: '/dashboard/quality',
      });
    }

    if (hasWarehouseAccess && !hasSalesAccess && !hasFmsAccess) {
      const stockSummary = warehouseStockData?.data;
      items.push({
        title: 'Stock Items',
        value: stockSummary?.totalItems || '—',
        trend: 'Active',
        trendUp: true,
        icon: Boxes,
        tone: 'bg-cyan-50 text-cyan-700 border-cyan-100',
        href: '/dashboard/warehouse/stock-report',
      });
    }

    if (hasAccountsAccess && !hasSalesAccess && !hasFmsAccess) {
      const accStats = accountsStatsData?.data;
      items.push({
        title: 'Pending Approvals',
        value: accStats?.pendingApprovals || 0,
        trend: 'Review',
        trendUp: true,
        icon: CheckCircle,
        tone: 'bg-lime-50 text-lime-700 border-lime-100',
        href: '/dashboard/accounts/approvals',
      });
    }

    if (hasFinanceAccess && !hasSalesAccess && !hasFmsAccess && !hasAccountsAccess) {
      items.push({
        title: 'Finance',
        value: '—',
        trend: 'Active',
        trendUp: true,
        icon: Calculator,
        tone: 'bg-green-50 text-green-700 border-green-100',
        href: '/dashboard/finance',
      });
    }

    return items;
  }, [hasSalesAccess, hasFmsAccess, hasPurchaseAccess, hasProductionAccess, hasQualityAccess, hasWarehouseAccess, hasAccountsAccess, hasFinanceAccess, isSalesRole, isFmsRole, isCostingRole, isPurchaseRole, isAdmin, isManagement, isMIS, metrics, productionData, qualityData, warehouseStockData, accountsStatsData, rateData]);

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

  const handleRefresh = () => {
    if (hasSalesAccess) refetchEnquiries();
    if (hasFmsAccess) {
      refetchTasks();
      refetchDelayed();
    }
  };

  const dashboardTitle = (() => {
    if (isAdmin) return 'Dashboard';
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
    if (isAdmin) return 'Live work across sales, purchase, rate, and fulfilment.';
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
    return 'Live work across sales, purchase, rate, and fulfilment.';
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6b36]">
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
            className="ripple-effect rounded-lg border border-[#ded4c6] bg-white p-2 transition-all duration-300 hover:bg-[#fbfaf6] hover:shadow-md hover:scale-105 active:scale-95"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 text-slate-500 transition-transform duration-500 hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className={`stagger-children grid grid-cols-2 gap-3 ${kpis.length >= 4 ? 'lg:grid-cols-4' : kpis.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.title} href={kpi.href} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}>
                <Card className="hover-glow-card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <CardContent className="p-4 relative">
                    <div className="card-shine" />
                    <div className="mb-3 flex items-start justify-between">
                      <div className={`icon-hover rounded-lg border p-2 ${kpi.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-all duration-300 group-hover:scale-105 ${kpi.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {kpi.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {kpi.trend}
                      </div>
                    </div>
                    <p className="number-pop text-2xl font-extrabold tracking-tight text-slate-950">{kpi.value}</p>
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
        <Card className="animate-fade-in-up animate-glow border-[#173f37] bg-gradient-to-r from-[#0f2f29] via-[#132f2a] to-[#0d2520] overflow-hidden">
          <CardContent className="py-4 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50"></div>
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2 animate-float">
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
      <div className={`grid grid-cols-1 gap-4 ${(hasFmsAccess && hasSalesAccess) || (hasProductionAccess && hasQualityAccess && !hasSalesAccess) ? 'lg:grid-cols-3' : ''}`}>
        {/* Recent Enquiries */}
        {hasSalesAccess && (isSalesRole || isAdmin || isManagement || isMIS) && (
          <div className={`animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 ${hasFmsAccess ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-xl bg-sky-50 p-2 text-sky-700">
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

        {/* My Tasks - only for FMS/Sales/Admin roles */}
        {hasFmsAccess && (isSalesRole || isFmsRole || isAdmin || isManagement || isMIS) && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-xl bg-violet-50 p-2 text-violet-700">
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
        {hasPurchaseAccess && (isPurchaseRole || isAdmin || isManagement) && !isSalesRole && !isCostingRole && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-xl bg-blue-50 p-2 text-blue-700">
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

        {/* Production Jobs */}
        {hasProductionAccess && !hasSalesAccess && (
          <div className={`animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 ${hasQualityAccess ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-xl bg-orange-50 p-2 text-orange-700">
                  <Factory className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Production Jobs</h2>
              </div>
              <Link href="/dashboard/production" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {productionData?.data?.data?.slice(0, 5).length ? (
                productionData.data.data.slice(0, 5).map((job: any) => (
                  <Link
                    key={job.productionJobId || job.id}
                    href="/dashboard/production"
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
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
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-hover rounded-xl bg-teal-50 p-2 text-teal-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">QC Inspections</h2>
              </div>
              <Link href="/dashboard/quality" className="text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {qualityData?.data?.data?.slice(0, 5).length ? (
                qualityData.data.data.slice(0, 5).map((inspection: any) => (
                  <Link
                    key={inspection.inspectionId || inspection.id}
                    href="/dashboard/quality"
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className={`p-2 rounded-lg ${
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
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
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
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                  <Boxes className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Stock Overview</h2>
              </div>
              <Link href="/dashboard/warehouse/stock-report" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                Full report <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {warehouseStockData?.data?.items?.slice(0, 5).length ? (
                warehouseStockData.data.items.slice(0, 5).map((item: any, idx: number) => (
                  <div key={item.productId || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                    <Boxes className="h-8 w-8 text-cyan-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No stock data</p>
                  <p className="text-sm text-slate-400 mt-1">Stock levels will appear here</p>
                  <Link href="/dashboard/warehouse/stock-report" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                    View Stock Report <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory Movements */}
        {isInventoryRole && !hasSalesAccess && !hasWarehouseAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Recent Stock Movements</h2>
              </div>
              <Link href="/dashboard/inventory/movements" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stockMovementsData?.data?.data?.slice(0, 5).length ? (
                stockMovementsData.data.data.slice(0, 5).map((movement: any, idx: number) => (
                  <div key={movement.movementId || movement.id || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${movement.type === 'in' || movement.type === 'receipt' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
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
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-lime-50 p-2 text-lime-700">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Pending PO Approvals</h2>
              </div>
              <Link href="/dashboard/accounts/approvals" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingPOsData?.data?.data?.slice(0, 5).length ? (
                pendingPOsData.data.data.slice(0, 5).map((po: any, idx: number) => (
                  <div key={po.poId || po.id || idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-600 text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-lime-100">
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
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-2 text-green-700">
                  <Calculator className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Finance Overview</h2>
              </div>
              <Link href="/dashboard/finance" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                Go to Finance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Calculator className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-slate-600 font-medium">Finance Module</p>
              <p className="text-sm text-slate-400 mt-1">Journal entries, P&L statements, and balance sheets</p>
              <Link href="/dashboard/finance" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                Open Finance <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Costing / Rate Analysis Panel */}
        {isCostingRole && !isSalesRole && !isPurchaseRole && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-2 text-violet-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Rate Analysis</h2>
              </div>
              <Link href="/dashboard/rate" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {rateData?.data?.data?.slice(0, 5).length ? (
                rateData.data.data.slice(0, 5).map((analysis: any, idx: number) => (
                  <Link
                    key={analysis.rateAnalysisId || analysis.id || idx}
                    href={`/dashboard/rate/${analysis.rateAnalysisId || analysis.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white shadow-sm">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                    <TrendingUp className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No rate analyses</p>
                  <p className="text-sm text-slate-400 mt-1">Create a new rate analysis to get started</p>
                  <Link href="/dashboard/rate/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                    New Rate Analysis <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Planner Panel */}
        {isPlannerRole && !hasSalesAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">Inventory Planner</h2>
              </div>
              <Link href="/dashboard/planner" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                Open Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <LayoutDashboard className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-slate-600 font-medium">Inventory Planning</p>
              <p className="text-sm text-slate-400 mt-1">Manage stock allocation, transfers, and receiving plans</p>
              <Link href="/dashboard/planner" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                Open Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* MIS Panel */}
        {isMIS && !hasSalesAccess && (
          <div className="animate-fade-in-up hover-glow-card overflow-hidden rounded-xl border border-[#e5dfd4] bg-white shadow-card transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eee8de] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-950">MIS Reports</h2>
              </div>
              <Link href="/dashboard/mis" className="flex items-center gap-1 text-sm font-bold text-[#9a6b36] hover:text-[#7a4f24]">
                Open MIS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                <BarChart3 className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-600 font-medium">Data & Analysis</p>
              <p className="text-sm text-slate-400 mt-1">Enquiry review, reports, and data insights</p>
              <Link href="/dashboard/mis" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f2f29] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#173f37]">
                Open MIS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up hover-glow-card rounded-xl border border-[#e5dfd4] bg-white p-4 shadow-card">
        <h2 className="mb-3 font-bold text-slate-950">Quick Actions</h2>
        <div className={`stagger-children grid grid-cols-2 gap-3 sm:grid-cols-3 ${quickActions.length >= 6 ? 'lg:grid-cols-6' : quickActions.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`ripple-effect group flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#dcd4c8] p-3 text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${action.color}`}
              >
                <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                <span className="text-center text-sm font-bold">{action.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
