import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25',
        outline: 'border border-white/60 bg-white/60 text-foreground shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/90 hover:text-primary hover:shadow-md',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/20 hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/25',
        ghost: 'bg-transparent hover:-translate-y-0.5 hover:bg-white/60 hover:text-foreground hover:shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline hover:opacity-80',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-8 rounded-lg px-2.5 text-xs',
        lg: 'h-10 rounded-lg px-5 md:px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
