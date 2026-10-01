"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-glow hover:bg-accent-soft",
        glass: "glass hover:bg-white/10",
        // Sekundärakzent aus dem Logo: Orange -> Pink (für besondere Highlights, nicht für Navigation)
        warm: "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-[0_0_24px_-6px_rgba(244,114,182,0.65)] hover:brightness-110",
        ghost: "hover:bg-white/10",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-12 px-5 text-base",
        lg: "h-14 px-6 text-lg font-display",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Kein Klick-Sound (z.B. wenn die Aktion einen eigenen Sound abspielt) */
  silent?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, silent, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          // Nur primäre Buttons klicken hörbar; Glas-/Ghost-Buttons bleiben still
          if (!silent && (variant == null || variant === "default" || variant === "warm")) playSound("click");
          onClick?.(e);
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
