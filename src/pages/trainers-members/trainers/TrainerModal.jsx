/* eslint-disable max-lines */
import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  CheckCircle2,
  User,
  Phone,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { trainerSchema, validateWithYup, validateFieldWithYup } from "@/lib/validation";
import { InputField, SelectField, TextareaField } from "@/components/form";
import { getBatches, getTrainerBatchIds, syncTrainerBatches } from "@/lib/batchesService";
import { createTrainer, updateTrainer } from "@/lib/trainersService";
import TrainerPhotoUpload from "./TrainerPhotoUpload";
import TrainerBatchPicker from "./TrainerBatchPicker";

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
  batchIds: [],
};

export function TrainerModal({ isOpen, onClose, onSuccess, trainerToEdit = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchesList, setBatchesList] = useState([]);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        getBatches(),
        trainerToEdit ? getTrainerBatchIds(trainerToEdit.id) : Promise.resolve([]),
      ])
        .then(([available, assignedFromBatches]) => {
          setBatchesList(Array.isArray(available) ? available : []);
          if (trainerToEdit) {
            const initialBatchIds = Array.from(
              new Set([
                ...(trainerToEdit.batchIds || []),
                ...(Array.isArray(assignedFromBatches) ? assignedFromBatches : []),
              ])
            );

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
              batchIds: initialBatchIds,
            });
          } else {
            setForm(INITIAL_FORM);
          }
          setErrors({});
        })
        .catch(() => {
          setBatchesList([]);
        });
    }
  }, [isOpen, trainerToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    const fieldError = await validateFieldWithYup(trainerSchema, name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size should not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setForm((prev) => ({ ...prev, photo: dataUrl }));
      toast.success("Trainer portrait image loaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: "" }));
    if (photoInputRef.current) photoInputRef.current.value = "";
    toast.info("Photo removed.");
  };

  const handleToggleBatch = (batchId) => {
    setForm((prev) => {
      const current = Array.isArray(prev.batchIds) ? prev.batchIds : [];
      const updated = current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId];
      return { ...prev, batchIds: updated };
    });
  };

  const handleSelectAllBatches = () => {
    setForm((prev) => ({
      ...prev,
      batchIds: batchesList.map((b) => b.id),
    }));
  };

  const handleClearAllBatches = () => {
    setForm((prev) => ({ ...prev, batchIds: [] }));
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = await validateWithYup(trainerSchema, form);
    if (validationErrors) {
      setErrors(validationErrors);
      toast.error("Please check the form for validation errors.");
      return;
    }

    setIsSubmitting(true);
    try {
      let savedTrainer;
      if (trainerToEdit) {
        savedTrainer = await updateTrainer(trainerToEdit.id, form);
        await syncTrainerBatches(trainerToEdit.id, form.batchIds);
        toast.success(`Trainer "${form.name}" updated successfully.`);
      } else {
        savedTrainer = await createTrainer(form);
        if (savedTrainer?.id && form.batchIds.length > 0) {
          await syncTrainerBatches(savedTrainer.id, form.batchIds);
        }
        toast.success(`Trainer "${form.name}" created successfully.`);
      }

      if (onSuccess) onSuccess(savedTrainer);
      handleClose();
    } catch (e) {
      toast.error(e?.message || "Failed to save trainer details.");
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
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
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
              className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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

              {/* Photo Upload Area */}
              <TrainerPhotoUpload
                photo={form.photo}
                onPhotoFileChange={handlePhotoFileChange}
                onRemovePhoto={handleRemovePhoto}
                photoInputRef={photoInputRef}
              />

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

            {/* 3. Batch Slots & Shift Timings (Multi-Select) */}
            <TrainerBatchPicker
              batchesList={batchesList}
              selectedBatchIds={form.batchIds}
              onToggleBatch={handleToggleBatch}
              onSelectAll={handleSelectAllBatches}
              onClearAll={handleClearAllBatches}
            />

            {/* 4. Coaching Philosophy & Biography */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Quote size={15} className="text-accent" />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Philosophy & Bio
                </h3>
              </div>

              <InputField
                id="trainer-quote"
                name="quote"
                label="Motto / Coaching Philosophy"
                value={form.quote}
                onChange={handleChange}
                placeholder="e.g. Movement is medicine. Strength is freedom."
                size="sm"
              />

              <TextareaField
                id="trainer-bio"
                name="bio"
                label="Full Professional Biography"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Describe coaching background, athletic specialization, and milestones..."
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-background shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>
                  {isSubmitting
                    ? "Saving..."
                    : trainerToEdit
                      ? "Update Trainer Profile"
                      : "Create Trainer"}
                </span>
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default TrainerModal;
