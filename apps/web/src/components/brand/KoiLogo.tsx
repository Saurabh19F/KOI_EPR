'use client';

import { cn } from '@/lib/utils';

type KoiLogoProps = {
  variant?: 'icon' | 'wordmark';
  className?: string;
};

const KOI_ICON_LOGO_SRC = '/koi-logo-square.jpeg';
const KOI_WORDMARK_LOGO_SRC = '/koi-logo-rectangle.png';

export function KoiLogo({ variant = 'wordmark', className }: KoiLogoProps) {
  if (variant === 'icon') {
    return (
      <span
        className={cn(
          'relative block h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white shadow-sm',
          className,
        )}
        aria-label="Krishna Overseas Inc."
      >
        <img
          src={KOI_ICON_LOGO_SRC}
          alt=""
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative block h-20 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
      aria-label="Krishna Overseas Inc."
    >
      <img
        src={KOI_WORDMARK_LOGO_SRC}
        alt=""
        className="h-full w-full object-contain"
      />
    </span>
  );
}
