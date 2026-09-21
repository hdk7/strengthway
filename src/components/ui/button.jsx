import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

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

export { Button };
export default Button;
