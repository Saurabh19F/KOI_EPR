import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#9a6b36] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#0f2f29] text-white',
        secondary: 'border-transparent bg-[#efe8dc] text-slate-900',
        destructive: 'border-transparent bg-red-600 text-white',
        outline: 'border-[#dcd4c8] text-slate-900',
        success: 'border-transparent bg-emerald-100 text-emerald-800',
        warning: 'border-transparent bg-[#f4eadc] text-[#7a4f24]',
        info: 'border-transparent bg-sky-100 text-sky-800',
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
