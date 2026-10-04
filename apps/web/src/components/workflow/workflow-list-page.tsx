'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type { ElementType } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Search,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { PaginatedResponse } from '@/lib/api';

type WorkflowAction = {
  label: string;
  icon: 'approve' | 'cancel';
  mutation: (id: string) => Promise<unknown>;
  visible?: (record: any) => boolean;
  successMessage: string;
};

type WorkflowListPageProps = {
  title: string;
  subtitle: string;
  queryKey: string;
  moduleHref: string;
  emptyLabel: string;
  icon: ElementType;
  statusOptions?: Array<{ value: string; label: string }>;
  fetchRecords: (params: { page: number; limit: number; search?: string; status?: string }) => Promise<AxiosResponse<PaginatedResponse<any>>>;
  actions?: WorkflowAction[];
  downloadPdf?: (id: string) => Promise<AxiosResponse<Blob>>;
  getId: (record: any) => string;
  getNumber: (record: any) => string;
  getDate: (record: any) => string | Date | null | undefined;
  getParty: (record: any) => string;
  getReference?: (record: any) => string;
  getAmount?: (record: any) => number;
};

const PAGE_SIZE = 20;

function normalizeStatus(status?: string | null) {
  return status ? status.replace(/_/g, ' ') : '-';
}

function unwrapRows(response?: AxiosResponse<PaginatedResponse<any>>) {
  return response?.data?.data || [];
}

export function WorkflowListPage({
  title,
  subtitle,
  queryKey,
  moduleHref,
  emptyLabel,
  icon: PageIcon,
  statusOptions,
  fetchRecords,
  actions = [],
  downloadPdf,
  getId,
  getNumber,
  getDate,
  getParty,
  getReference,
  getAmount,
}: WorkflowListPageProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const recordsQuery = useQuery({
    queryKey: [queryKey, { page, search, status }],
    queryFn: () =>
      fetchRecords({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, id }: { action: WorkflowAction; id: string }) => action.mutation(id),
    onSuccess: (_data, variables) => {
      toast.success(variables.action.successMessage);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Action failed';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const pdfMutation = useMutation({
    mutationFn: ({ id, number }: { id: string; number: string }) =>
      downloadPdf ? downloadPdf(id).then((response) => ({ response, number })) : Promise.reject(new Error('PDF not available')),
    onSuccess: ({ response, number }) => {
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${number || 'invoice'}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error('Failed to download PDF'),
  });

  const rows = unwrapRows(recordsQuery.data);
  const total = recordsQuery.data?.data?.total || 0;
  const totalPages = recordsQuery.data?.data?.totalPages || 1;
  const currentRangeStart = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const currentRangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={moduleHref}>
            <FileText className="h-4 w-4 mr-2" />
            Source Module
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search number or party..."
                className="pl-10"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            {statusOptions?.length ? (
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div />
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{title} List</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-16 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : rows.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((record: any) => {
                    const id = getId(record);
                    const number = getNumber(record);
                    return (
                      <TableRow key={id} className="hover:bg-slate-50">
                        <TableCell className="font-mono font-semibold">{number || '-'}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(getDate(record))}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{getParty(record) || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{getReference?.(record) || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {normalizeStatus(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(getAmount?.(record) || 0))}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {actions.filter((action) => action.visible?.(record) ?? true).map((action) => (
                              <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                disabled={actionMutation.isPending}
                                onClick={() => actionMutation.mutate({ action, id })}
                              >
                                {action.icon === 'approve' ? (
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                )}
                                {action.label}
                              </Button>
                            ))}
                            {downloadPdf ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pdfMutation.isPending}
                                onClick={() => pdfMutation.mutate({ id, number })}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                PDF
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {currentRangeStart} to {currentRangeEnd} of {total} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <PageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">{emptyLabel}</h3>
              <p className="mt-1 text-gray-500">Records will appear here after the workflow reaches this stage.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
