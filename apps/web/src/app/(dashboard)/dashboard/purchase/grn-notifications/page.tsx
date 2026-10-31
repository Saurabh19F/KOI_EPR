'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { receivingPlanApi, notificationsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, RefreshCw, Mail, FileText, Download, Send, CheckCircle } from 'lucide-react';

export default function GrnNotificationsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sentGrns, setSentGrns] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grn-notifications', page, search],
    queryFn: () =>
      receivingPlanApi.listAllGrns({ page, limit: 25, search: search || undefined }).then((res) => res.data),
  });

  const grns = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const sendNotifMutation = useMutation({
    mutationFn: (grn: any) =>
      notificationsApi.createNotification({
        title: `GRN ${grn.grnNumber || grn.grnId?.slice(0, 8)} — Receipt Complete`,
        message: `GRN for PO ${grn.poNumber || '—'} from ${grn.vendorName || 'vendor'} has been received. Qty: ${grn.totalReceivedQty || grn.receivedQty || 0}. Please review and download the GRN PDF.`,
        moduleName: 'receiving-plan',
        recordId: grn.grnId || grn.id,
        notificationType: 'email',
      }),
    onSuccess: (_res, grn) => {
      toast.success(`Notification sent for GRN ${grn.grnNumber || grn.grnId?.slice(0, 8)}`);
      setSentGrns((prev) => new Set(prev).add(grn.grnId || grn.id));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send notification');
    },
  });

  const handleDownloadPdf = async (planId: string) => {
    try {
      const response = await receivingPlanApi.downloadPdf(planId);
      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GRN-${planId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download GRN PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GRN Email Notifications</h1>
          <p className="text-muted-foreground">
            Send email notifications with GRN details and PDF to stakeholders
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total GRNs</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Mail className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Notifications Sent</p>
                <p className="text-2xl font-bold">{sentGrns.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><Send className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Notification</p>
                <p className="text-2xl font-bold">{Math.max(0, total - sentGrns.size)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>GRN Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search GRN, PO, vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : grns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-10 w-10" />
              <p>No GRN records found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN #</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead className="text-right">Qty Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grns.map((grn: any) => {
                      const grnId = grn.grnId || grn.id;
                      const isSent = sentGrns.has(grnId);
                      return (
                        <TableRow key={grnId}>
                          <TableCell className="text-xs font-medium whitespace-nowrap">{grn.grnNumber || grnId?.slice(0, 8)}</TableCell>
                          <TableCell className="text-xs">{grn.poNumber || '—'}</TableCell>
                          <TableCell className="text-xs">{grn.vendorName || '—'}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {grn.receivedDate || grn.createdAt ? new Date(grn.receivedDate || grn.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {Number(grn.totalReceivedQty || grn.receivedQty || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={grn.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {grn.status || 'received'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(grn.planId || grnId)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            {isSent ? (
                              <Badge variant="default" className="text-xs gap-1">
                                <CheckCircle className="h-3 w-3" /> Sent
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendNotifMutation.mutate(grn)}
                                disabled={sendNotifMutation.isPending}
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Notify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {grns.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
