'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, RefreshCw, History, Shield, Eye } from 'lucide-react';

const MODULE_OPTIONS = [
  'all', 'purchase-order', 'receiving-plan', 'inventory', 'production',
  'quality', 'sales', 'accounts', 'rate', 'fms', 'masters',
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
  STATUS_CHANGE: 'bg-purple-100 text-purple-800',
};

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, moduleFilter, actionFilter, changedBy, startDate, endDate],
    queryFn: () =>
      auditApi.getLogs({
        page,
        limit: 25,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        action: actionFilter || undefined,
        changedBy: changedBy || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).then((res) => res.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const resetFilters = () => {
    setModuleFilter('all');
    setActionFilter('');
    setChangedBy('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Track all system changes — who did what, when, and to which record
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><History className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Audit Entries</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2"><Shield className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Filters</p>
                <p className="text-2xl font-bold">
                  {[moduleFilter !== 'all', actionFilter, changedBy, startDate, endDate].filter(Boolean).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === 'all' ? 'All Modules' : m.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Action (e.g. CREATE)"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-[160px]"
            />
            <Input
              placeholder="Changed by"
              value={changedBy}
              onChange={(e) => { setChangedBy(e.target.value); setPage(1); }}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-[160px]"
            />
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="mb-2 h-10 w-10" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id || log.auditLogId}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {(log.moduleName || log.module || '—').replace(/-/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                            {log.action || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.changedBy || log.performedBy || '—'}</TableCell>
                        <TableCell className="text-xs font-mono max-w-[120px] truncate">
                          {log.recordId || log.entityId || '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {log.description || log.details || '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {logs.length} of {total} entries
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Changed By</p>
                  <p className="text-sm font-medium">{selectedLog.changedBy || selectedLog.performedBy || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Module</p>
                  <p className="text-sm font-medium">{selectedLog.moduleName || selectedLog.module || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge className={`text-xs ${ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-800'}`}>
                    {selectedLog.action || '—'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Record ID</p>
                  <p className="text-sm font-mono">{selectedLog.recordId || selectedLog.entityId || '—'}</p>
                </div>
              </div>
              {(selectedLog.description || selectedLog.details) && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedLog.description || selectedLog.details}</p>
                </div>
              )}
              {selectedLog.previousValue && (
                <div>
                  <p className="text-xs text-muted-foreground">Previous Value</p>
                  <pre className="mt-1 rounded bg-slate-50 p-2 text-xs overflow-auto max-h-[200px]">
                    {typeof selectedLog.previousValue === 'string'
                      ? selectedLog.previousValue
                      : JSON.stringify(selectedLog.previousValue, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.newValue && (
                <div>
                  <p className="text-xs text-muted-foreground">New Value</p>
                  <pre className="mt-1 rounded bg-slate-50 p-2 text-xs overflow-auto max-h-[200px]">
                    {typeof selectedLog.newValue === 'string'
                      ? selectedLog.newValue
                      : JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
