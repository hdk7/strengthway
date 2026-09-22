import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Mail, Calendar, MessageSquare, CheckCircle2, Clock, Trash2 } from "lucide-react";

export function InquiryDetailsModal({ isOpen, onClose, inquiry, onStatusChange, onDelete }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (inquiry) {
      setNotes(inquiry.notes || "");
    }
  }, [inquiry]);

  if (!inquiry) return null;

  const handleSaveNotes = () => {
    onStatusChange(inquiry.id, inquiry.status, notes);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby="inquiry-details-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
        >
          {/* Header */}
          <div className="relative border-b border-border/60 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-mono font-semibold text-accent">
                    {inquiry.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inquiry.status === "Resolved"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : inquiry.status === "In Progress"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-blue-500/15 text-blue-500"
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                  {inquiry.subject}
                </h2>
                <p id="inquiry-details-desc" className="text-xs text-muted-foreground mt-0.5">
                  From <strong className="text-foreground">{inquiry.name}</strong> •{" "}
                  {new Date(inquiry.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            <DialogPrimitive.Close
              onClick={onClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-full p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-5 flex-1 text-sm">
            {/* Sender Contact Info */}
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="font-semibold text-accent hover:underline"
                >
                  {inquiry.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span>
                  {new Date(inquiry.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <MessageSquare size={14} />
                <span>Inquiry Message</span>
              </h3>
              <div className="rounded-2xl border border-border bg-background p-4 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {inquiry.message}
              </div>
            </div>

            {/* Status & Resolution Notes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Update Status
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStatusChange(inquiry.id, "New", notes)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      inquiry.status === "New"
                        ? "bg-blue-500 text-white font-semibold"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(inquiry.id, "In Progress", notes)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      inquiry.status === "In Progress"
                        ? "bg-amber-500 text-white font-semibold"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(inquiry.id, "Resolved", notes)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      inquiry.status === "Resolved"
                        ? "bg-emerald-500 text-white font-semibold"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="inquiry-notes-field"
                  className="block text-xs font-medium text-muted-foreground mb-1.5"
                >
                  Internal Admin Follow-up Notes
                </label>
                <textarea
                  id="inquiry-notes-field"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record call logs, meeting dates, or resolution details…"
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 bg-muted/20 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onDelete(inquiry.id, inquiry.subject);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Save Updates</span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default InquiryDetailsModal;
