import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { inquirySchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function LogInquiryModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    setForm(INITIAL_FORM);
    setErrors({});
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    const fieldError = validateFieldWithYup(inquirySchema, name, nextForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const currentForm = { ...form, [name]: value !== undefined ? value : form[name] };
    const fieldError = validateFieldWithYup(inquirySchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateWithYup(inquirySchema, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      onSuccess(form);
      toast.success("Inquiry logged successfully!");
      handleClose();
    } catch {
      toast.error("Failed to save inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby="log-inquiry-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
        >
          {/* Header */}
          <div className="relative border-b border-border/60 px-6 py-5 sm:px-8 text-center shrink-0">
            <DialogPrimitive.Title className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Log New Inquiry
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="log-inquiry-desc"
              className="mt-1 text-xs sm:text-sm text-muted-foreground"
            >
              Record a walk-in, phone, or direct prospective client inquiry
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              onClick={handleClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-full p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Form */}
          <form
            id="log-inquiry-form"
            onSubmit={handleSubmit}
            noValidate
            className="overflow-y-auto min-h-0 p-6 sm:p-8 space-y-4 flex-1 text-xs"
          >
            <div>
              <label htmlFor="inquiry-name" className="block font-medium text-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="inquiry-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Rajesh Sharma"
                className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                  errors.name
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="inquiry-email" className="block font-medium text-foreground mb-1">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                id="inquiry-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. rajesh@example.com"
                className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                  errors.email
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.email && <p className="mt-1 text-[11px] text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="inquiry-subject" className="block font-medium text-foreground mb-1">
                Subject / Topic <span className="text-destructive">*</span>
              </label>
              <input
                id="inquiry-subject"
                name="subject"
                type="text"
                required
                value={form.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Personal Training Rates"
                className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                  errors.subject
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.subject && (
                <p className="mt-1 text-[11px] text-destructive">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="inquiry-message" className="block font-medium text-foreground mb-1">
                Message / Notes <span className="text-destructive">*</span>
              </label>
              <textarea
                id="inquiry-message"
                name="message"
                rows={4}
                required
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Details about client requirements, goals, or inquiries…"
                className={`w-full rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 resize-none ${
                  errors.message
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.message && (
                <p className="mt-1 text-[11px] text-destructive">{errors.message}</p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="relative z-10 border-t border-border/60 bg-card px-6 py-4 sm:px-8 shrink-0 flex items-center justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button
              type="submit"
              form="log-inquiry-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? "Logging…" : "Log Inquiry"}</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default LogInquiryModal;
