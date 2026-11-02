import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#9a6b36] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#0f2f29] text-white ring-[#0f2f29]/20',
        secondary: 'bg-[#efe8dc] text-slate-900 ring-[#dcd4c8]/50',
        destructive: 'bg-red-600 text-white ring-red-600/20',
        outline: 'bg-transparent text-slate-900 ring-[#dcd4c8]',
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        warning: 'bg-[#f4eadc] text-[#7a4f24] ring-[#9a6b36]/20',
        info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
