"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const Avatar = React.forwardRef(({ className, name, src, alt, children, ...props }, ref) => {
  if (name && !children) {
    const initials = getInitials(name);
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-[13.5px] font-semibold text-accent-foreground leading-none",
          className,
        )}
        {...props}
      >
        {src && (
          <AvatarPrimitive.Image
            className="aspect-square h-full w-full"
            src={src}
            alt={alt || name}
          />
        )}
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center rounded-full bg-accent text-accent-foreground text-[13.5px] font-semibold leading-none"
          delayMs={src ? 600 : undefined}
          aria-hidden="true"
        >
          {initials}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    >
      {children}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
export default Avatar;
