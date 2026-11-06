import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GstVerificationService {
  constructor(private readonly config: ConfigService) {}

  async verify(input: unknown) {
    const gstin = typeof input === 'string' ? input.trim().toUpperCase() : '';
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) {
      throw new BadRequestException('Enter a valid 15-character GSTIN.');
    }
    const key = this.config.get<string>('APPYFLOW_GST_API_KEY');
    if (!key) throw new ServiceUnavailableException('GST verification is not configured. Contact your administrator.');

    let data: any;
    try {
      // POST keeps credentials out of URLs and access logs. Never return provider errors verbatim.
      const response = await fetch('https://appyflow.in/api/verifyGST', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstNo: gstin, key_secret: key }),
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Provider unavailable');
      data = await response.json();
    } catch {
      throw new ServiceUnavailableException('GST verification service is unavailable. Please try again later.');
    }
    if (data?.error) {
      throw new ServiceUnavailableException('AppyFlow could not verify this GSTIN. Check the number, or ask your administrator to check API access and credits.');
    }
    const info = data?.taxpayerInfo;
    const value = (v: unknown) => typeof v === 'string' ? v.trim() : '';
    if (!info || value(info.gstin).toUpperCase() !== gstin || !value(info.lgnm) || !value(info.sts)) {
      throw new ServiceUnavailableException('No complete GST registration details were returned. Please try again later.');
    }
    const address = info.pradr?.addr;
    return {
      gstin,
      legalName: value(info.lgnm),
      tradeName: value(info.tradeNam),
      status: value(info.sts),
      address: address ? ['bno', 'flno', 'bnm', 'st', 'loc', 'city', 'dst', 'stcd', 'pncd'].map(k => value(address[k])).filter(Boolean).join(', ') : '',
      registrationDate: value(info.rgdt),
      verifiedAt: new Date().toISOString(),
    };
  }
}
