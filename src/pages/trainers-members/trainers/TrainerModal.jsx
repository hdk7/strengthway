/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trainerSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";

const INITIAL_FORM = {
  name: "",
  specialization: "",
  experience: "",
  phone: "",
  email: "",
  shift: "Morning (06:00 - 14:00)",
  bio: "",
};

export function TrainerModal({ isOpen, onClose, onSuccess, trainerToEdit = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (trainerToEdit) {
        setForm({
          name: trainerToEdit.name || "",
          specialization: trainerToEdit.specialization || "",
          experience: trainerToEdit.experience || "",
          phone: trainerToEdit.phone || "",
          email: trainerToEdit.email || "",
          shift: trainerToEdit.shift || "Morning (06:00 - 14:00)",
          bio: trainerToEdit.bio || "",
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
    }
  }, [isOpen, trainerToEdit]);

  const handleClose = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrors({});
    if (!trainerToEdit) {
      setForm(INITIAL_FORM);
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    const fieldError = validateFieldWithYup(trainerSchema, name, nextForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const currentForm = { ...form, [name]: value !== undefined ? value : form[name] };
    const fieldError = validateFieldWithYup(trainerSchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateWithYup(trainerSchema, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      onSuccess(form, Boolean(trainerToEdit));
      toast.success(
        trainerToEdit
          ? `Trainer ${form.name} updated successfully!`
          : `Trainer ${form.name} added successfully!`,
      );
      handleClose();
    } catch {
      toast.error("Failed to save trainer details.");
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
          aria-describedby="trainer-modal-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
        >
          {/* Header */}
          <div className="relative border-b border-border/60 px-6 py-5 sm:px-8 text-center shrink-0">
            <DialogPrimitive.Title className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {trainerToEdit ? "Edit Trainer Profile" : "Add New Trainer"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="trainer-modal-desc"
              className="mt-1 text-xs sm:text-sm text-muted-foreground"
            >
              {trainerToEdit
                ? "Update trainer credentials, shift timing, and biography"
                : "Create a new Trainer profile for gym sessions"}
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
            id="trainer-form"
            onSubmit={handleSubmit}
            noValidate
            className="overflow-y-auto min-h-0 p-6 sm:p-8 space-y-4 flex-1 text-xs"
          >
            <div>
              <label htmlFor="trainer-name" className="block font-medium text-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="trainer-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Dolliee Ellens"
                className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                  errors.name
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="trainer-specialization"
                  className="block font-medium text-foreground mb-1"
                >
                  Specialization <span className="text-destructive">*</span>
                </label>
                <input
                  id="trainer-specialization"
                  name="specialization"
                  type="text"
                  required
                  value={form.specialization}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Functional Fitness"
                  className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                    errors.specialization
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
                {errors.specialization && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.specialization}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="trainer-experience"
                  className="block font-medium text-foreground mb-1"
                >
                  Experience <span className="text-destructive">*</span>
                </label>
                <input
                  id="trainer-experience"
                  name="experience"
                  type="text"
                  required
                  value={form.experience}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 5 Years"
                  className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                    errors.experience
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
                {errors.experience && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.experience}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="trainer-phone" className="block font-medium text-foreground mb-1">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="trainer-phone"
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. +91 98200 11223"
                  className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                    errors.phone
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="trainer-email" className="block font-medium text-foreground mb-1">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  id="trainer-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. trainer@strengthway.fit"
                  className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 ${
                    errors.email
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="trainer-shift" className="block font-medium text-foreground mb-1">
                Assigned Shift <span className="text-destructive">*</span>
              </label>
              <select
                id="trainer-shift"
                name="shift"
                required
                value={form.shift}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:ring-1 cursor-pointer ${
                  errors.shift
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              >
                <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="General (08:00 - 17:00)">General (08:00 - 17:00)</option>
              </select>
              {errors.shift && <p className="mt-1 text-[11px] text-destructive">{errors.shift}</p>}
            </div>

            <div>
              <label htmlFor="trainer-bio" className="block font-medium text-foreground mb-1">
                Bio & Certifications <span className="text-destructive">*</span>
              </label>
              <textarea
                id="trainer-bio"
                name="bio"
                rows={3}
                required
                value={form.bio}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Certifications, athletic background, or training philosophy…"
                className={`w-full rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 resize-none ${
                  errors.bio
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border focus:border-accent focus:ring-accent"
                }`}
              />
              {errors.bio && <p className="mt-1 text-[11px] text-destructive">{errors.bio}</p>}
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
              form="trainer-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 size={14} />
              <span>
                {isSubmitting
                  ? trainerToEdit
                    ? "Saving…"
                    : "Adding…"
                  : trainerToEdit
                    ? "Save Changes"
                    : "Add Trainer"}
              </span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default TrainerModal;
