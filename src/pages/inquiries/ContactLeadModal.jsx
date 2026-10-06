/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  X,
  PhoneCall,
  MessageSquare,
  Users,
  Mail,
  Smartphone,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const CONTACT_METHODS = [
  { id: "Phone Call", label: "Phone Call", icon: PhoneCall },
  { id: "WhatsApp", label: "WhatsApp", icon: MessageSquare },
  { id: "In-Person", label: "In-Person Visit", icon: Users },
  { id: "Email", label: "Email", icon: Mail },
  { id: "SMS", label: "SMS", icon: Smartphone },
];

const OUTCOMES = [
  "Interested - Converting Soon",
  "Needs Follow-Up",
  "Considering",
  "Not Interested",
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
  const [outcome, setOutcome] = useState("Interested - Converting Soon");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setContactMethod("Phone Call");
      setContactNotes("");
      setContactedBy("Admin");
      setOutcome("Interested - Converting Soon");
      setFollowUpDate("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNotes = contactNotes.trim();
    if (!trimmedNotes || trimmedNotes.length < 5) {
      setError("Please enter detailed contact notes (minimum 5 characters).");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        contactMethod,
        contactNotes: trimmedNotes,
        contactedBy: contactedBy.trim() || "Admin",
        contactedAt: new Date().toISOString(),
        outcome,
        followUpDate: followUpDate || "",
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to record contact details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="no-scrollbar relative w-full max-w-lg rounded-3xl border border-border/80 bg-card text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 font-bold border border-blue-500/20">
              <PhoneCall size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-display">
                Record Contact Interaction
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Update status from Inquiry to <span className="font-semibold text-blue-400">Contacted</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/80 bg-background/80 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Prospect Info Pill */}
        {leadName && (
          <div className="bg-muted/30 border-b border-border/60 px-6 py-2.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground truncate max-w-50">
              Prospect: <strong className="text-primary">{leadName}</strong>
            </span>
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              {leadPhone && <span>{leadPhone}</span>}
              {leadEmail && <span className="hidden sm:inline">{leadEmail}</span>}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contact Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Communication Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONTACT_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = contactMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setContactMethod(m.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/15 text-blue-400 font-semibold shadow-xs"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? "text-blue-400" : "text-muted-foreground"} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Text Field for Interaction Details / Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="contactNotesField"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
              >
                <FileText size={13} className="text-blue-400" />
                <span>Contact Details & Interaction Notes *</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {contactNotes.trim().length} chars (min 5)
              </span>
            </div>
            <textarea
              id="contactNotesField"
              rows={4}
              required
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              placeholder="Enter comprehensive details of the discussion (e.g., Prospect interested in annual strength training pass, discussed morning batch availability, budget, gym tour scheduled)..."
              className="w-full rounded-2xl border border-border/80 bg-background/50 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all resize-none font-sans"
            />
          </div>

          {/* Outcome & Staff Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Interaction Outcome *
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User size={12} />
                <span>Contacted By (Staff)</span>
              </label>
              <input
                type="text"
                value={contactedBy}
                onChange={(e) => setContactedBy(e.target.value)}
                placeholder="Admin"
                className="w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Follow-up Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} />
              <span>Next Follow-up Date (Optional)</span>
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle size={14} />
              <span>{isSubmitting ? "Saving..." : "Save & Update to Contacted"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
