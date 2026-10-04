'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Truck,
  Percent,
  Bell,
  History,
  Moon,
  Sun,
  Monitor,
  Plus,
  Edit,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import new components
import { MarginRulesEngine } from '@/components/rate/MarginRulesEngine';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// Type definitions for API responses
interface CurrencyRateData {
  currencyId?: string;
  id?: string;
  currencyCode: string;
  currencyName?: string;
  baseRate?: number;
  rate?: number;
  adjustment?: number;
  effectiveFrom?: string;
}

interface HaulageRateData {
  haulageId?: string;
  id?: string;
  location: string;
  locationCode?: string;
  country?: string;
  pod?: string;
  ratePerCbm?: number;
  containerType?: string;
  isDefault?: boolean;
}

interface AuditLogData {
  auditId?: string;
  id?: string;
  entityType: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  performedByName?: string;
  performedBy?: string;
}

interface ApiResponse<T> {
  data: T[];
  total?: number;
}

export default function AdminPriceAnalysisPage() {
  const queryClient = useQueryClient();

  // Currency rates state
  const [currencyDialog, setCurrencyDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    currency: CurrencyRateData | null;
  }>({ open: false, mode: 'add', currency: null });

  const [currencyForm, setCurrencyForm] = useState({
    currencyCode: '',
    currencyName: '',
    rate: 0,
    adjustment: 0,
  });

  // Haulage rates state
  const [haulageDialog, setHaulageDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    haulage: HaulageRateData | null;
  }>({ open: false, mode: 'add', haulage: null });

  const [haulageForm, setHaulageForm] = useState({
    location: '',
    locationCode: '',
    country: '',
    pod: '',
    ratePerCbm: 0,
    containerType: '40FT',
    isDefault: false,
  });

  // Audit logs state
  const [auditPage, setAuditPage] = useState(1);

  // Queries with proper typing
  const { data: currencyRates, isLoading: loadingCurrency } = useQuery<ApiResponse<CurrencyRateData>>({
    queryKey: ['currency-rates-admin'],
    queryFn: rateApi.getCurrencyRates,
  });

  const { data: haulageRates, isLoading: loadingHaulage } = useQuery<ApiResponse<HaulageRateData>>({
    queryKey: ['haulage-rates-admin'],
    queryFn: rateApi.getHaulageRates,
  });

  const { data: auditData, isLoading: loadingAudit, refetch: refetchAudit } = useQuery<ApiResponse<AuditLogData>>({
    queryKey: ['audit-logs', auditPage],
    queryFn: () => rateApi.getAuditLogs({ page: auditPage, limit: 50 }),
  });

  // Mutations
  const saveCurrencyMutation = useMutation({
    mutationFn: (data: any) => rateApi.saveCurrencyRate(data),
    onSuccess: () => {
      toast.success('Currency rate saved');
      queryClient.invalidateQueries({ queryKey: ['currency-rates-admin'] });
      setCurrencyDialog({ open: false, mode: 'add', currency: null });
      setCurrencyForm({ currencyCode: '', currencyName: '', rate: 0, adjustment: 0 });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed'),
  });

  const saveHaulageMutation = useMutation({
    mutationFn: (data: any) => rateApi.saveHaulageRate(data),
    onSuccess: () => {
      toast.success('Haulage rate saved');
      queryClient.invalidateQueries({ queryKey: ['haulage-rates-admin'] });
      setHaulageDialog({ open: false, mode: 'add', haulage: null });
      setHaulageForm({ location: '', locationCode: '', country: '', pod: '', ratePerCbm: 0, containerType: '40FT', isDefault: false });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed'),
  });

  const handleEditCurrency = (currency: CurrencyRateData) => {
    setCurrencyForm({
      currencyCode: currency.currencyCode,
      currencyName: currency.currencyName || '',
      rate: Number(currency.rate ?? currency.baseRate ?? 0),
      adjustment: Number(currency.adjustment || 0),
    });
    setCurrencyDialog({ open: true, mode: 'edit', currency });
  };

  const handleEditHaulage = (haulage: HaulageRateData) => {
    setHaulageForm({
      location: haulage.location,
      locationCode: haulage.locationCode || '',
      country: haulage.country || '',
      pod: haulage.pod || '',
      ratePerCbm: Number(haulage.ratePerCbm || 0),
      containerType: haulage.containerType || '40FT',
      isDefault: haulage.isDefault || false,
    });
    setHaulageDialog({ open: true, mode: 'edit', haulage });
  };

  const handleSaveCurrency = () => {
    saveCurrencyMutation.mutate({
      id: currencyDialog.currency?.currencyId || currencyDialog.currency?.id || null,
      currencyCode: currencyForm.currencyCode,
      currencyName: currencyForm.currencyName,
      rate: currencyForm.rate,
      adjustment: currencyForm.adjustment,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
  };

  const handleSaveHaulage = () => {
    saveHaulageMutation.mutate({
      id: haulageDialog.haulage?.haulageId || haulageDialog.haulage?.id || null,
      location: haulageForm.location.toUpperCase(),
      locationCode: haulageForm.locationCode,
      country: haulageForm.country,
      pod: haulageForm.pod,
      ratePerCbm: haulageForm.ratePerCbm,
      containerType: haulageForm.containerType,
      isDefault: haulageForm.isDefault,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
  };

  const currencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD'];
  const currencyRatesList = currencyRates?.data || [];

  const getCurrencyRate = (code: string): CurrencyRateData | undefined => {
    return currencyRatesList.find((r) => r.currencyCode === code);
  };

  const auditTotal = auditData?.total || 0;
  const auditLogs = auditData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Analysis Configuration</h1>
        <p className="text-gray-500">Manage currency, haulage, margin rules, and notifications</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="currency" className="space-y-6">
        <TabsList>
          <TabsTrigger value="currency">
            <DollarSign className="h-4 w-4 mr-2" />
            Currency Rates
          </TabsTrigger>
          <TabsTrigger value="haulage">
            <Truck className="h-4 w-4 mr-2" />
            Haulage Rates
          </TabsTrigger>
          <TabsTrigger value="margins">
            <Percent className="h-4 w-4 mr-2" />
            Margin Rules
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Moon className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Currency Rates Tab */}
        <TabsContent value="currency">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Currency Rates Configuration</CardTitle>
                <Button onClick={() => setCurrencyDialog({ open: true, mode: 'add', currency: null })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Currency Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCurrency ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Base Rate (INR)</TableHead>
                      <TableHead className="text-right">Adjustment</TableHead>
                      <TableHead className="text-right">Final Rate</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currencies.map((code) => {
                      const rate = getCurrencyRate(code);
                      const baseRate = Number(rate?.baseRate ?? rate?.rate ?? 0);
                      const adjustment = Number(rate?.adjustment || 0);
                      return (
                        <TableRow key={code}>
                          <TableCell className="font-mono font-medium">{code}</TableCell>
                          <TableCell>{rate?.currencyName || '-'}</TableCell>
                          <TableCell className="text-right">{baseRate.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{adjustment.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-bold">{(baseRate - adjustment).toFixed(4)}</TableCell>
                          <TableCell>{rate?.effectiveFrom ? new Date(rate.effectiveFrom).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => rate && handleEditCurrency(rate)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Haulage Rates Tab */}
        <TabsContent value="haulage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Haulage Rates Configuration</CardTitle>
                <Button onClick={() => setHaulageDialog({ open: true, mode: 'add', haulage: null })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Haulage Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHaulage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Rate/CBM (INR)</TableHead>
                      <TableHead className="text-right">USD Approx.</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {haulageRates?.data && haulageRates.data.length > 0 ? (
                      haulageRates.data.map((haulage) => {
                        const usdCurrencyRate = getCurrencyRate('USD');
                        const usdRate = Number(usdCurrencyRate?.rate ?? usdCurrencyRate?.baseRate ?? 90.75) || 90.75;
                        const ratePerCbm = Number(haulage.ratePerCbm || 0);
                        return (
                          <TableRow key={haulage.haulageId || haulage.id}>
                            <TableCell className="font-medium">{haulage.location}</TableCell>
                            <TableCell>{haulage.locationCode || '-'}</TableCell>
                            <TableCell>{haulage.country || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{ratePerCbm.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ${(ratePerCbm / usdRate).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {haulage.isDefault && (
                                <Badge className="bg-green-100 text-green-700">Default</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditHaulage(haulage)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No haulage rates configured
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margin Rules Tab */}
        <TabsContent value="margins">
          <Card>
            <CardContent className="pt-6">
              <MarginRulesEngine />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6">
              <NotificationCenter showAll />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-gray-500">Choose your preferred color scheme</p>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-blue-500 transition-colors"
                    onClick={() => {
                      localStorage.setItem('erp-theme', 'light');
                      document.documentElement.classList.remove('dark');
                      document.documentElement.classList.add('light');
                    }}
                  >
                    <Sun className="h-8 w-8 text-yellow-500" />
                    <span className="font-medium">Light</span>
                    <div className="w-full h-8 bg-white border rounded mt-2" />
                  </button>

                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-blue-500 transition-colors"
                    onClick={() => {
                      localStorage.setItem('erp-theme', 'dark');
                      document.documentElement.classList.remove('light');
                      document.documentElement.classList.add('dark');
                    }}
                  >
                    <Moon className="h-8 w-8 text-blue-500" />
                    <span className="font-medium">Dark</span>
                    <div className="w-full h-8 bg-gray-800 rounded mt-2" />
                  </button>

                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-blue-500 transition-colors"
                    onClick={() => {
                      localStorage.setItem('erp-theme', 'system');
                      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      document.documentElement.classList.remove('light', 'dark');
                      document.documentElement.classList.add(isDark ? 'dark' : 'light');
                    }}
                  >
                    <Monitor className="h-8 w-8 text-gray-500" />
                    <span className="font-medium">System</span>
                    <div className="w-full h-8 bg-gradient-to-r from-white to-gray-800 rounded mt-2" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit Logs</CardTitle>
                <Button variant="outline" onClick={() => refetchAudit()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Old Value</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <TableRow key={log.auditId || log.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.entityType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                log.action === 'APPROVE' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.fieldName || '-'}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{log.oldValue || '-'}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{log.newValue || '-'}</TableCell>
                            <TableCell>{log.performedByName || log.performedBy || '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {auditTotal > 50 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {((auditPage - 1) * 50) + 1} to {Math.min(auditPage * 50, auditTotal)} of {auditTotal}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAuditPage((p) => p + 1)} disabled={auditPage * 50 >= auditTotal}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Currency Dialog */}
      <Dialog open={currencyDialog.open} onOpenChange={(open) => !open && setCurrencyDialog({ ...currencyDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currencyDialog.mode === 'add' ? 'Add' : 'Edit'} Currency Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency Code *</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={currencyForm.currencyCode}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, currencyCode: e.target.value })}
                  disabled={currencyDialog.mode === 'edit'}
                >
                  <option value="">Select</option>
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Currency Name</Label>
                <Input value={currencyForm.currencyName} onChange={(e) => setCurrencyForm({ ...currencyForm, currencyName: e.target.value })} placeholder="US Dollar" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Rate (INR)</Label>
                <Input type="number" step="0.0001" value={currencyForm.rate} onChange={(e) => setCurrencyForm({ ...currencyForm, rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Adjustment (-)</Label>
                <Input type="number" step="0.0001" value={currencyForm.adjustment} onChange={(e) => setCurrencyForm({ ...currencyForm, adjustment: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Final Rate:</span>
                <span className="font-bold text-lg">{(currencyForm.rate - currencyForm.adjustment).toFixed(4)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrencyDialog({ open: false, mode: 'add', currency: null })}>Cancel</Button>
            <Button onClick={handleSaveCurrency} disabled={!currencyForm.currencyCode || saveCurrencyMutation.isPending}>
              {saveCurrencyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Haulage Dialog */}
      <Dialog open={haulageDialog.open} onOpenChange={(open) => !open && setHaulageDialog({ ...haulageDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{haulageDialog.mode === 'add' ? 'Add' : 'Edit'} Haulage Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location *</Label>
                <Input value={haulageForm.location} onChange={(e) => setHaulageForm({ ...haulageForm, location: e.target.value.toUpperCase() })} placeholder="DELHI" />
              </div>
              <div>
                <Label>Location Code</Label>
                <Input value={haulageForm.locationCode} onChange={(e) => setHaulageForm({ ...haulageForm, locationCode: e.target.value.toUpperCase() })} placeholder="DEL" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Input value={haulageForm.country} onChange={(e) => setHaulageForm({ ...haulageForm, country: e.target.value })} placeholder="India" />
              </div>
              <div>
                <Label>POD</Label>
                <Input value={haulageForm.pod} onChange={(e) => setHaulageForm({ ...haulageForm, pod: e.target.value })} placeholder="Mundra" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate per CBM (INR) *</Label>
                <Input type="number" value={haulageForm.ratePerCbm} onChange={(e) => setHaulageForm({ ...haulageForm, ratePerCbm: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Container Type</Label>
                <select className="w-full h-10 px-3 border rounded-md" value={haulageForm.containerType} onChange={(e) => setHaulageForm({ ...haulageForm, containerType: e.target.value })}>
                  <option value="20FT">20 FT</option>
                  <option value="40FT">40 FT</option>
                  <option value="40HC">40 HC</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={haulageForm.isDefault} onChange={(e) => setHaulageForm({ ...haulageForm, isDefault: e.target.checked })} className="h-4 w-4" />
              <span>Set as default for this location</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHaulageDialog({ open: false, mode: 'add', haulage: null })}>Cancel</Button>
            <Button onClick={handleSaveHaulage} disabled={!haulageForm.location || !haulageForm.ratePerCbm || saveHaulageMutation.isPending}>
              {saveHaulageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
