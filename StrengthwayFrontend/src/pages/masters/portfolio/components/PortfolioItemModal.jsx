/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  Sparkles,
  Dumbbell,
  MessageSquareQuote,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, TextareaField } from "@/components/form";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import { uploadPortfolioMedia, uploadPhoto } from "@/lib/portfolioService";

const EMPTY_FORM = {
  section: "TRAINING_SESSION",
  title: "",
  subtitle: "",
  mediaUrl: "",
  publicId: "",
  thumbnailUrl: "",
  duration: "50 min",
  level: "All levels",
  icon: "Dumbbell",
  rating: 5,
  tag: "",
  order: 1,
  status: "Active",
};

export function PortfolioItemModal({
  isOpen,
  onClose,
  editingItem,
  defaultSection,
  onSave,
  isSubmitting,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setForm({
        section: editingItem.section || "TRAINING_SESSION",
        title: editingItem.title || editingItem.authorName || editingItem.altText || "",
        subtitle: editingItem.subtitle || editingItem.authorRole || editingItem.description || "",
        mediaUrl: editingItem.mediaUrl || "",
        publicId: editingItem.publicId || "",
        thumbnailUrl: editingItem.thumbnailUrl || "",
        duration: editingItem.duration || editingItem.durationText || "",
        level: editingItem.level || "All levels",
        icon: editingItem.icon || editingItem.iconKey || "Dumbbell",
        rating: editingItem.rating || 5,
        tag: editingItem.tag || editingItem.quote || "",
        order: editingItem.order ?? editingItem.displayOrder ?? 1,
        status: editingItem.status || "Active",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        section: defaultSection || "TRAINING_SESSION",
      });
    }
    setErrors({});
  }, [editingItem, defaultSection, isOpen]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) {
      errs.title =
        form.section === "FEEDBACK_QUOTE"
          ? "Member name is required."
          : form.section === "PHOTO"
          ? "Photo caption is required."
          : "Title is required.";
    }

    if (form.section === "PHOTO" && !form.mediaUrl.trim()) {
      errs.mediaUrl = "Please upload a photo file or enter an image URL.";
    }

    if (
      (form.section === "VIDEO" ||
        form.section === "SESSION_CLIP" ||
        form.section === "FEEDBACK_VIDEO") &&
      !form.mediaUrl.trim()
    ) {
      errs.mediaUrl = "Please upload a video file or enter a video URL.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!validate()) return;
    onSave({
      ...form,
      authorName: form.title,
      authorRole: form.subtitle,
      quote: form.tag,
      description: form.subtitle,
      durationText: form.duration,
      iconKey: form.icon,
      altText: form.title,
      mediaUrl: form.mediaUrl,
      thumbnailUrl: form.thumbnailUrl,
      publicId: form.publicId,
    });
  };

  const getModalIcon = () => {
    switch (form.section) {
      case "TRAINING_SESSION":
        return Dumbbell;
      case "SESSION_CLIP":
      case "FEEDBACK_VIDEO":
      case "VIDEO":
        return Video;
      case "FEEDBACK_QUOTE":
        return MessageSquareQuote;
      case "PHOTO":
        return ImageIcon;
      default:
        return Sparkles;
    }
  };

  const getModalTitle = () => {
    if (editingItem) return `Edit ${form.title || "Item"}`;
    switch (form.section) {
      case "PHOTO":
        return "Upload Photo";
      case "VIDEO":
      case "SESSION_CLIP":
      case "FEEDBACK_VIDEO":
        return "Upload Video";
      case "FEEDBACK_QUOTE":
        return "Add Member Review Quote";
      case "TRAINING_SESSION":
        return "Create Workout Program";
      default:
        return "Create Portfolio Item";
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        title={getModalTitle()}
        description={
          form.section === "PHOTO"
            ? "Upload photo asset and configure caption."
            : form.section === "VIDEO" ||
              form.section === "SESSION_CLIP" ||
              form.section === "FEEDBACK_VIDEO"
            ? "Upload video asset and configure details."
            : "Configure details and metadata for this portfolio item."
        }
        icon={getModalIcon()}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <FormModalBody className="space-y-6 text-xs p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto">
          {/* ── Photo Upload Option (only for Photo) ── */}
          {form.section === "PHOTO" && (
            <div className="space-y-4">
              <FormSectionHeader
                title="Upload Photo"
                subtitle="Select or drag and drop a 4:5 portrait photo file, or enter an image URL"
              />
              <MediaUploadDropzone
                label="Floor Photo (4:5 Portrait)"
                fileType="image"
                value={form.mediaUrl}
                onUploadSuccess={(res) => {
                  handleChange("mediaUrl", res.url);
                  if (res.publicId) handleChange("publicId", res.publicId);
                }}
                onClear={() => {
                  handleChange("mediaUrl", "");
                  handleChange("publicId", "");
                }}
                aspectRecommendation="Recommended: 4:5 portrait ratio (e.g., 1080×1350px). JPG, PNG, WebP up to 10MB."
                uploadFunction={uploadPhoto}
              />
              {errors.mediaUrl && (
                <p className="text-xs text-destructive font-medium -mt-2">{errors.mediaUrl}</p>
              )}
            </div>
          )}

          {/* ── Video Upload Option (only for Video items) ── */}
          {(form.section === "VIDEO" ||
            form.section === "SESSION_CLIP" ||
            form.section === "FEEDBACK_VIDEO") && (
            <div className="space-y-4">
              <FormSectionHeader
                title="Upload Video"
                subtitle={
                  form.section === "VIDEO"
                    ? "Select or drag and drop a 16:9 landscape video file, or enter a video URL"
                    : "Select or drag and drop a 9:16 vertical video reel file, or enter a video URL"
                }
              />
              <MediaUploadDropzone
                label={
                  form.section === "VIDEO"
                    ? "Showcase Video (16:9 Landscape)"
                    : "Video Reel (9:16 Vertical)"
                }
                fileType="video"
                value={form.mediaUrl}
                thumbnailUrl={form.thumbnailUrl}
                onUploadSuccess={(res) => {
                  handleChange("mediaUrl", res.url);
                  if (res.publicId) handleChange("publicId", res.publicId);
                  if (res.thumbnailUrl && !form.thumbnailUrl) {
                    handleChange("thumbnailUrl", res.thumbnailUrl);
                  }
                }}
                onClear={() => {
                  handleChange("mediaUrl", "");
                  handleChange("publicId", "");
                }}
                aspectRecommendation={
                  form.section === "VIDEO"
                    ? "Recommended: 16:9 widescreen (e.g., 1920×1080px). MP4, WebM up to 50MB."
                    : "Recommended: 9:16 vertical reel (e.g., 1080×1920px). MP4, WebM up to 50MB."
                }
                uploadFunction={uploadPortfolioMedia}
              />
              {errors.mediaUrl && (
                <p className="text-xs text-destructive font-medium -mt-2">{errors.mediaUrl}</p>
              )}

              {/* Optional Custom Poster Frame */}
              <div className="pt-2 border-t border-border/50">
                <MediaUploadDropzone
                  label="Custom Video Poster Frame (Optional)"
                  fileType="image"
                  value={form.thumbnailUrl}
                  onUploadSuccess={(res) => handleChange("thumbnailUrl", res.url)}
                  onClear={() => handleChange("thumbnailUrl", "")}
                  aspectRecommendation={
                    form.section === "VIDEO"
                      ? "Optional 16:9 poster image. JPG, PNG up to 10MB."
                      : "Optional 9:16 vertical poster image. JPG, PNG up to 10MB."
                  }
                  uploadFunction={uploadPhoto}
                />
              </div>
            </div>
          )}

          {/* ── Content Details ── */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Content Details"
              subtitle="Configure item labels, descriptions, and metadata"
            />

            <InputField
              label={
                form.section === "FEEDBACK_QUOTE"
                  ? "Member Name"
                  : form.section === "PHOTO"
                  ? "Photo Caption / Alt Text"
                  : "Title"
              }
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={
                form.section === "TRAINING_SESSION"
                  ? "e.g., Strength Training"
                  : form.section === "FEEDBACK_QUOTE"
                  ? "e.g., Aarav M."
                  : form.section === "PHOTO"
                  ? "e.g., Weighted pull-ups on the rig"
                  : "e.g., Rig conditioning"
              }
              error={errors.title}
              required
            />

            {/* Fields for Training Session Card */}
            {form.section === "TRAINING_SESSION" && (
              <TextareaField
                label="Program Description"
                value={form.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Progressive overload on barbell and rig work..."
                rows={3}
              />
            )}

            {/* Fields for Session Video Reel or Feedback Video Reel */}
            {(form.section === "SESSION_CLIP" || form.section === "FEEDBACK_VIDEO") && (
              <InputField
                label="Subtitle / Caption"
                value={form.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="e.g., Morning conditioning batch executing rig pull ladders."
              />
            )}

            {/* Fields for Member Feedback Quote */}
            {form.section === "FEEDBACK_QUOTE" && (
              <TextareaField
                label="Review Quote"
                value={form.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                placeholder="Six months of Animal Flow and calisthenics here changed how my body moves..."
                rows={3}
                required
              />
            )}

            {/* Category / Tag for Photos */}
            {form.section === "PHOTO" && (
              <InputField
                label="Category / Tag"
                value={form.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                placeholder="e.g., Rig, Calisthenics, Flow, Recovery"
              />
            )}

            {/* Video Secondary Tag */}
            {form.section === "VIDEO" && (
              <InputField
                label="Secondary Tag (Optional)"
                value={form.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                placeholder="e.g., Movement, Strength"
              />
            )}
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText={
            isSubmitting
              ? "Saving..."
              : editingItem
              ? "Update Item"
              : form.section === "PHOTO"
              ? "Upload Photo"
              : form.section === "VIDEO" ||
                form.section === "SESSION_CLIP" ||
                form.section === "FEEDBACK_VIDEO"
              ? "Upload Video"
              : "Save Item"
          }
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

export default PortfolioItemModal;
