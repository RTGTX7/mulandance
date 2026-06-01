import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-ring/15',
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-primary/90 text-primary-foreground hover:bg-primary',
        secondary:
          'border-secondary/20 bg-secondary/90 text-secondary-foreground hover:bg-secondary',
        destructive:
          'border-destructive/20 bg-destructive/90 text-destructive-foreground hover:bg-destructive',
        outline: 'border-white/60 bg-white/60 text-foreground',
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
