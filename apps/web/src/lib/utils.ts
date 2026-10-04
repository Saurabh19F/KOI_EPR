import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns the currency symbol for a given ISO currency code.
 * Falls back to the code itself if not found.
 */
export function getCurrencySymbol(currencyCode?: string | null): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    SGD: 'S$',
    AED: 'AED',
    SAR: 'SAR',
  };
  return symbols[code] ?? code;
}

/**
 * Formats a numeric amount with the correct currency symbol.
 * Uses the locale-appropriate number format.
 */
export function formatAmount(amount: number, currencyCode?: string | null): string {
  const symbol = getCurrencySymbol(currencyCode);
  const locale = currencyCode?.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${symbol}${formatted}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

export function generateEnquiryNumber(userCode: string, year: number, sequence: number): string {
  return `ENQ-${userCode}-${year}-${sequence.toString().padStart(4, '0')}`;
}

export function generateSku(category: string, segment: string, group: string, serial: number): string {
  return `${category}-${segment}-${group}-${serial.toString().padStart(3, '0')}`;
}

export const STATUS_COLORS: Record<string, string> = {
  // Sales & General
  draft: 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
  submitted: 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold',
  punched: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold',
  verified: 'bg-sky-100 text-sky-800 border border-sky-300 font-semibold',

  // Purchase Module
  purchase_assigned: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold',
  purchase_in_progress: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
  purchase_pending: 'bg-yellow-100 text-yellow-900 border border-yellow-300 font-semibold',
  purchase_completed: 'bg-teal-100 text-teal-800 border border-teal-300 font-semibold',

  // MIS Module
  mis_review: 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-semibold',
  mis_approved: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
  mis_requote_required: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
  requote_required: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
  revised: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',

  // Rate Calculation & Costing
  rate_calculation: 'bg-purple-100 text-purple-800 border border-purple-300 font-semibold',
  rate_pending: 'bg-purple-100 text-purple-800 border border-purple-300 font-semibold',
  sent_to_costing: 'bg-violet-100 text-violet-800 border border-violet-300 font-semibold',
  rate_finalized: 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300 font-semibold',

  // Approval & Final Statuses
  approval_pending: 'bg-orange-100 text-orange-800 border border-orange-300 font-semibold',
  approved: 'bg-green-100 text-green-800 border border-green-300 font-semibold',
  under_review: 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold',
  vendor_quote_pending: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',

  // Quotation & Order Outcomes
  quotation_created: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold',
  quotation_sent: 'bg-sky-100 text-sky-800 border border-sky-300 font-semibold',
  won: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
  lost: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
  rejected: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
  cancelled: 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold',
};

export function getStatusColor(status?: string | null): string {
  if (!status) return 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold';
  const normalized = status.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return STATUS_COLORS[normalized] || STATUS_COLORS[status] || 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold';
}
