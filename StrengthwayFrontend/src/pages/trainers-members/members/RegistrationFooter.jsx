import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2 } from "lucide-react";

export function RegistrationFooter({
  handleClose,
  isEditingActiveMember,
  isSubmitting,
  handleCompleteRegistration,
  isConfirmingLead,
}) {
  return (
    <div className="relative z-10 border-t border-slate-100 dark:border-border/60 bg-slate-50/60 dark:bg-muted/15 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3">
      <div />

      <div className="flex items-center gap-2.5">
        <DialogPrimitive.Close asChild>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer shadow-xs min-h-[40px]"
          >
            Cancel
          </button>
        </DialogPrimitive.Close>

        <button
          type="button"
          onClick={handleCompleteRegistration}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer min-h-[40px]"
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>{isEditingActiveMember ? "Saving…" : "Processing…"}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>
                {isEditingActiveMember
                  ? "Save Changes"
                  : isConfirmingLead
                  ? "Complete Registration & Confirm Member"
                  : "Complete Registration & Activate Member"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
