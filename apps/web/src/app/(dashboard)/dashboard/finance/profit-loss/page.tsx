'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TrendingUp, RefreshCw } from 'lucide-react';

export default function ProfitLossPage() {
  const today = new Date();
  const fyStart = new Date(today.getFullYear(), 3, 1);
  if (today < fyStart) fyStart.setFullYear(fyStart.getFullYear() - 1);

  const [fromDate, setFromDate] = useState(fyStart.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-loss', fromDate, toDate],
    queryFn: () => financialApi.getProfitAndLoss(fromDate, toDate).then((res) => res.data),
    enabled: !!fromDate && !!toDate,
  });

  const report = data as any;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title={<>Profit & Loss Statement</>} description="Income and expense summary for the period">
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Period Selection</CardTitle>
            <div className="flex gap-2">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[160px]" />
              <span className="flex items-center text-muted-foreground">to</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[160px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="mb-2 h-10 w-10" />
              <p>Select a date range and click Refresh</p>
            </div>
          ) : (
            <div className="space-y-6">
              {report.revenue && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-green-700">Revenue</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(report.revenue) ? report.revenue : []).map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{item.accountName || item.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(item.balance || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right font-mono text-green-700">
                          {Number(report.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {report.expenses && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-red-700">Expenses</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(report.expenses) ? report.expenses : []).map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{item.accountName || item.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(item.balance || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right font-mono text-red-700">
                          {Number(report.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>{Number(report.netProfit || report.netIncome || 0) >= 0 ? 'Net Profit' : 'Net Loss'}</span>
                    <span className={Number(report.netProfit || report.netIncome || 0) >= 0 ? 'text-green-700' : 'text-red-700'}>
                      {Number(report.netProfit || report.netIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
