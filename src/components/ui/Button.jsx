/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900/40 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-sm font-semibold",
        primary:
          "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-sm font-semibold",
        success:
          "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-semibold",
        modalPrimary:
          "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-sm font-semibold",
        destructive:
          "bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold",
        destructiveOutline:
          "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold shadow-xs",
        outline:
          "border border-slate-300 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-muted font-semibold",
        modalOutline:
          "border border-slate-300 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-muted font-semibold",
        secondary:
          "border border-slate-200 dark:border-border bg-slate-100 dark:bg-muted text-slate-800 dark:text-foreground hover:bg-slate-200 dark:hover:bg-muted/80 font-semibold",
        ghost:
          "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted font-semibold",
        link:
          "text-[#1e3a8a] dark:text-blue-400 underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "min-h-[40px] px-5 py-2.5 text-xs sm:text-sm",
        sm: "min-h-[36px] px-4 py-2 text-xs rounded-lg",
        lg: "min-h-[44px] px-6 sm:px-7 py-2.5 text-sm font-semibold rounded-lg",
        icon: "h-10 w-10 min-h-[40px] rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        strokeWidth="3"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        stroke="currentColor"
      />
    </svg>
  );
}

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && !asChild && <Spinner />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
Button.variants = buttonVariants;

export { Button };
export default Button;
