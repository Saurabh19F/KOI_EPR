'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, FileText, Package, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AccountsOverviewPage() {
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['accounts-stats'],
    queryFn: () => accountsApi.getStats().then((res) => res.data),
  });

  const { data: pendingPOs } = useQuery({
    queryKey: ['accounts-pending-pos-overview'],
    queryFn: () => accountsApi.getPendingPOs({ page: 1, limit: 5 }).then((res) => res.data),
  });

  const { data: threeWayData } = useQuery({
    queryKey: ['accounts-three-way-overview'],
    queryFn: () => accountsApi.getThreeWayMatch({ page: 1, limit: 5 }).then((res) => res.data),
  });

  const { data: ledgerData } = useQuery({
    queryKey: ['accounts-ledger-overview'],
    queryFn: () => accountsApi.getLedgerEntries({ page: 1, limit: 5, status: 'pending' }).then((res) => res.data),
  });

  const stats = statsData || {};
  const recentPOs = pendingPOs?.data || [];
  const recentMatches = threeWayData?.data || [];
  const pendingLedger = ledgerData?.data || [];

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Accounts Overview" description="Consolidated view of receipts, invoices, and financial status">
        <Button variant="outline" size="sm" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </WorkspacePageHeader>

      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total POs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{stats.totalPOs ?? pendingPOs?.total ?? 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Pending Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold">{stats.pendingInvoices ?? ledgerData?.total ?? 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Three-Way Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{stats.matchedCount ?? threeWayData?.total ?? 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-500" />
                  <span className="text-2xl font-bold">{stats.pendingApprovals ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Pending POs</CardTitle>
                <Link href="/dashboard/accounts/po-invoice-status" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {recentPOs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No pending POs</p>
                ) : (
                  <div className="space-y-2">
                    {recentPOs.slice(0, 5).map((po: any) => (
                      <div key={po.id || po.orderId} className="flex items-center justify-between py-1.5 border-b border-muted last:border-0">
                        <div>
                          <p className="text-sm font-medium">{po.poNumber || po.orderNumber || '—'}</p>
                          <p className="text-xs text-muted-foreground">{po.vendorName || '—'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{po.status || 'pending'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Three-Way Match</CardTitle>
                <Link href="/dashboard/accounts/three-way-match" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {recentMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No matches yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentMatches.slice(0, 5).map((m: any) => (
                      <div key={m.id || m.poNumber} className="flex items-center justify-between py-1.5 border-b border-muted last:border-0">
                        <div>
                          <p className="text-sm font-medium">{m.poNumber || '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.vendorName || '—'}</p>
                        </div>
                        <Badge className={m.matched ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                          {m.matched ? 'Matched' : 'Mismatch'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Pending Ledger Approvals</CardTitle>
                <Link href="/dashboard/accounts/accountant-review" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {pendingLedger.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No pending approvals</p>
                ) : (
                  <div className="space-y-2">
                    {pendingLedger.slice(0, 5).map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-muted last:border-0">
                        <div>
                          <p className="text-sm font-medium">{entry.poNumber || entry.documentNumber || '—'}</p>
                          <p className="text-xs text-muted-foreground">{entry.vendorName || '—'}</p>
                        </div>
                        <span className="text-sm font-semibold">{entry.totalAmount ? `₹${Number(entry.totalAmount).toLocaleString()}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
