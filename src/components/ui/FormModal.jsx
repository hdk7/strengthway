import React, { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standardized Form Modal Component Suite
 * Based on the reference design:
 * - Light, translucent backdrop allowing background page layout/tables to remain visible
 * - Clean white/card floating dialog with rounded-2xl corners and high-elevation shadow
 * - Standardized typography, section headers with blue accent bar, and button styling
 */

const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
  "3xl": "max-w-4xl",
  "4xl": "max-w-5xl",
  full: "max-w-[96vw]",
};

export const FormModal = forwardRef(function FormModal(
  {
    isOpen,
    onClose,
    children,
    size = "md",
    className = "",
    contentClassName = "",
    preventOutsideClose = false,
    ...props
  },
  ref,
) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) {
          onClose();
        }
      }}
      {...props}
    >
      <DialogPrimitive.Portal>
        {/* Light backdrop overlay matching the reference image */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
        />

        {/* Modal Window */}
        <DialogPrimitive.Content
          ref={ref}
          onEscapeKeyDown={(e) => {
            if (preventOutsideClose) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (preventOutsideClose) e.preventDefault();
          }}
          className={cn(
            "no-scrollbar fixed left-1/2 top-1/2 z-50 w-[95vw] -translate-x-1/2 -translate-y-1/2",
            sizeClass,
            "max-h-[92vh] flex flex-col rounded-2xl border border-slate-200/90 dark:border-border",
            "bg-white dark:bg-card text-foreground",
            "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]",
            "overflow-hidden focus:outline-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            contentClassName,
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

export const FormModalHeader = forwardRef(function FormModalHeader(
  {
    title,
    description,
    onClose,
    badge,
    icon: Icon,
    children,
    className = "",
    titleClassName = "",
    descClassName = "",
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-start justify-between border-b border-slate-100 dark:border-border/60",
        "px-6 py-5 sm:px-7 sm:py-5.5 bg-white dark:bg-card shrink-0",
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0 pr-8">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shrink-0 mt-0.5 border border-blue-100 dark:border-blue-900/30">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {title && (
              <DialogPrimitive.Title
                className={cn(
                  "text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 dark:text-foreground font-display",
                  titleClassName,
                )}
              >
                {title}
              </DialogPrimitive.Title>
            )}
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <DialogPrimitive.Description
              className={cn(
                "mt-1 text-xs sm:text-sm text-slate-500 dark:text-muted-foreground font-normal leading-relaxed",
                descClassName,
              )}
            >
              {description}
            </DialogPrimitive.Description>
          )}
          {children}
        </div>
      </div>

      <DialogPrimitive.Close
        onClick={onClose}
        className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
        aria-label="Close"
      >
        <X className="h-4.5 w-4.5" />
      </DialogPrimitive.Close>
    </div>
  );
});

export const FormModalBody = forwardRef(function FormModalBody(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "no-scrollbar flex-1 overflow-y-auto min-h-0 p-6 sm:p-7 space-y-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export const FormModalFooter = forwardRef(function FormModalFooter(
  {
    children,
    onCancel,
    cancelText = "Cancel",
    onSubmit,
    submitText = "Submit",
    isSubmitting = false,
    submitDisabled = false,
    submitVariant = "primary",
    submitIcon: SubmitIcon,
    onClear,
    clearText = "Clear",
    className = "",
    extraLeft,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 border-t border-slate-100 dark:border-border/60",
        "bg-slate-50/60 dark:bg-muted/15 px-6 py-4 sm:px-7 shrink-0",
        "flex flex-col-reverse sm:flex-row items-center justify-between gap-3",
        className,
      )}
    >
      <div className="w-full sm:w-auto flex items-center justify-start gap-2">
        {extraLeft}
      </div>

      <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            {clearText}
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            {cancelText}
          </button>
        )}

        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || submitDisabled}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 min-h-[40px]",
              submitVariant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.99]"
                : "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white active:scale-[0.99]",
            )}
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                {SubmitIcon && <SubmitIcon size={16} />}
                <span>{submitText}</span>
              </>
            )}
          </button>
        )}

        {children}
      </div>
    </div>
  );
});

/**
 * Standard Form Section Header matching the reference screenshot
 * Displays a bold vertical blue bar on the left with uppercase letter-spaced title
 */
export function FormSectionHeader({
  title,
  subtitle,
  children,
  className = "",
  hasDivider = false,
}) {
  return (
    <div
      className={cn(
        "space-y-1 text-left",
        hasDivider && "pt-5 border-t border-slate-100 dark:border-border/60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 bg-blue-600 dark:bg-blue-500 rounded-full inline-block shrink-0" />
          <h3 className="text-xs font-bold tracking-wider text-blue-950 dark:text-blue-300 uppercase">
            {title}
          </h3>
        </div>
        {children}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-muted-foreground pl-3 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * Info / Detail callout container matching the reference screenshot
 * (e.g., "SIZE RANGE 300 Sq Ft  BASELINE ₹9.3L incl. GST")
 */
export function FormCalloutBox({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/90 dark:border-border/80 bg-slate-50/80 dark:bg-muted/30 p-3 sm:p-3.5 text-xs text-slate-700 dark:text-slate-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default FormModal;
