'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Truck,
  Plus,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GlobalRatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('currency');

  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ currencyCode: '', actualRate: '' });
  const [editingCurrency, setEditingCurrency] = useState<Record<string, string>>({});

  const [showAddHaulage, setShowAddHaulage] = useState(false);
  const [newHaulage, setNewHaulage] = useState({ location: '', ratePerCbm: '', description: '' });
  const [editingHaulage, setEditingHaulage] = useState<Record<string, string>>({});

  const { data: currencyRes, isLoading: currencyLoading } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: rateApi.getCurrencyRates,
  });

  const { data: haulageRes, isLoading: haulageLoading } = useQuery({
    queryKey: ['haulage-rates'],
    queryFn: rateApi.getHaulageRates,
  });

  const currencies: any[] = Array.isArray(currencyRes?.data) ? currencyRes.data : [];
  const haulages: any[] = Array.isArray(haulageRes?.data) ? haulageRes.data : [];

  const createCurrencyMutation = useMutation({
    mutationFn: (data: any) => rateApi.createCurrencyRate(data),
    onSuccess: () => {
      toast.success('Currency rate added');
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
      setShowAddCurrency(false);
      setNewCurrency({ currencyCode: '', actualRate: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add currency rate'),
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rateApi.updateCurrencyRate(id, data),
    onSuccess: () => {
      toast.success('Currency rate updated');
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
      setEditingCurrency({});
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: string) => rateApi.deleteCurrencyRate(id),
    onSuccess: () => {
      toast.success('Currency rate deleted');
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const createHaulageMutation = useMutation({
    mutationFn: (data: any) => rateApi.createHaulageRate(data),
    onSuccess: () => {
      toast.success('Haulage rate added');
      queryClient.invalidateQueries({ queryKey: ['haulage-rates'] });
      setShowAddHaulage(false);
      setNewHaulage({ location: '', ratePerCbm: '', description: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add haulage rate'),
  });

  const updateHaulageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rateApi.updateHaulageRate(id, data),
    onSuccess: () => {
      toast.success('Haulage rate updated');
      queryClient.invalidateQueries({ queryKey: ['haulage-rates'] });
      setEditingHaulage({});
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteHaulageMutation = useMutation({
    mutationFn: (id: string) => rateApi.deleteHaulageRate(id),
    onSuccess: () => {
      toast.success('Haulage rate deleted');
      queryClient.invalidateQueries({ queryKey: ['haulage-rates'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const currencyColors: Record<string, string> = {
    GBP: 'bg-blue-100 text-blue-800 border-blue-200',
    USD: 'bg-green-100 text-green-800 border-green-200',
    CAD: 'bg-orange-100 text-orange-800 border-orange-200',
    AUD: 'bg-purple-100 text-purple-800 border-purple-200',
    EUR: 'bg-red-100 text-red-800 border-red-200',
    EURO: 'bg-red-100 text-red-800 border-red-200',
  };

  const currencySymbols: Record<string, string> = {
    GBP: '£', USD: '$', CAD: 'C$', AUD: 'A$', EUR: '€', EURO: '€',
  };

  return (
    <div className="space-y-4">
      <WorkspacePageHeader title="Global Rates" description={<>Manage currency exchange rates and haulage costs. Changes apply to <strong>new</strong> rate analyses only.</>} />

      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          Existing analyses keep their saved rates. To update an old analysis, open it and change rates there manually.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency Rates
          </TabsTrigger>
          <TabsTrigger value="haulage" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Haulage Rates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Exchange Rates (INR)</h2>
            <Button size="sm" onClick={() => setShowAddCurrency(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Currency
            </Button>
          </div>

          {currencyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : currencies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <DollarSign className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500">No currency rates configured</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddCurrency(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add First Currency
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencies.map((c: any, idx: number) => {
                const id = c.rateId || c.currencyRateId || c.id || `currency-${idx}`;
                const code = (c.currencyCode || '').toUpperCase();
                const isEditing = editingCurrency[id] !== undefined;
                const colorClass = currencyColors[code] || 'bg-slate-100 text-slate-800 border-slate-200';
                const symbol = currencySymbols[code] || '';

                return (
                  <Card key={id} className={`border-2 ${isEditing ? 'border-blue-400 shadow-md' : 'border-slate-200'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={colorClass}>{symbol} {code}</Badge>
                          {c.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">Inactive</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm(`Delete ${code} rate?`)) deleteCurrencyMutation.mutate(id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-500">Rate (1 {code} = ₹)</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingCurrency[id]}
                            onChange={(e) => setEditingCurrency({ ...editingCurrency, [id]: e.target.value })}
                            className="mt-1 font-mono text-lg font-bold"
                            autoFocus
                          />
                        ) : (
                          <p className="mt-1 text-2xl font-bold font-mono text-slate-900">
                            ₹{Number(c.rate || c.actualRate || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      {c.rateDate && (
                        <p className="text-[10px] text-slate-400">
                          Updated: {new Date(c.rateDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => updateCurrencyMutation.mutate({
                                id,
                                data: { rate: Number(editingCurrency[id]), rateDate: new Date() }
                              })}
                              disabled={updateCurrencyMutation.isPending}
                            >
                              {updateCurrencyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const copy = { ...editingCurrency };
                              delete copy[id];
                              setEditingCurrency(copy);
                            }}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditingCurrency({
                              ...editingCurrency,
                              [id]: String(c.rate || c.actualRate || 0)
                            })}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" /> Update Rate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="haulage" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Haulage Rates (Factory → Port)</h2>
            <Button size="sm" onClick={() => setShowAddHaulage(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Location
            </Button>
          </div>

          {haulageLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : haulages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Truck className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500">No haulage rates configured</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddHaulage(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add First Location
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {haulages.map((h: any, idx: number) => {
                const id = h.haulageId || h.id || `haulage-${idx}`;
                const isEditing = editingHaulage[id] !== undefined;

                return (
                  <Card key={id} className={`border-2 ${isEditing ? 'border-yellow-400 shadow-md' : 'border-slate-200'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                            <MapPin className="h-4 w-4 text-yellow-700" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{(h.location || '').toUpperCase()}</p>
                            {h.description && <p className="text-[10px] text-slate-400">{h.description}</p>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm(`Delete ${h.location} haulage?`)) deleteHaulageMutation.mutate(id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-500">Rate per CBM (INR)</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="100"
                            value={editingHaulage[id]}
                            onChange={(e) => setEditingHaulage({ ...editingHaulage, [id]: e.target.value })}
                            className="mt-1 font-mono text-lg font-bold"
                            autoFocus
                          />
                        ) : (
                          <p className="mt-1 text-2xl font-bold font-mono text-slate-900">
                            ₹{Number(h.ratePerCbm || 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {(h.updatedAt || h.createdAt) && (
                        <p className="text-[10px] text-slate-400">
                          Updated: {new Date(h.updatedAt || h.createdAt).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => updateHaulageMutation.mutate({
                                id,
                                data: { ratePerCbm: Number(editingHaulage[id]) }
                              })}
                              disabled={updateHaulageMutation.isPending}
                            >
                              {updateHaulageMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const copy = { ...editingHaulage };
                              delete copy[id];
                              setEditingHaulage(copy);
                            }}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditingHaulage({
                              ...editingHaulage,
                              [id]: String(h.ratePerCbm || 0)
                            })}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" /> Update Rate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddCurrency} onOpenChange={setShowAddCurrency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Currency Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Currency Code</Label>
              <Input
                placeholder="e.g. GBP, USD, CAD"
                value={newCurrency.currencyCode}
                onChange={(e) => setNewCurrency({ ...newCurrency, currencyCode: e.target.value.toUpperCase() })}
                className="mt-1 font-mono"
                maxLength={5}
              />
            </div>
            <div>
              <Label>Rate (1 unit = ₹ INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 93.00"
                value={newCurrency.actualRate}
                onChange={(e) => setNewCurrency({ ...newCurrency, actualRate: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCurrency(false)}>Cancel</Button>
            <Button
              onClick={() => createCurrencyMutation.mutate({
                currencyCode: newCurrency.currencyCode,
                currencyName: newCurrency.currencyCode,
                rate: Number(newCurrency.actualRate),
                rateDate: new Date(),
                source: 'MANUAL',
              })}
              disabled={!newCurrency.currencyCode || !newCurrency.actualRate || createCurrencyMutation.isPending}
            >
              {createCurrencyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddHaulage} onOpenChange={setShowAddHaulage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Haulage Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. CHENNAI, KOLKATA"
                value={newHaulage.location}
                onChange={(e) => setNewHaulage({ ...newHaulage, location: e.target.value.toUpperCase() })}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>Rate per CBM (INR)</Label>
              <Input
                type="number"
                step="1000"
                placeholder="e.g. 195000"
                value={newHaulage.ratePerCbm}
                onChange={(e) => setNewHaulage({ ...newHaulage, ratePerCbm: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="e.g. Factory to Nhava Sheva"
                value={newHaulage.description}
                onChange={(e) => setNewHaulage({ ...newHaulage, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHaulage(false)}>Cancel</Button>
            <Button
              onClick={() => createHaulageMutation.mutate({
                location: newHaulage.location,
                ratePerCbm: Number(newHaulage.ratePerCbm),
                description: newHaulage.description || undefined,
              })}
              disabled={!newHaulage.location || !newHaulage.ratePerCbm || createHaulageMutation.isPending}
            >
              {createHaulageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
