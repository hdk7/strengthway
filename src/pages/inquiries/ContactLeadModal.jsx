/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  PhoneCall,
  MessageSquare,
  Users,
  Mail,
  Smartphone,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
  FormCalloutBox,
} from "@/components/ui/FormModal";
import { InputField, TextareaField, SelectField } from "@/components/form";

const CONTACT_METHODS = [
  { id: "Phone Call", label: "Phone Call", icon: PhoneCall },
  { id: "WhatsApp", label: "WhatsApp", icon: MessageSquare },
  { id: "In-Person", label: "In-Person Visit", icon: Users },
  { id: "Email", label: "Email", icon: Mail },
  { id: "SMS", label: "SMS", icon: Smartphone },
];

const OUTCOMES = [
  { value: "Interested - Converting Soon", label: "Interested - Converting Soon" },
  { value: "Needs Follow-Up", label: "Needs Follow-Up" },
  { value: "Not Interested", label: "Not Interested" },
];

export default function ContactLeadModal({
  isOpen,
  onClose,
  onSubmit,
  leadName = "",
  leadPhone = "",
  leadEmail = "",
}) {
  const [contactMethod, setContactMethod] = useState("Phone Call");
  const [contactNotes, setContactNotes] = useState("");
  const [contactedBy, setContactedBy] = useState("Admin");
  const [outcome, setOutcome] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [outcomeError, setOutcomeError] = useState("");
  const [followUpDateError, setFollowUpDateError] = useState("");

  const isFollowUpRequired = useMemo(() => {
    return outcome === "Needs Follow-Up";
  }, [outcome]);

  useEffect(() => {
    if (isOpen) {
      setContactMethod("Phone Call");
      setContactNotes("");
      setContactedBy("Admin");
      setOutcome("");
      setFollowUpDate("");
      setError("");
      setNotesError("");
      setOutcomeError("");
      setFollowUpDateError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleOutcomeChange = (e) => {
    const val = e.target.value;
    setOutcome(val);
    if (outcomeError) {
      setOutcomeError("");
    }
    if (val !== "Needs Follow-Up") {
      setFollowUpDate("");
      setFollowUpDateError("");
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    let hasError = false;
    const trimmedNotes = contactNotes.trim();
    if (!trimmedNotes || trimmedNotes.length < 5) {
      const msg = "Please enter detailed contact notes (minimum 5 characters).";
      setNotesError(msg);
      toast.error(msg);
      hasError = true;
    } else {
      setNotesError("");
    }

    if (!outcome) {
      const msg = "Please select an interaction outcome.";
      setOutcomeError(msg);
      if (!hasError) toast.error(msg);
      hasError = true;
    } else {
      setOutcomeError("");
    }

    if (outcome === "Needs Follow-Up" && !followUpDate) {
      const msg = "Please select the next follow-up date to receive a recontact reminder.";
      setFollowUpDateError(msg);
      if (!hasError) toast.error(msg);
      hasError = true;
    } else {
      setFollowUpDateError("");
    }

    if (hasError) return;

    setError("");
    setIsSubmitting(true);

    const payload = {
      contactMethod,
      method: contactMethod,
      contactNotes: trimmedNotes,
      notes: trimmedNotes,
      contactedBy: contactedBy.trim() || "Admin",
      outcome,
      followUpDate: isFollowUpRequired ? followUpDate || null : null,
      contactedAt: new Date().toISOString(),
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      console.error("Failed to record contact interaction:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to record contact interaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="xl">
      <FormModalHeader
        title="Record Contact Interaction"
        description="Update status from Inquiry to Contacted and log conversation summary"
        icon={PhoneCall}
        onClose={onClose}
      />

      <form
        id="contact-lead-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0"
      >
        <FormModalBody className="p-5 sm:p-6 space-y-3.5 overflow-hidden">
          {/* Prospect Info Callout */}
          {leadName && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200/90 dark:border-border/80 bg-slate-50/80 dark:bg-muted/30 px-3.5 py-1.5 text-xs">
              <span className="font-semibold text-slate-900 dark:text-foreground">
                Prospect: <span className="text-[#1e3a8a] dark:text-blue-400 font-bold">{leadName}</span>
              </span>
              <div className="flex items-center gap-3 text-slate-500 dark:text-muted-foreground text-[11px]">
                {leadPhone && <span>{leadPhone}</span>}
                {leadEmail && <span className="hidden sm:inline">{leadEmail}</span>}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Communication Method */}
          <div className="space-y-1.5">
            <FormSectionHeader
              title="Communication Channel"
            />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {CONTACT_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = contactMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setContactMethod(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-1.5 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#1e3a8a] bg-blue-50/90 text-[#1e3a8a] dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 font-semibold shadow-xs"
                        : "border-slate-200/90 dark:border-border bg-slate-50/80 dark:bg-muted/20 text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted/40 hover:text-slate-900 dark:hover:text-foreground"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={
                        isSelected ? "text-[#1e3a8a] dark:text-blue-400 shrink-0" : "text-slate-400 shrink-0"
                      }
                    />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Interaction Notes */}
          <div className="space-y-1.5">
            <FormSectionHeader
              title="Interaction Notes"
              hasDivider
            />
            <TextareaField
              id="contactNotesField"
              rows={2}
              required
              value={contactNotes}
              error={notesError || undefined}
              onChange={(e) => {
                setContactNotes(e.target.value);
                if (notesError && e.target.value.trim().length >= 5) {
                  setNotesError("");
                }
              }}
              placeholder="Enter discussion details (prospect goals, preferred batch, budget, tour scheduled)..."
              helperText={`${contactNotes.trim().length} characters (minimum 5 required)`}
            />
          </div>

          {/* Section 3: Outcome & Follow-up */}
          <div className="space-y-1.5">
            <FormSectionHeader
              title="Outcome & Follow-up"
              hasDivider
            />

            <div
              className={`grid gap-3 ${
                isFollowUpRequired ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              <SelectField
                id="contact-interaction-outcome"
                label="Interaction Outcome"
                required
                value={outcome}
                onChange={handleOutcomeChange}
                placeholder="Select Interaction Outcome"
                error={outcomeError || undefined}
                options={OUTCOMES}
              />

              {isFollowUpRequired && (
                <div className="animate-in fade-in duration-150">
                  <InputField
                    label="Next Follow-up Date"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={followUpDate}
                    error={followUpDateError || undefined}
                    onChange={(e) => {
                      setFollowUpDate(e.target.value);
                      if (followUpDateError) setFollowUpDateError("");
                    }}
                    startIcon={<Calendar size={14} />}
                    helperText="A system notification will alert staff on this date to recontact"
                  />
                </div>
              )}

              <InputField
                label="Contacted By (Staff)"
                value={contactedBy}
                onChange={(e) => setContactedBy(e.target.value)}
                placeholder="Admin"
                startIcon={<User size={14} />}
              />
            </div>
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSubmit}
          submitText={isSubmitting ? "Saving..." : "Save"}
          submitIcon={CheckCircle}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}
