/* eslint-disable max-lines */
import { useState, useMemo, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Quote,
  Clock,
  Sparkles,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { createInquiry } from "@/lib/inquiriesService";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export function LogInquiryModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    gender: "Male",
    mobile: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a preview ID and timestamp for the profile pass header
  const [previewId, setPreviewId] = useState("");
  const [nowDate, setNowDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        gender: "Male",
        mobile: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
      setPreviewId(`INQ-${Date.now().toString().slice(-6)}`);
      setNowDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
  }, [isOpen]);

  const initials = useMemo(() => {
    const raw = String(form.name || "").trim();
    if (!raw) return "U";
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0] || "")
        .join("")
        .toUpperCase() || "U"
    );
  }, [form.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGenderSelect = (g) => {
    setForm((prev) => ({ ...prev, gender: g }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full Name is required";
    if (!form.mobile.trim()) newErrors.mobile = "Mobile Number is required";
    if (!form.email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    if (!form.subject.trim()) newErrors.subject = "Subject is required";
    if (!form.message.trim()) newErrors.message = "Message is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = createInquiry(form);
      toast.success("Inquiry logged successfully!");
      onSuccess?.(created);
      onClose();
    } catch {
      toast.error("Failed to create inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" />
        <DialogPrimitive.Content
          aria-describedby="inquiry-form-desc"
          className="no-scrollbar fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[92vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border/70 bg-card px-6 py-4 sm:px-8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                <Sparkles size={12} className="text-primary" />
                Inquiry Profile Form
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                {previewId || "NEW"}
              </span>
            </div>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-full border border-border/80 bg-background/80 p-2 text-muted-foreground hover:bg-accent/15 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </DialogPrimitive.Close>
          </div>

          <p id="inquiry-form-desc" className="sr-only">
            Log a new inquiry formatted like a profile page with live preview.
          </p>

          {/* Form & Profile Body */}
          <form
            id="inquiry-profile-form"
            onSubmit={handleSubmit}
            className="no-scrollbar overflow-y-auto p-6 sm:p-8 space-y-6 flex-1"
          >
            {/* Live Hero Profile Pass Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-accent/20 via-card to-background p-6 sm:p-7 shadow-sm">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="pointer-events-none absolute left-1/3 -bottom-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-5 min-w-0">
                  {/* Monogram Avatar with Live Ring */}
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-xl">
                      <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-2xl sm:text-3xl font-black tracking-wider uppercase">
                        {initials}
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-border">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>

                  {/* Name & Badges */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        {previewId}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        <User size={12} className="text-muted-foreground" />
                        <span>{form.gender}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        <Clock size={12} className="text-primary" />
                        <span>{nowDate}</span>
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground truncate">
                      {form.name.trim() || "Prospective Athlete"}
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground italic truncate">
                      &ldquo;{form.subject.trim() || "General Inquiry"}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Dossier Form Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Personal Information & Contact Dossier Form */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3.5">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span>Personal Details & Contact</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    {/* 1. Full Name */}
                    <div>
                      <label htmlFor="inq-form-name" className="block font-semibold text-foreground mb-1.5">
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="inq-form-name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Marcus Thorne"
                        className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                          errors.name
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "border-border focus:border-accent focus:ring-accent"
                        }`}
                      />
                      {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    {/* 2. Gender Selection */}
                    <div>
                      <label className="block font-semibold text-foreground mb-1.5">
                        Gender <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {GENDER_OPTIONS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleGenderSelect(g)}
                            className={`rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer ${
                              form.gender === g
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "border-border bg-background hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Mobile Number */}
                    <div>
                      <label htmlFor="inq-form-mobile" className="block font-semibold text-foreground mb-1.5">
                        Mobile Number <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="inq-form-mobile"
                          name="mobile"
                          type="tel"
                          value={form.mobile}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className={`w-full rounded-xl border bg-background pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                            errors.mobile
                              ? "border-destructive focus:border-destructive focus:ring-destructive"
                              : "border-border focus:border-accent focus:ring-accent"
                          }`}
                        />
                      </div>
                      {errors.mobile && <p className="mt-1 text-[11px] text-destructive">{errors.mobile}</p>}
                    </div>

                    {/* 4. Email Address */}
                    <div>
                      <label htmlFor="inq-form-email" className="block font-semibold text-foreground mb-1.5">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="inq-form-email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="client@strengthway.fit"
                          className={`w-full rounded-xl border bg-background pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                            errors.email
                              ? "border-destructive focus:border-destructive focus:ring-destructive"
                              : "border-border focus:border-accent focus:ring-accent"
                          }`}
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-[11px] text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Inquiry Statement & Message */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3.5">
                    <Quote size={18} className="text-primary" />
                    <span>Inquiry Statement</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    {/* 5. Subject */}
                    <div>
                      <label htmlFor="inq-form-subject" className="block font-semibold text-foreground mb-1.5">
                        Subject <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="inq-form-subject"
                          name="subject"
                          type="text"
                          value={form.subject}
                          onChange={handleChange}
                          placeholder="e.g. Personal Training Consultation"
                          className={`w-full rounded-xl border bg-background pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                            errors.subject
                              ? "border-destructive focus:border-destructive focus:ring-destructive"
                              : "border-border focus:border-accent focus:ring-accent"
                          }`}
                        />
                      </div>
                      {errors.subject && <p className="mt-1 text-[11px] text-destructive">{errors.subject}</p>}
                    </div>

                    {/* 6. Message */}
                    <div>
                      <label htmlFor="inq-form-message" className="block font-semibold text-foreground mb-1.5">
                        Message / Requirement <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="inq-form-message"
                        name="message"
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Inquiry notes, athletic background, or specific training requests…"
                        className={`w-full rounded-xl border bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 resize-none ${
                          errors.message
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "border-border focus:border-accent focus:ring-accent"
                        }`}
                      />
                      {errors.message && <p className="mt-1 text-[11px] text-destructive">{errors.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Modal Footer */}
          <div className="border-t border-border/70 bg-card px-6 py-4 sm:px-8 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inquiry-profile-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? "Saving…" : "Save Inquiry"}</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default LogInquiryModal;
