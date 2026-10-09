import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function RegistrationHeader({
  isEditingActiveMember,
  isConfirmingLead,
  activeLead,
  handleClose,
}) {
  return (
    <div className="relative border-b border-slate-100 dark:border-border/60 px-6 py-5 sm:px-8 shrink-0 text-center bg-white dark:bg-card">
      <DialogPrimitive.Title className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">
        {isConfirmingLead
          ? `Member Registration & Activation — ${activeLead?.firstName || ""} ${activeLead?.lastName || ""}`.trim()
          : isEditingActiveMember
            ? "Edit Member Profile"
            : "Member Registration & Plan Enrollment"}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description
        id="admin-member-registration-desc"
        className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-muted-foreground font-normal"
      >
        {isConfirmingLead
          ? "Review athlete details, select training schedule, choose plan, record payment, and complete fitness records."
          : isEditingActiveMember
            ? "Update gym member profile details, physical stats, and contact info"
            : "Complete athlete registration, training batch, plan payment, residence, and fitness details."}
      </DialogPrimitive.Description>

      <DialogPrimitive.Close
        onClick={handleClose}
        className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="h-4.5 w-4.5" />
      </DialogPrimitive.Close>
    </div>
  );
}
