'use client';

import { useEffect, useRef, useState } from 'react';
import { receivingPlanApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Registration = {
  gstin: string; legalName: string; tradeName: string; status: string;
  address: string; registrationDate: string; verifiedAt: string;
};

export function GstVerificationField({ id, value, onChange }: {
  id: string; value: string; onChange: (value: string) => void;
}) {
  const [result, setResult] = useState<Registration | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  useEffect(() => {
    sequence.current++;
    setResult(null); setError(''); setLoading(false);
    return () => { sequence.current++; };
  }, [value]);

  async function verify() {
    const gstin = value.trim().toUpperCase();
    setResult(null); setError('');
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) {
      setError('Enter a valid 15-character GSTIN.'); return;
    }
    const request = ++sequence.current;
    setLoading(true);
    try {
      const response = await receivingPlanApi.verifyGstin(gstin);
      if (request === sequence.current) setResult(response.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      if (request === sequence.current) setError(typeof message === 'string' ? message : 'GST verification failed. Please try again.');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }

  const active = result?.status.toLowerCase() === 'active';
  return <div className="space-y-2">
    <div className="flex gap-2">
      <Input id={id} placeholder="Enter supplier GSTIN" value={value} maxLength={15}
        aria-describedby={`${id}-result`} aria-invalid={Boolean(error)}
        onChange={e => { sequence.current++; setResult(null); setError(''); setLoading(false); onChange(e.target.value.toUpperCase()); }} />
      <Button type="button" size="sm" disabled={loading || !value.trim()} onClick={verify}
        className="bg-green-600 hover:bg-green-700 text-white shrink-0">
        {loading ? 'Verifying…' : 'Verify GST'}
      </Button>
    </div>
    <div id={`${id}-result`} aria-live="polite">
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {result && <div className={`rounded-lg border p-3 text-sm space-y-1 ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <p className="font-semibold">{result.legalName}</p>
        {result.tradeName && <p>Trade name: {result.tradeName}</p>}
        <p className="font-semibold">GST status: {result.status}</p>
        {!active && <p>This registration is not active. Review before proceeding.</p>}
        {result.address && <p>{result.address}</p>}
        {result.registrationDate && <p>Registered: {result.registrationDate}</p>}
        <p>Checked: {new Date(result.verifiedAt).toLocaleString()}</p>
      </div>}
    </div>
  </div>;
}
