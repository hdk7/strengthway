import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function RegistrationHeader({
  isEditingActiveMember,
  isConfirmingLead,
  activeLead,
  step,
  handleClose,
}) {
  return (
    <div className="relative border-b border-slate-100 dark:border-border/60 px-6 py-5 sm:px-8 shrink-0 text-center bg-white dark:bg-card">
      {!isEditingActiveMember && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase ${
              step === 1
                ? "bg-primary text-background shadow-xs"
                : "bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground"
            }`}
          >
            1. Registration & Payment
          </span>
          <span className="text-slate-400 dark:text-muted-foreground">•</span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase ${
              step === 2
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground"
            }`}
          >
            2. Member Details
          </span>
        </div>
      )}

      <DialogPrimitive.Title className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">
        {isConfirmingLead
          ? `Member Registration ${activeLead?.firstName || ""} ${activeLead?.lastName || ""}`.trim()
          : isEditingActiveMember
            ? "Edit Member Profile"
            : step === 1
              ? "Member Registration & Plan Payment"
              : "Member Details"}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description
        id="admin-member-registration-desc"
        className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-muted-foreground font-normal"
      >
        {isConfirmingLead
          ? step === 1
            ? "Step 1 of 2: Review personal details, select training schedule, choose plan & record payment."
            : "Step 2 of 2: Complete residence address, emergency contact, physical fitness details & medical document."
          : isEditingActiveMember
            ? "Update gym member profile details, physical stats, and contact info"
            : step === 1
              ? "Step 1 of 2: Enter personal details, select training batch, choose plan & record payment."
              : "Step 2 of 2: Complete residence address, emergency contact, physical vitals & medical document."}
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
