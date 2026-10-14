'use client';

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
import { BarChart3, RefreshCw } from 'lucide-react';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () => financialApi.getBalanceSheet(asOfDate).then((res) => res.data),
    enabled: !!asOfDate,
  });

  const report = data as any;

  const renderSection = (title: string, items: any[], totalLabel: string, totalValue: number, color: string) => (
    <div>
      <h3 className={`mb-2 text-lg font-semibold ${color}`}>{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any, i: number) => (
            <TableRow key={i}>
              <TableCell>{item.accountName || item.name}</TableCell>
              <TableCell className="text-right font-mono">
                {Number(item.balance || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold border-t-2">
            <TableCell>{totalLabel}</TableCell>
            <TableCell className={`text-right font-mono ${color}`}>
              {Number(totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground">Assets, liabilities, and equity snapshot</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>As of Date</CardTitle>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-[180px]" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="mb-2 h-10 w-10" />
              <p>Select a date and click Refresh</p>
            </div>
          ) : (
            <div className="space-y-6">
              {report.assets && renderSection(
                'Assets',
                Array.isArray(report.assets) ? report.assets : [],
                'Total Assets',
                report.totalAssets || 0,
                'text-blue-700',
              )}

              {report.liabilities && renderSection(
                'Liabilities',
                Array.isArray(report.liabilities) ? report.liabilities : [],
                'Total Liabilities',
                report.totalLiabilities || 0,
                'text-red-700',
              )}

              {report.equity && renderSection(
                'Equity',
                Array.isArray(report.equity) ? report.equity : [],
                'Total Equity',
                report.totalEquity || 0,
                'text-purple-700',
              )}

              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Liabilities + Equity</span>
                    <span className="text-blue-700">
                      {Number((report.totalLiabilities || 0) + (report.totalEquity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
