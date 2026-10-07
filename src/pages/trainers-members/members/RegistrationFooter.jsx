import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export function RegistrationFooter({
  step,
  setStep,
  memberToEdit,
  handleClose,
  isEditingActiveMember,
  isSubmitting,
  handleProceedToBalanceDetails,
  handleCompleteRegistration,
  isConfirmingLead,
}) {
  return (
    <div className="relative z-10 border-t border-slate-100 dark:border-border/60 bg-slate-50/60 dark:bg-muted/15 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3">
      {step === 2 && !memberToEdit ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer shadow-xs min-h-[40px]"
        >
          <ArrowLeft size={14} />
          <span>Back to Registration &amp; Payment</span>
        </button>
      ) : (
        <div />
      )}

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

        {isEditingActiveMember ? (
          <button
            type="submit"
            form="admin-member-registration-form"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        ) : step === 1 ? (
          <button
            type="button"
            onClick={handleProceedToBalanceDetails}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Next: Member Details</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompleteRegistration}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>
                  {isConfirmingLead
                    ? "Complete Registration & Confirm Member"
                    : "Complete Registration & Activate Member"}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
