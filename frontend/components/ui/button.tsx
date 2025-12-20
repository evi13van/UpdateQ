"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Note: I'm simulating the cva import behavior or just writing it out if I don't have the package.
// Since I didn't install class-variance-authority, I will implement a simpler version or install it.
// Actually, I should install it to be safe and standard.
// But for now, I'll write a standard component without cva to save a step, or just install it.
// I'll install it quickly.

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:brightness-110 border-0",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        outline:
          "border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-slate-200 backdrop-blur-sm",
        secondary:
          "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ghost: "hover:bg-white/5 hover:text-white text-slate-300",
        link: "text-emerald-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button";
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
