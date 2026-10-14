'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  File,
  X,
} from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface BulkImportProps {
  analysisId: string;
  open: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface ImportedRow {
  rowNumber: number;
  productCode: string;
  buyingRate: number;
  currency: string;
  exchangeRate: number;
  costPercentage: number;
  incAmount: number;
  otherCost: number;
  cutCost: number;
  freightCost: number;
  remark: string;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  errors: string[];
}

export function BulkImport({ analysisId, open, onClose, onImportComplete }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      // In real app, this would call the API
      // For now, simulate the import
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate import result
      const validRows = data.filter((d: any) => d.isValid);
      return {
        success: true,
        totalRows: data.length,
        validRows: validRows.length,
        invalidRows: data.length - validRows.length,
        importedCount: validRows.length,
        errors: [],
      };
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast.success(`Imported ${result.importedCount} rows successfully`);
      if (result.importedCount > 0) {
        onImportComplete?.(result.importedCount);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Import failed');
    },
  });

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Process uploaded file
  const processFile = (uploadedFile: File) => {
    if (!uploadedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = validateData(results.data as any[]);
          setParsedData(parsed);
        },
        error: (error: { message?: string }) => {
          toast.error(`Failed to parse file: ${error?.message || 'Unknown error'}`);
        },
      });
    };

    reader.readAsText(uploadedFile);
  };

  // Validate imported data
  const validateData = (data: any[]): ImportedRow[] => {
    return data.map((row, index) => {
      const errors: string[] = [];
      const rowNumber = index + 2; // +2 for header row and 0-based index

      // Validate required fields
      if (!row.productCode && !row.ProductCode && !row['Product Code']) {
        errors.push('Product Code is required');
      }

      // Validate numeric fields
      const buyingRate = parseFloat(row.buyingRate || row.BuyingRate || row['Buying Rate'] || '0');
      if (isNaN(buyingRate) || buyingRate < 0) {
        errors.push('Invalid Buying Rate');
      }

      const costPercentage = parseFloat(row.costPercentage || row.CostPercentage || row['Cost %'] || '0');
      if (isNaN(costPercentage) || costPercentage < 0) {
        errors.push('Invalid Cost %');
      }

      return {
        rowNumber,
        productCode: row.productCode || row.ProductCode || row['Product Code'] || '',
        buyingRate,
        currency: row.currency || row.Currency || 'USD',
        exchangeRate: parseFloat(row.exchangeRate || row.ExchangeRate || row['Exchange Rate'] || '1'),
        costPercentage,
        incAmount: parseFloat(row.incAmount || row.IncAmount || row['Inc Amount'] || '0'),
        otherCost: parseFloat(row.otherCost || row.OtherCost || row['Other Cost'] || '0'),
        cutCost: parseFloat(row.cutCost || row.CutCost || row['Cut Cost'] || '0'),
        freightCost: parseFloat(row.freightCost || row.FreightCost || row['Freight Cost'] || '0'),
        remark: row.remark || row.Remark || '',
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  // Handle import
  const handleImport = () => {
    const validRows = parsedData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    importMutation.mutate(validRows);
  };

  // Handle reset
  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        productCode: 'PRD-001',
        buyingRate: '150.00',
        currency: 'USD',
        exchangeRate: '90.75',
        costPercentage: '5.00',
        incAmount: '0',
        otherCost: '0',
        cutCost: '0',
        freightCost: '5000',
        remark: 'Enter remark here',
      },
      {
        productCode: 'PRD-002',
        buyingRate: '89.50',
        currency: 'USD',
        exchangeRate: '90.75',
        costPercentage: '3.00',
        incAmount: '0',
        otherCost: '0',
        cutCost: '0',
        freightCost: '3000',
        remark: '',
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rate_import_template.csv';
    link.click();
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Rates
          </DialogTitle>
          <DialogDescription>
            Import purchase rates from CSV or Excel file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-800">Download Template</p>
              <p className="text-sm text-blue-600">
                Get the correct format for bulk import
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* File Upload Area */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700">
                Drag & drop your file here
              </p>
              <p className="text-sm text-gray-500 mt-1">or</p>
              <label className="cursor-pointer">
                <Button variant="outline" className="mt-2" asChild>
                  <span>
                    <File className="h-4 w-4 mr-2" />
                    Browse Files
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: CSV, XLSX, XLS (Max 10MB)
              </p>
            </div>
          )}

          {/* File Selected */}
          {file && !importResult && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {Number((file.size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Validation Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{parsedData.length}</p>
                    <p className="text-sm text-blue-600">Total Rows</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{validCount}</p>
                    <p className="text-sm text-green-600">Valid</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                    <p className="text-sm text-red-600">Invalid</p>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead className="text-right">Buying Rate</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Cost %</TableHead>
                      <TableHead className="text-right">Inc</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row) => (
                      <TableRow key={row.rowNumber} className={!row.isValid ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono">{row.rowNumber}</TableCell>
                        <TableCell className="font-mono">{row.productCode}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{row.buyingRate.toFixed(2)}
                        </TableCell>
                        <TableCell>{row.currency}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.costPercentage.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.incAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {row.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                    Showing first 50 of {parsedData.length} rows
                  </div>
                )}
              </div>

              {/* Import Button */}
              {invalidCount > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      {invalidCount} rows have errors
                    </p>
                    <p className="text-sm text-yellow-700">
                      Invalid rows will be skipped during import. You can fix them and re-upload.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              <Card className={importResult.success ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {importResult.success ? (
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-500" />
                    )}
                    <div>
                      <p className="text-xl font-bold">
                        {importResult.success ? 'Import Complete!' : 'Import Failed'}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {importResult.importedCount} of {importResult.totalRows} rows imported successfully
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{importResult.totalRows}</p>
                    <p className="text-sm text-blue-600">Total Rows</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.validRows}</p>
                    <p className="text-sm text-green-600">Valid Rows</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.invalidRows}</p>
                    <p className="text-sm text-red-600">Skipped</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {importResult ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {validCount} Rows
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImport;