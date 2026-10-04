'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Eye,
  Download,
  Clock,
  User,
  Package,
  Users,
  FileText,
  ShoppingCart,
  Truck,
} from 'lucide-react';

interface AuditLog {
  auditLogId: string;
  moduleName: string;
  recordId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-orange-100 text-orange-700',
  lock: 'bg-purple-100 text-purple-700',
  unlock: 'bg-violet-100 text-violet-700',
  export: 'bg-cyan-100 text-cyan-700',
  send_email: 'bg-sky-100 text-sky-700',
  generate_pdf: 'bg-indigo-100 text-indigo-700',
  assign: 'bg-teal-100 text-teal-700',
  status_change: 'bg-amber-100 text-amber-700',
};

const moduleIcons: Record<string, React.ElementType> = {
  products: Package,
  customers: Users,
  categories: FileText,
  brands: Package,
  sales: ShoppingCart,
  purchase: Truck,
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const limit = 20;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/audit', {
        params: {
          page,
          limit,
          module: filters.module || undefined,
          action: filters.action || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const parseJson = (jsonStr?: string) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">
          Track all changes and activities across the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.module}
            onValueChange={(v) => setFilters({ ...filters, module: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
              <SelectItem value="brands">Brands</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.action}
            onValueChange={(v) => setFilters({ ...filters, action: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="status_change">Status Change</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-[150px]"
              placeholder="Start date"
            />
            <span className="text-slate-400">-</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-[150px]"
              placeholder="End date"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
            <Filter className="h-4 w-4 mr-2" />
            Apply
          </Button>

          <Button variant="outline" size="sm" onClick={() => {
            setFilters({ module: '', action: '', startDate: '', endDate: '' });
            setSearch('');
          }}>
            Clear
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Record ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = moduleIcons[log.moduleName] || FileText;
                  return (
                    <tr key={log.auditLogId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <div>
                            <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {log.moduleName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            actionColors[log.action] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {log.action?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {log.recordId?.slice(0, 8) || '-'}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {log.changedBy || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="text-sm text-slate-500">
            Showing {total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Module
                  </label>
                  <p className="text-sm font-medium text-slate-900 capitalize mt-1">
                    {selectedLog.moduleName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        actionColors[selectedLog.action] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedLog.action?.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Record ID
                  </label>
                  <p className="text-sm font-mono text-slate-900 mt-1">
                    {selectedLog.recordId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </label>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedLog.changedBy || 'System'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    IP Address
                  </label>
                  <p className="text-sm font-mono text-slate-600 mt-1">
                    {selectedLog.ipAddress || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </label>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Old Value
                  </label>
                  <pre className="mt-1 p-3 bg-slate-50 rounded-lg text-xs font-mono overflow-x-auto">
                    {JSON.stringify(parseJson(selectedLog.oldValue), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    New Value
                  </label>
                  <pre className="mt-1 p-3 bg-slate-50 rounded-lg text-xs font-mono overflow-x-auto">
                    {JSON.stringify(parseJson(selectedLog.newValue), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User Agent
                  </label>
                  <p className="text-xs text-slate-600 mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
