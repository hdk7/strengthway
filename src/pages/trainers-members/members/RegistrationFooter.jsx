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
    <div className="relative z-10 border-t border-border/60 bg-card px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3 rounded-b-2xl sm:rounded-b-3xl">
      {step === 2 && !memberToEdit ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Registration &amp; Payment</span>
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        <DialogPrimitive.Close asChild>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border bg-card px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </DialogPrimitive.Close>

        {isEditingActiveMember ? (
          <button
            type="submit"
            form="admin-member-registration-form"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-background shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        ) : step === 1 ? (
          <button
            type="button"
            onClick={handleProceedToBalanceDetails}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-background shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            <span>Next: Member Details</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompleteRegistration}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
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
