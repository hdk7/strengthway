 import { useState, useMemo, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createInquiry, getNextInquiryId } from "@/lib/inquiriesService";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
  FormCalloutBox,
} from "@/components/ui/FormModal";
import { InputField, TextareaField, SelectField } from "@/components/form";

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const INITIAL_FORM = {
  name: "",
  gender: "",
  mobile: "",
  email: "",
  subject: "",
  message: "",
};

export function LogInquiryModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const [nowDate, setNowDate] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      setIsSubmitting(false);
      setNowDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );

      // Fetch guaranteed sequential professional inquiry ID (e.g. INQ-2026-001)
      getNextInquiryId()
        .then((nextId) => {
          if (isMounted) setPreviewId(nextId);
        })
        .catch(() => {
          if (isMounted) setPreviewId(`INQ-${new Date().getFullYear()}-001`);
        });
    }
    return () => {
      isMounted = false;
    };
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

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      const created = await createInquiry({
        ...form,
        id: previewId || undefined,
      });
      toast.success(`Inquiry ${created?.id || previewId || ""} logged successfully!`);
      onSuccess?.(created);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="xl">
      <FormModalHeader
        title="Add New Inquiry"
        description="Fill in the client and inquiry details to create a new inquiry"
        onClose={onClose}
        badge={
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-md">
            {previewId || "Generating ID..."}
          </span>
        }
      />

      <form
        id="inquiry-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="flex-1 min-h-0 overflow-y-auto space-y-5 p-6 sm:p-7">
          {/* Reference ID Callout */}
          <FormCalloutBox className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-foreground">
              Inquiry Reference: <span className="font-mono text-[#1e3a8a] dark:text-blue-400 font-bold">{previewId || "Generating ID..."}</span>
            </span>
            <span className="text-slate-500 dark:text-muted-foreground text-[11px]">
              Logged Date: {nowDate}
            </span>
          </FormCalloutBox>

          {/* Section 1: Client Information */}
          <div className="space-y-3.5">
            <FormSectionHeader
              title="Client Information"
              subtitle="Contact details and identification of the prospective member"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="inq-form-name"
                name="name"
                label="Full Name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                error={errors.name}
                startIcon={<User size={14} />}
              />

              <InputField
                id="inq-form-mobile"
                name="mobile"
                label="Phone Number"
                required
                type="tel"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit number"
                error={errors.mobile}
                startIcon={<Phone size={14} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="inq-form-email"
                name="email"
                label="Email Address"
                required
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="client@strengthway.fit"
                error={errors.email}
                startIcon={<Mail size={14} />}
              />

              <SelectField
                id="inq-form-gender"
                name="gender"
                label="Gender"
                required
                value={form.gender}
                onChange={handleChange}
                options={GENDER_OPTIONS}
              />
            </div>
          </div>

          {/* Section 2: Inquiry & Training Requirements */}
          <div className="space-y-3.5">
            <FormSectionHeader
              title="Inquiry & Training Details"
              subtitle="Specialization, consultation request, and athlete background"
              hasDivider
            />

            <InputField
              id="inq-form-subject"
              name="subject"
              label="Inquiry Subject / Goal"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g. Strength Training & Nutrition Consultation"
              error={errors.subject}
              startIcon={<Tag size={14} />}
            />

            <TextareaField
              id="inq-form-message"
              name="message"
              label="Requirement Notes & Details"
              required
              rows={3}
              value={form.message}
              onChange={handleChange}
              placeholder="Record fitness goals, current routine, injuries, or preferred schedule..."
              error={errors.message}
            />
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSubmit}
          submitText={isSubmitting ? "Saving..." : "Create Inquiry"}
          submitIcon={CheckCircle2}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default LogInquiryModal;
