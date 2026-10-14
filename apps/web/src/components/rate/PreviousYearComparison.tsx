'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface PreviousYearComparisonProps {
  analysisId: string;
  buyerCode: string;
  open: boolean;
  onClose: () => void;
}

interface HistoricalRate {
  enquiryId: string;
  enquiryNo: string;
  date: Date;
  productCode: string;
  productName: string;
  previousRate: number;
  currentRate: number;
  changeAmount: number;
  changePercentage: number;
  currency: string;
}

interface ComparisonResult {
  productCode: string;
  productName: string;
  previousEnquiryNo: string;
  previousDate: string;
  previousRate: number;
  currentRate: number;
  changeAmount: number;
  changePercentage: number;
  changeDirection: 'up' | 'down' | 'same';
}

export function PreviousYearComparison({
  analysisId,
  buyerCode,
  open,
  onClose,
}: PreviousYearComparisonProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Fetch historical rates for this buyer
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['previous-year-rates', buyerCode, selectedYear],
    queryFn: async () => {
      // In real app, this would be an API call
      // Mock data for demonstration
      return {
        data: [
          {
            enquiryId: 'hist-1',
            enquiryNo: 'ENQ-2025-000123',
            date: '2025-03-15',
            productCode: 'PRD-001',
            productName: 'Almond Oil 190ml',
            previousRate: 145.50,
            currentRate: 0, // Will be filled from current analysis
            buyerCode: buyerCode,
          },
          {
            enquiryId: 'hist-2',
            enquiryNo: 'ENQ-2025-000456',
            date: '2025-06-20',
            productCode: 'PRD-002',
            productName: 'Soya Chunks 500g',
            previousRate: 89.25,
            currentRate: 0,
            buyerCode: buyerCode,
          },
        ],
      };
    },
    enabled: !!buyerCode,
  });

  // Fetch current analysis items
  const { data: currentAnalysis } = useQuery({
    queryKey: ['current-analysis', analysisId],
    queryFn: () => rateApi.getAnalysisById(analysisId),
    enabled: !!analysisId,
  });

  // Calculate comparison
  const comparisonData: ComparisonResult[] = historicalData?.data?.map((hist: any) => {
    const currentItem = currentAnalysis?.data?.items?.find(
      (item: any) => item.productCode === hist.productCode
    );
    const currentRate = currentItem?.finalRateInr || currentItem?.buyingBestLandingRate || 0;
    const changeAmount = currentRate - hist.previousRate;
    const changePercentage = hist.previousRate > 0
      ? (changeAmount / hist.previousRate) * 100
      : 0;

    return {
      productCode: hist.productCode,
      productName: hist.productName,
      previousEnquiryNo: hist.enquiryNo,
      previousDate: hist.date,
      previousRate: hist.previousRate,
      currentRate,
      changeAmount,
      changePercentage,
      changeDirection: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'same',
    };
  }) || [];

  // Summary stats
  const summaryStats = {
    totalProducts: comparisonData.length,
    increased: comparisonData.filter((c) => c.changeDirection === 'up').length,
    decreased: comparisonData.filter((c) => c.changeDirection === 'down').length,
    same: comparisonData.filter((c) => c.changeDirection === 'same').length,
    avgChange: comparisonData.length > 0
      ? comparisonData.reduce((sum, c) => sum + c.changePercentage, 0) / comparisonData.length
      : 0,
  };

  const years = [selectedYear - 2, selectedYear - 1, selectedYear];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Previous Year Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Year Selector */}
          <div className="flex items-center gap-4">
            <Label>Compare with:</Label>
            <div className="flex gap-2">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  FY {year}-{year + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="bg-gray-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{summaryStats.totalProducts}</p>
                <p className="text-xs text-gray-500">Products</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  {summaryStats.increased}
                </p>
                <p className="text-xs text-red-600">Increased</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <ArrowDownRight className="h-4 w-4" />
                  {summaryStats.decreased}
                </p>
                <p className="text-xs text-green-600">Decreased</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.same}
                </p>
                <p className="text-xs text-blue-600">No Change</p>
              </CardContent>
            </Card>
            <Card className={summaryStats.avgChange >= 0 ? 'bg-orange-50' : 'bg-purple-50'}>
              <CardContent className="pt-4 text-center">
                <p className={`text-2xl font-bold ${summaryStats.avgChange >= 0 ? 'text-orange-600' : 'text-purple-600'}`}>
                  {summaryStats.avgChange >= 0 ? '+' : ''}{summaryStats.avgChange.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">Avg Change</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Previous Enquiry</TableHead>
                  <TableHead className="text-right">Previous Rate</TableHead>
                  <TableHead className="text-right">Current Rate</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">% Change</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.length > 0 ? (
                  comparisonData.map((item) => (
                    <TableRow key={item.productCode}>
                      <TableCell className="font-mono">{item.productCode}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.productName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-mono">{item.previousEnquiryNo}</p>
                          <p className="text-gray-500">{item.previousDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{item.previousRate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.currentRate > 0 ? `₹${item.currentRate.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${
                        item.changeAmount > 0 ? 'text-red-600' : item.changeAmount < 0 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {item.currentRate > 0 ? (
                          <>
                            {item.changeAmount > 0 ? '+' : ''}₹{item.changeAmount.toFixed(2)}
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell className={`text-right ${
                        item.changePercentage > 0 ? 'text-red-600' : item.changePercentage < 0 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {item.currentRate > 0 ? (
                          <Badge className={
                            item.changePercentage > 0 ? 'bg-red-100 text-red-700' :
                            item.changePercentage < 0 ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {item.changePercentage > 0 ? '+' : ''}{item.changePercentage.toFixed(2)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.changeDirection === 'up' && (
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        )}
                        {item.changeDirection === 'down' && (
                          <TrendingDown className="h-5 w-5 text-green-500" />
                        )}
                        {item.changeDirection === 'same' && (
                          <Minus className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No previous year data found for this buyer
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span>Rate increased from previous year</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span>Rate decreased from previous year</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-400" />
              <span>No significant change</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PreviousYearComparison;
