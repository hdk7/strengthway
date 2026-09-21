/* eslint-disable react-refresh/only-export-components, max-lines */
import { useState, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  Upload,
  User,
  MapPin,
  Calendar,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function openMemberRegistrationModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-member-registration"));
  }
}

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",
  photo: null,
  photoName: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  bio: "",
};

export function MemberRegistrationModal({ isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Listen for global open events
  useEffect(() => {
    const handleOpen = () => {
      if (isControlled && controlledOnClose) {
        // Parent controls it
      } else {
        setInternalOpen(true);
      }
    };
    window.addEventListener("open-member-registration", handleOpen);
    return () => window.removeEventListener("open-member-registration", handleOpen);
  }, [isControlled, controlledOnClose]);

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        photo: reader.result,
        photoName: file.name,
      }));
      toast.success("Profile photo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: null, photoName: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) {
      errs.firstName = "First name is required.";
    }

    if (!form.mobile.trim()) {
      errs.mobile = "Mobile number is required.";
    } else {
      const cleanMobile = form.mobile.replace(/\D/g, "");
      if (cleanMobile.length < 10) {
        errs.mobile = "Enter a valid mobile number (at least 10 digits).";
      }
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newMember = {
        id: `MEM-${Date.now()}`,
        ...form,
        registeredAt: new Date().toISOString(),
      };

      const existingData = localStorage.getItem("tsw-registered-members");
      const members = existingData ? JSON.parse(existingData) : [];
      members.unshift(newMember);
      localStorage.setItem("tsw-registered-members", JSON.stringify(members));

      toast.success(
        `Welcome ${form.firstName}! Your gym registration has been submitted successfully.`,
        {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        },
      );

      setForm(INITIAL_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
      handleClose();
    } catch {
      toast.error("An error occurred while saving registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window */}
        <DialogPrimitive.Content
          aria-describedby="member-registration-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl max-h-[92vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
        >
          {/* Header */}
          <div className="relative border-b border-border/60 px-6 py-5 sm:px-8 shrink-0 text-center">
            <DialogPrimitive.Title className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Member Registration
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="member-registration-desc"
              className="mt-1 text-xs sm:text-sm text-muted-foreground"
            >
              Create a new member profile
            </DialogPrimitive.Description>

            <DialogPrimitive.Close
              onClick={handleClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-full p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Form scrollable body */}
          <form
            id="member-registration-form"
            onSubmit={handleSubmit}
            className="no-scrollbar flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-8"
          >
            {/* 1. PERSONAL INFORMATION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <User className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Personal Information
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="member-first-name"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="member-first-name"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                      errors.firstName
                        ? "border-destructive focus:border-destructive"
                        : "border-border"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="member-last-name"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Last Name
                  </label>
                  <input
                    id="member-last-name"
                    name="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="member-dob"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      id="member-dob"
                      name="dob"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.dob}
                      onChange={handleChange}
                      onClick={(e) => e.target.showPicker?.()}
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label
                    htmlFor="member-gender"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Gender
                  </label>
                  <select
                    id="member-gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Mobile Number */}
                <div>
                  <label
                    htmlFor="member-mobile"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Mobile Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="member-mobile"
                    name="mobile"
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={form.mobile}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                      errors.mobile
                        ? "border-destructive focus:border-destructive"
                        : "border-border"
                    }`}
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-xs text-destructive">{errors.mobile}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="member-email"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="member-email"
                    name="email"
                    type="email"
                    placeholder="e.g. alex@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                      errors.email ? "border-destructive focus:border-destructive" : "border-border"
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Profile Photo
                </label>
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-border p-3.5 bg-background/50">
                  {form.photo ? (
                    <div className="relative flex items-center gap-3">
                      <img
                        src={form.photo}
                        alt="Profile preview"
                        className="h-14 w-14 rounded-xl object-cover border border-border shadow-sm"
                      />
                      <div>
                        <p className="text-xs font-medium text-foreground max-w-[180px] truncate">
                          {form.photoName || "Uploaded photo"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Ready for registration</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="ml-2 inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-colors cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Photo</span>
                        </button>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          JPG, PNG, or WEBP up to 5MB
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    id="member-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </section>

            {/* 2. CONTACT INFORMATION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <MapPin className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </h3>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="member-address"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  Address
                </label>
                <textarea
                  id="member-address"
                  name="address"
                  rows={2}
                  placeholder="Street address, building, apartment, or flat number"
                  value={form.address}
                  onChange={handleChange}
                  className="no-scrollbar w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* City */}
                <div>
                  <label
                    htmlFor="member-city"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    City
                  </label>
                  <input
                    id="member-city"
                    name="city"
                    type="text"
                    placeholder="Enter city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* State */}
                <div>
                  <label
                    htmlFor="member-state"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    State
                  </label>
                  <input
                    id="member-state"
                    name="state"
                    type="text"
                    placeholder="Enter state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Country */}
                <div>
                  <label
                    htmlFor="member-country"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Country
                  </label>
                  <input
                    id="member-country"
                    name="country"
                    type="text"
                    placeholder="Enter country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label
                    htmlFor="member-pincode"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Pincode
                  </label>
                  <input
                    id="member-pincode"
                    name="pincode"
                    type="text"
                    placeholder="e.g. 400001"
                    value={form.pincode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label
                  htmlFor="member-bio"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  Bio
                </label>
                <textarea
                  id="member-bio"
                  name="bio"
                  rows={3}
                  placeholder="Tell us about yourself..."
                  value={form.bio}
                  onChange={handleChange}
                  className="no-scrollbar w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>
            </section>
          </form>

          {/* Footer Actions */}
          <div className="border-t border-border/60 bg-muted/20 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="member-registration-form"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Registering…" : "Register Member"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default MemberRegistrationModal;
