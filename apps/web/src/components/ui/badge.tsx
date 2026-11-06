import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#2563eb] text-white ring-[#2563eb]/20',
        secondary: 'bg-[#fcfeff]/20 text-slate-900 ring-[#fcfeff]/50',
        destructive: 'bg-[#b90f1c] text-white ring-[#b90f1c]/20',
        outline: 'bg-transparent text-slate-900 ring-[#fcfeff]',
        success: 'bg-[#00aa7f]/10 text-[#067461] ring-[#008947]/20',
        warning: 'bg-[#9b9600]/10 text-[#5f3e0d] ring-[#9b9600]/20',
        info: 'bg-[#00958f]/10 text-[#103b5a] ring-[#036b97]/20',
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
