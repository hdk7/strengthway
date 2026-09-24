/* eslint-disable max-lines */
import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  CheckCircle2,
  User,
  Phone,
  Quote,
  Upload,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { trainerSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { InputField, SelectField, TextareaField } from "@/components/form";

const INITIAL_FORM = {
  name: "",
  gender: "Male",
  experience: "",
  phone: "",
  email: "",
  status: "Active",
  quote: "",
  photo: "",
  bio: "",
};

export function TrainerModal({ isOpen, onClose, onSuccess, trainerToEdit = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (trainerToEdit) {
        setForm({
          name: trainerToEdit.name || "",
          gender: trainerToEdit.gender || "Male",
          experience: trainerToEdit.experience || "",
          phone: trainerToEdit.phone || "",
          email: trainerToEdit.email || "",
          status: trainerToEdit.status || "Active",
          quote: trainerToEdit.quote || "",
          photo: trainerToEdit.photo || "",
          bio: trainerToEdit.bio || "",
          specialization: trainerToEdit.specialization || "",
          shift: trainerToEdit.shift || "",
          floorZone: trainerToEdit.floorZone || "",
          languages: trainerToEdit.languages || "",
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

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (result) {
        setForm((prev) => ({ ...prev, photo: result }));
        toast.success("Profile photo uploaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e) => {
    if (e) e.stopPropagation();
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setForm((prev) => ({ ...prev, photo: "" }));
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
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
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
                ? "Update trainer details, experience, and biography"
                : "Create a new Trainer profile for the Strength Way roster"}
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
            className="no-scrollbar overflow-y-auto min-h-0 p-6 sm:p-8 space-y-6 flex-1 text-xs"
          >
            {/* 1. Identification & Portrait Photo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <User size={15} className="text-accent" />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Personal Details & Portrait
                </h3>
              </div>

              {/* Photo Upload Area (File Upload, not URL text) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-3.5 sm:p-4">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <div className="h-20 w-20 rounded-2xl border-2 border-border/80 bg-background overflow-hidden flex items-center justify-center shadow-md">
                    {form.photo ? (
                      <img
                        src={form.photo}
                        alt="Trainer Preview"
                        className="h-full w-full object-cover object-top"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/60 text-[10px]">
                        <ImageIcon size={22} className="mb-1 text-muted-foreground/50" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Upload size={14} />
                      <span>{form.photo ? "Change Photo" : "Upload Photo"}</span>
                    </button>

                    {form.photo && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Upload PNG, JPG, or WebP portrait (max 5MB). Leave empty to use roster initials.
                  </p>
                </div>
              </div>

              {/* Full Name, Gender & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <InputField
                  id="trainer-name"
                  name="name"
                  label="Full Name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Dolliee Ellens"
                  error={errors.name}
                  size="sm"
                  className="sm:col-span-2"
                />

                <SelectField
                  id="trainer-gender"
                  name="gender"
                  label="Gender"
                  value={form.gender || "Male"}
                  onChange={handleChange}
                  size="sm"
                  options={[
                    { value: "Female", label: "Female" },
                    { value: "Male", label: "Male" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <SelectField
                  id="trainer-status"
                  name="status"
                  label="Faculty Status"
                  value={form.status}
                  onChange={handleChange}
                  size="sm"
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </div>

              {/* Experience */}
              <div>
                <InputField
                  id="trainer-experience"
                  name="experience"
                  label="Experience"
                  required
                  value={form.experience}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 5 Years"
                  error={errors.experience}
                  size="sm"
                />
              </div>
            </div>

            {/* 2. Contact Channels */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Phone size={15} className="text-accent" />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Contact Channels
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  id="trainer-phone"
                  name="phone"
                  type="tel"
                  label="Mobile Number"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. +91 98200 11223"
                  error={errors.phone}
                  size="sm"
                />

                <InputField
                  id="trainer-email"
                  name="email"
                  type="email"
                  label="Email Address"
                  required
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. trainer@strengthway.fit"
                  error={errors.email}
                  size="sm"
                />
              </div>
            </div>

            {/* 3. Hero Motto / Quote */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Quote size={15} className="text-accent" />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Personal Motto & Coaching Philosophy
                </h3>
              </div>

              <InputField
                id="trainer-quote"
                name="quote"
                label="Personal Motto / Quote (Featured in Hero Profile Card)"
                value={form.quote}
                onChange={handleChange}
                placeholder='e.g. "Consistency beats intensity every single day."'
                size="sm"
                helperText="A high-impact 1-line quote displayed prominently in the hero quote banner."
              />
            </div>

            {/* 4. Biography & Coaching Philosophy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <User size={15} className="text-accent" />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Biography & Athletic Background
                </h3>
              </div>

              <TextareaField
                id="trainer-bio"
                name="bio"
                label="Coaching Philosophy & Background"
                required
                rows={4}
                value={form.bio}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Certifications, athletic background, or training philosophy…"
                error={errors.bio}
                size="sm"
              />
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
