import { AlertTriangle, Archive, Trash2, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export function PortfolioConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action will update the asset status.",
  confirmText = "Confirm",
  confirmVariant = "danger", // "danger" | "warning" | "primary"
  isSubmitting = false,
  icon: Icon = AlertTriangle,
}) {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Backdrop overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        {/* Modal Window */}
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
                confirmVariant === "danger"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              }`}
            >
              <Icon size={22} />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <DialogPrimitive.Title className="text-base sm:text-lg font-bold text-foreground font-display">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                confirmVariant === "danger"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
