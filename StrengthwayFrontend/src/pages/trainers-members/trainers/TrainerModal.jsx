/* eslint-disable max-lines */
import { useState, useEffect, useRef } from "react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import {
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
  dob: "",
  gender: "",
  bloodGroup: "",
  experience: "",
  phone: "",
  email: "",
  instagramProfileId: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
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
              dob: trainerToEdit.dob || "",
              gender: trainerToEdit.gender || "Male",
              bloodGroup: trainerToEdit.bloodGroup || "",
              experience: trainerToEdit.experience || "",
              phone: trainerToEdit.phone || "",
              email: trainerToEdit.email || "",
              instagramProfileId: trainerToEdit.instagramProfileId || "",
              address: trainerToEdit.address || "",
              city: trainerToEdit.city || "",
              state: trainerToEdit.state || "",
              country: trainerToEdit.country || "India",
              pincode: trainerToEdit.pincode || "",
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const currentForm = { ...form, [name]: value };
    const fieldError = validateFieldWithYup(trainerSchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }));
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
      toast.success("Coach portrait image loaded.");
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
    const validationErrors = validateWithYup(trainerSchema, form);
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please check the form for validation errors.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitPayload = {
        ...form,
        bio: form.bio?.trim() || "Certified Faculty Coach at The Strength Way.",
      };
      let savedTrainer;
      if (trainerToEdit) {
        savedTrainer = await updateTrainer(trainerToEdit.id, submitPayload);
        await syncTrainerBatches(trainerToEdit.id, submitPayload.batchIds);
        toast.success(`Coach "${form.name}" updated successfully.`);
      } else {
        savedTrainer = await createTrainer(submitPayload);
        if (savedTrainer?.id && submitPayload.batchIds.length > 0) {
          await syncTrainerBatches(savedTrainer.id, submitPayload.batchIds);
        }
        toast.success(`Coach "${form.name}" created successfully.`);
      }

      if (onSuccess) onSuccess(savedTrainer);
      handleClose();
    } catch (e) {
      toast.error(e?.message || "Failed to save coach details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={handleClose} size="xl">
      <FormModalHeader
        title={trainerToEdit ? "Edit Coach Profile" : "Add New Coach"}
        description={
          trainerToEdit
            ? "Update coach details, experience, and biography"
            : "Create a new Coach profile for the Strength Way roster"
        }
        onClose={handleClose}
      />

      <form
        id="trainer-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="space-y-6 text-xs p-6 sm:p-7 flex-1 min-h-0 overflow-y-auto">
          {/* 1. Identification & Portrait Photo */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Personal Details"
              subtitle="Profile identification, coaching status, and display picture"
            />

            {/* Photo Upload Area */}
            <TrainerPhotoUpload
              photo={form.photo}
              onPhotoFileChange={handlePhotoFileChange}
              onRemovePhoto={handleRemovePhoto}
              photoInputRef={photoInputRef}
            />

            {/* Full Name & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              />

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

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                id="trainer-dob"
                name="dob"
                type="date"
                label="Date of Birth"
                value={form.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.dob}
                size="sm"
              />

              <SelectField
                id="trainer-gender"
                name="gender"
                label="Gender"
                value={form.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.gender}
                size="sm"
                options={[
                  { value: "", label: "Select Gender" },
                  { value: "Female", label: "Female" },
                  { value: "Male", label: "Male" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>

            {/* Blood Group & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                id="trainer-blood-group"
                name="bloodGroup"
                label="Blood Group"
                value={form.bloodGroup}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.bloodGroup}
                size="sm"
                options={[
                  { value: "", label: "Select Blood Group" },
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
              />

              {trainerToEdit ? (
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
              ) : <div />}
            </div>
          </div>

          {/* 2. Contact Channels */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Contact Channels"
              subtitle="Direct phone, email, and social contact for roster scheduling"
              hasDivider
            />

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
                restriction="phone"
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
                placeholder="e.g. coach@strengthway.fit"
                error={errors.email}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                id="trainer-instagram"
                name="instagramProfileId"
                label="Instagram Profile ID"
                value={form.instagramProfileId}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. @coach_strength"
                error={errors.instagramProfileId}
                size="sm"
              />
            </div>
          </div>

          {/* 3. Residence Information */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Residence Information"
              subtitle="Residential address and geographical location details"
              hasDivider
            />

            <InputField
              id="trainer-address"
              name="address"
              label="Residential Address"
              value={form.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Flat 402, Gym Street"
              error={errors.address}
              size="sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InputField
                id="trainer-city"
                name="city"
                label="City"
                value={form.city}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Mumbai"
                error={errors.city}
                size="sm"
              />

              <InputField
                id="trainer-state"
                name="state"
                label="State"
                value={form.state}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Maharashtra"
                error={errors.state}
                size="sm"
              />

              <InputField
                id="trainer-country"
                name="country"
                label="Country"
                value={form.country}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. India"
                error={errors.country}
                size="sm"
              />

              <InputField
                id="trainer-pincode"
                name="pincode"
                label="PIN / Postal Code"
                value={form.pincode}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 400001"
                error={errors.pincode}
                restriction="pincode"
                size="sm"
              />
            </div>
          </div>

          {/* 4. Batch Slots & Shift Timings (Multi-Select) */}
          <div className="space-y-3">
            <FormSectionHeader
              title="Assigned Batches & Class Shifts"
              subtitle="Map coach availability to specific gym batches"
              hasDivider
            />
            <TrainerBatchPicker
              batchesList={batchesList}
              selectedBatchIds={form.batchIds}
              onToggleBatch={handleToggleBatch}
              onSelectAll={handleSelectAllBatches}
              onClearAll={handleClearAllBatches}
            />
          </div>

          {/* 5. Coaching Philosophy & Biography */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Coaching Philosophy & Biography"
              subtitle="Specialization notes and milestone achievements"
              hasDivider
            />

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
        </FormModalBody>

        <FormModalFooter
          onCancel={handleClose}
          cancelText="Cancel"
          onSubmit={handleSubmit}
          submitText={
            isSubmitting
              ? "Saving..."
              : trainerToEdit
                ? "Update Coach Profile"
                : "Create Coach"
          }
          submitIcon={CheckCircle2}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default TrainerModal;
