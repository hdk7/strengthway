import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import Button from "./Button";
import { cn } from "@/lib/utils";

const VARIANT_ICONS = {
  danger: {
    icon: AlertTriangle,
    bg: "bg-destructive/10 text-destructive",
    confirmBtnVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10 text-amber-500",
    confirmBtnVariant: "default",
  },
  info: {
    icon: Info,
    bg: "bg-sky-500/10 text-sky-500",
    confirmBtnVariant: "default",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500",
    confirmBtnVariant: "success",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  children,
}) {
  const config = VARIANT_ICONS[variant] || VARIANT_ICONS.danger;
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose?.()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="flex flex-row items-start gap-3.5 text-left space-y-0">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
              config.bg,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {title}
            </DialogTitle>
            {message && (
              <DialogDescription className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {message}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.confirmBtnVariant}
            size="sm"
            onClick={handleConfirm}
            loading={isLoading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
