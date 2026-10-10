/* eslint-disable max-lines */
import { useState, useEffect, useId } from "react";
import {
  Image as ImageIcon,
  Camera,
  Film,
  Layers,
  MessageSquare,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  Star,
  Play,
  Eye,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
} from "@/components/ui/FormModal";
import { InputField, SelectField, TextareaField } from "@/components/form";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_STATUSES,
  ASPECT_RATIOS,
  uploadPortfolioMedia,
} from "@/lib/portfolioService";

const CATEGORY_CONFIGS = [
  {
    id: PORTFOLIO_CATEGORIES.PHOTO,
    label: "Floor Photo",
    icon: Camera,
    defaultRatio: "4:5",
    defaultType: "IMAGE",
    desc: "Gym floor action shots and training equipment stills",
  },
  {
    id: PORTFOLIO_CATEGORIES.MOVEMENT_VIDEO,
    label: "Movement Video",
    icon: Film,
    defaultRatio: "16:9",
    defaultType: "VIDEO",
    desc: "Horizontal 16:9 calisthenics technique & movement tutorials",
  },
  {
    id: PORTFOLIO_CATEGORIES.SESSION_CLIP,
    label: "Session Clip",
    icon: Film,
    defaultRatio: "9:16",
    defaultType: "VIDEO",
    desc: "Vertical 9:16 reels from morning and evening training sessions",
  },
  {
    id: PORTFOLIO_CATEGORIES.SESSION_DISCIPLINE,
    label: "Discipline Card",
    icon: Layers,
    defaultRatio: "1:1",
    defaultType: "IMAGE",
    desc: "Training discipline feature cards (Animal Flow, Rings, Calisthenics)",
  },
  {
    id: PORTFOLIO_CATEGORIES.FEEDBACK_STORY,
    label: "Member Story",
    icon: MessageSquare,
    defaultRatio: "9:16",
    defaultType: "IMAGE",
    desc: "Member transformation quote cards & video testimonials",
  },
];

const PRESET_ASSETS = [
  { label: "Photo 1 (Pull-ups)", url: "/assets/portfolio-photo-1.jpg", type: "IMAGE", category: "PHOTO" },
  { label: "Photo 2 (Bar work)", url: "/assets/portfolio-photo-2.jpg", type: "IMAGE", category: "PHOTO" },
  { label: "Photo 3 (Inverted ring)", url: "/assets/portfolio-photo-3.jpg", type: "IMAGE", category: "PHOTO" },
  { label: "Photo 4 (Ring dip)", url: "/assets/portfolio-photo-4.jpg", type: "IMAGE", category: "PHOTO" },
  { label: "Video 1 (Muscle-up)", url: "/assets/portfolio-video-1.mp4", type: "VIDEO", category: "MOVEMENT_VIDEO" },
  { label: "Video 2 (Pike Pushup)", url: "/assets/portfolio-video-2.mp4", type: "VIDEO", category: "MOVEMENT_VIDEO" },
  { label: "Clip (Consistency)", url: "/assets/fewer-excuses-more-consistency.mp4", type: "VIDEO", category: "SESSION_CLIP" },
  { label: "Clip (Quiet work)", url: "/assets/quiet-work-loud-results.mp4", type: "VIDEO", category: "SESSION_CLIP" },
];

const EMPTY_FORM = {
  category: PORTFOLIO_CATEGORIES.PHOTO,
  title: "",
  description: "",
  mediaUrl: "",
  thumbnailUrl: "",
  aspectRatio: "4:5",
  mediaType: "IMAGE",
  altText: "",
  featuredOnHome: false,
  authorName: "",
  authorRole: "",
  quote: "",
  rating: 5,
  durationText: "",
  level: "All levels",
  iconKey: "PersonStanding",
  displayOrder: 1,
  status: PORTFOLIO_STATUSES.ACTIVE,
};

export function PortfolioModal({
  isOpen,
  onClose,
  editingItem,
  onSave,
  isSubmitting,
  currentMaxOrder = 0,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaSourceTab, setMediaSourceTab] = useState("url"); // "url" | "upload" | "presets"
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sync form when editingItem changes or modal opens
  useEffect(() => {
    if (editingItem) {
      setForm({
        category: editingItem.category || PORTFOLIO_CATEGORIES.PHOTO,
        title: editingItem.title || "",
        description: editingItem.description || "",
        mediaUrl: editingItem.mediaUrl || "",
        thumbnailUrl: editingItem.thumbnailUrl || "",
        aspectRatio: editingItem.aspectRatio || "4:5",
        mediaType: editingItem.mediaType || "IMAGE",
        altText: editingItem.altText || "",
        featuredOnHome: Boolean(editingItem.featuredOnHome),
        authorName: editingItem.authorName || "",
        authorRole: editingItem.authorRole || "",
        quote: editingItem.quote || "",
        rating: editingItem.rating !== undefined ? Number(editingItem.rating) : 5,
        durationText: editingItem.durationText || "",
        level: editingItem.level || "All levels",
        iconKey: editingItem.iconKey || "PersonStanding",
        displayOrder: editingItem.displayOrder ?? 1,
        status: editingItem.status || PORTFOLIO_STATUSES.ACTIVE,
      });
      setMediaSourceTab("url");
      setSelectedFile(null);
      setFilePreviewUrl("");
    } else {
      setForm({
        ...EMPTY_FORM,
        displayOrder: currentMaxOrder + 1,
      });
      setMediaSourceTab("url");
      setSelectedFile(null);
      setFilePreviewUrl("");
    }
    setFormErrors({});
  }, [editingItem, isOpen, currentMaxOrder]);

  // Handle Category Change
  const handleSelectCategory = (catId) => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === catId);
    setForm((prev) => ({
      ...prev,
      category: catId,
      aspectRatio: config ? config.defaultRatio : prev.aspectRatio,
      mediaType: config ? config.defaultType : prev.mediaType,
    }));
  };

  // Handle Local File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setFilePreviewUrl(localUrl);

    // Auto-detect media type
    const isVideo = file.type.startsWith("video/");
    setForm((prev) => ({
      ...prev,
      mediaType: isVideo ? "VIDEO" : "IMAGE",
      mediaUrl: localUrl,
    }));
  };

  // Upload file explicitly via Cloudinary endpoint
  const handleUploadFileToCloud = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload first.");
      return;
    }

    setIsUploadingMedia(true);
    try {
      const res = await uploadPortfolioMedia(selectedFile);
      if (res?.url) {
        setForm((prev) => ({
          ...prev,
          mediaUrl: res.url,
          mediaType: res.resourceType === "video" ? "VIDEO" : "IMAGE",
        }));
        toast.success("Media successfully uploaded to Cloudinary!");
      }
    } catch (err) {
      toast.error(
        err.message || "Cloudinary upload failed. You can still use the direct URL."
      );
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Form Validation & Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!form.title.trim()) {
      errors.title = "Title is required.";
    }

    let finalMediaUrl = form.mediaUrl.trim();

    // If file is selected but not yet uploaded to server (still blob URL)
    if (selectedFile && finalMediaUrl.startsWith("blob:")) {
      setIsUploadingMedia(true);
      try {
        const uploadRes = await uploadPortfolioMedia(selectedFile);
        if (uploadRes?.url) {
          finalMediaUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn("Cloudinary upload fallback:", uploadErr);
        // If Cloudinary credentials are not set on server in dev, fallback to file name path
        finalMediaUrl = `/assets/${selectedFile.name}`;
        toast.info(
          "Cloudinary credentials unavailable in environment; assigned local asset path."
        );
      } finally {
        setIsUploadingMedia(false);
      }
    }

    if (!finalMediaUrl) {
      errors.mediaUrl = "Media URL or uploaded file is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      mediaUrl: finalMediaUrl,
      description: form.description.trim(),
      altText: form.altText.trim() || form.title.trim(),
      displayOrder: Number(form.displayOrder) || 1,
      rating: Number(form.rating) || 5,
    };

    await onSave(payload);
  };

  const isVideo =
    form.mediaType === "VIDEO" ||
    (form.mediaUrl && form.mediaUrl.match(/\.(mp4|webm|mov)$/i));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="4xl">
      <FormModalHeader
        title={editingItem ? `Edit Media: ${editingItem.title}` : "Add Portfolio Media"}
        description="Configure media asset, aspect ratio, categories, and public page formatting."
        icon={editingItem ? Film : ImageIcon}
        onClose={onClose}
      />

      <form
        id="portfolio-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <FormModalBody className="p-5 sm:p-7 flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* ── LEFT COLUMN: FORM CONTROLS (8 COLS) ───────────────────────── */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION 1: Category Selection */}
              <div className="space-y-3">
                <FormSectionHeader
                  title="Category & Placement"
                  subtitle="Select the portfolio section this media item belongs to"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_CONFIGS.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-bold shadow-2xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CatIcon size={14} className={isSelected ? "text-primary" : ""} />
                          <span className="text-xs font-semibold">{cat.label}</span>
                        </div>
                        <span className="text-[10px] mt-1 text-muted-foreground font-normal line-clamp-1">
                          {cat.defaultRatio} format
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Media Source */}
              <div className="space-y-3">
                <FormSectionHeader
                  title="Media Source"
                  subtitle="Upload an image/video file, enter a direct URL, or pick from presets"
                  hasDivider
                />

                {/* Media Source Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border">
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab("url")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      mediaSourceTab === "url"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Direct Media URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab("upload")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      mediaSourceTab === "upload"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab("presets")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      mediaSourceTab === "presets"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Gym Presets
                  </button>
                </div>

                {/* TAB 1: Direct URL */}
                {mediaSourceTab === "url" && (
                  <div className="space-y-2">
                    <InputField
                      id="media-url"
                      name="mediaUrl"
                      label="Media URL or Path"
                      required
                      placeholder="e.g. /assets/portfolio-photo-1.jpg or https://cdn..."
                      value={form.mediaUrl}
                      onChange={(e) =>
                        setForm({ ...form, mediaUrl: e.target.value })
                      }
                      error={formErrors.mediaUrl}
                      size="sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Direct paths to hosted images (.jpg, .png, .webp) or video clips (.mp4, .webm).
                    </p>
                  </div>
                )}

                {/* TAB 2: Upload File */}
                {mediaSourceTab === "upload" && (
                  <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors text-center relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload size={24} className="text-primary mb-2" />
                      <p className="text-xs font-bold text-foreground">
                        {selectedFile ? selectedFile.name : "Click to select or drag & drop media"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Supports JPEG, PNG, WEBP images and MP4, WEBM video clips (up to 50MB)
                      </p>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 truncate">
                          <Check size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-xs font-semibold truncate text-foreground">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleUploadFileToCloud}
                          disabled={isUploadingMedia}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isUploadingMedia ? "Uploading..." : "Upload to Cloud"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Preset Assets */}
                {mediaSourceTab === "presets" && (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1">
                    {PRESET_ASSETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            mediaUrl: preset.url,
                            mediaType: preset.type,
                          }));
                          toast.success(`Selected ${preset.label}`);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                          form.mediaUrl === preset.url
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{preset.label}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-muted uppercase">
                          {preset.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: Metadata & Display Settings */}
              <div className="space-y-3">
                <FormSectionHeader
                  title="Asset Identity & Ordering"
                  subtitle="Headline title, caption, aspect ratio, and status"
                  hasDivider
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    id="portfolio-title"
                    name="title"
                    label="Title / Headline"
                    required
                    placeholder="e.g. Ring dip conditioning"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    error={formErrors.title}
                    size="sm"
                    className="sm:col-span-2"
                  />

                  <SelectField
                    id="portfolio-aspect-ratio"
                    name="aspectRatio"
                    label="Aspect Ratio"
                    value={form.aspectRatio}
                    onChange={(e) =>
                      setForm({ ...form, aspectRatio: e.target.value })
                    }
                    size="sm"
                    options={ASPECT_RATIOS.map((r) => ({
                      value: r,
                      label: `${r} Format`,
                    }))}
                  />

                  <InputField
                    id="portfolio-order"
                    name="displayOrder"
                    type="number"
                    min="1"
                    label="Display Order #"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: e.target.value })
                    }
                    size="sm"
                  />

                  <SelectField
                    id="portfolio-status"
                    name="status"
                    label="Visibility Status"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    size="sm"
                    options={[
                      { value: "Active", label: "Active (Published)" },
                      { value: "Draft", label: "Draft (Hidden)" },
                    ]}
                  />

                  <SelectField
                    id="portfolio-media-type"
                    name="mediaType"
                    label="Media Format Type"
                    value={form.mediaType}
                    onChange={(e) =>
                      setForm({ ...form, mediaType: e.target.value })
                    }
                    size="sm"
                    options={[
                      { value: "IMAGE", label: "Image (Photo / Card)" },
                      { value: "VIDEO", label: "Video (Reel / Clip)" },
                    ]}
                  />
                </div>

                <TextareaField
                  id="portfolio-description"
                  name="description"
                  label="Caption / Description (Optional)"
                  rows={2}
                  placeholder="e.g. High threshold gymnastic ring dip conditioning..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* SECTION 4: Category-Specific Dynamic Fields */}
              <div className="space-y-3">
                <FormSectionHeader
                  title="Category Specific Options"
                  subtitle={`Dynamic fields for ${form.category.replace(/_/g, " ")}`}
                  hasDivider
                />

                {/* If PHOTO: Alt text and Homepage Featured toggle */}
                {form.category === PORTFOLIO_CATEGORIES.PHOTO && (
                  <div className="space-y-3">
                    <InputField
                      id="portfolio-alt-text"
                      name="altText"
                      label="Alt Text (SEO & Accessibility)"
                      placeholder="e.g. Athlete performing bar muscle-up"
                      value={form.altText}
                      onChange={(e) =>
                        setForm({ ...form, altText: e.target.value })
                      }
                      size="sm"
                    />

                    {/* Featured on Homepage Toggle */}
                    <div
                      className={`rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                        form.featuredOnHome
                          ? "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            form.featuredOnHome
                              ? "bg-amber-500 text-black shadow-xs"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Sparkles
                            size={16}
                            className={form.featuredOnHome ? "fill-black" : ""}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            Featured in Homepage Preview
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Displays this photo inside the landing page home carousel
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            featuredOnHome: !prev.featuredOnHome,
                          }))
                        }
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          form.featuredOnHome ? "bg-amber-500" : "bg-muted-foreground/30"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            form.featuredOnHome ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* If MOVEMENT VIDEO: Duration text and Poster */}
                {form.category === PORTFOLIO_CATEGORIES.MOVEMENT_VIDEO && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      id="video-duration"
                      name="durationText"
                      label="Video Duration Text"
                      placeholder="e.g. 1:20 or 45s"
                      value={form.durationText}
                      onChange={(e) =>
                        setForm({ ...form, durationText: e.target.value })
                      }
                      size="sm"
                    />
                    <InputField
                      id="video-thumbnail"
                      name="thumbnailUrl"
                      label="Poster / Thumbnail URL (Optional)"
                      placeholder="e.g. /assets/preview.jpg"
                      value={form.thumbnailUrl}
                      onChange={(e) =>
                        setForm({ ...form, thumbnailUrl: e.target.value })
                      }
                      size="sm"
                    />
                  </div>
                )}

                {/* If SESSION CLIP: Duration and Level */}
                {form.category === PORTFOLIO_CATEGORIES.SESSION_CLIP && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      id="session-duration"
                      name="durationText"
                      label="Reel Duration Text"
                      placeholder="e.g. 0:30 or 45s"
                      value={form.durationText}
                      onChange={(e) =>
                        setForm({ ...form, durationText: e.target.value })
                      }
                      size="sm"
                    />
                    <SelectField
                      id="session-level"
                      name="level"
                      label="Target Skill Level"
                      value={form.level}
                      onChange={(e) =>
                        setForm({ ...form, level: e.target.value })
                      }
                      size="sm"
                      options={[
                        { value: "All levels", label: "All levels" },
                        { value: "Beginner", label: "Beginner" },
                        { value: "Intermediate", label: "Intermediate" },
                        { value: "Advanced", label: "Advanced" },
                      ]}
                    />
                  </div>
                )}

                {/* If SESSION DISCIPLINE: Duration, Level, and Icon */}
                {form.category === PORTFOLIO_CATEGORIES.SESSION_DISCIPLINE && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InputField
                      id="discipline-duration"
                      name="durationText"
                      label="Class Duration"
                      placeholder="e.g. 45 min"
                      value={form.durationText}
                      onChange={(e) =>
                        setForm({ ...form, durationText: e.target.value })
                      }
                      size="sm"
                    />
                    <InputField
                      id="discipline-level"
                      name="level"
                      label="Level Required"
                      placeholder="e.g. All levels"
                      value={form.level}
                      onChange={(e) =>
                        setForm({ ...form, level: e.target.value })
                      }
                      size="sm"
                    />
                    <SelectField
                      id="discipline-icon"
                      name="iconKey"
                      label="Discipline Icon"
                      value={form.iconKey}
                      onChange={(e) =>
                        setForm({ ...form, iconKey: e.target.value })
                      }
                      size="sm"
                      options={[
                        { value: "PersonStanding", label: "Calisthenics (Figure)" },
                        { value: "PawPrint", label: "Animal Flow (Paw)" },
                        { value: "Move", label: "Mobility (Move)" },
                        { value: "Layers", label: "General Discipline" },
                      ]}
                    />
                  </div>
                )}

                {/* If FEEDBACK STORY: Member name, role, rating, and quote */}
                {form.category === PORTFOLIO_CATEGORIES.FEEDBACK_STORY && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        id="feedback-author"
                        name="authorName"
                        label="Member Name"
                        placeholder="e.g. Aarav M."
                        value={form.authorName}
                        onChange={(e) =>
                          setForm({ ...form, authorName: e.target.value })
                        }
                        size="sm"
                      />
                      <InputField
                        id="feedback-role"
                        name="authorRole"
                        label="Member Status / Role"
                        placeholder="e.g. Quarterly Member since 2025"
                        value={form.authorRole}
                        onChange={(e) =>
                          setForm({ ...form, authorRole: e.target.value })
                        }
                        size="sm"
                      />
                    </div>

                    {/* Star Rating Selector */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Star Rating (1 – 5 Stars)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setForm({ ...form, rating: star })}
                            className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Star
                              size={20}
                              className={
                                star <= form.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted-foreground/40"
                              }
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold ml-2 text-foreground">
                          {form.rating} / 5 Stars
                        </span>
                      </div>
                    </div>

                    <TextareaField
                      id="feedback-quote"
                      name="quote"
                      label="Testimonial Quote"
                      rows={2}
                      placeholder="e.g. Six months of Animal Flow and calisthenics here changed how my body moves..."
                      value={form.quote}
                      onChange={(e) =>
                        setForm({ ...form, quote: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: REAL-TIME LIVE PREVIEW (5 COLS) ─────────────── */}
            <div className="lg:col-span-5">
              <div className="sticky top-0 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Eye size={15} className="text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Live Card Preview
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                    {form.aspectRatio} • {form.category.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Live Simulated Card Preview */}
                <div className="rounded-3xl border border-border bg-card p-4 shadow-md transition-all">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted text-foreground/80 font-mono text-[10px] font-bold">
                        #{form.displayOrder || 1}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {form.category.replace(/_/g, " ")}
                      </span>
                      {form.featuredOnHome && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase text-black">
                          <Sparkles size={9} className="fill-black" />
                          <span>Home</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        form.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {form.status}
                    </span>
                  </div>

                  {/* Media Preview Box */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-900 border border-border/50">
                    {form.mediaUrl ? (
                      isVideo ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <video
                            src={form.mediaUrl}
                            poster={form.thumbnailUrl || undefined}
                            muted
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white border border-white/30">
                              <Play size={16} className="fill-white translate-x-0.5" />
                            </div>
                          </div>
                          {form.durationText && (
                            <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                              {form.durationText}
                            </span>
                          )}
                        </div>
                      ) : (
                        <img
                          src={form.mediaUrl}
                          alt={form.title || "Preview"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                        <ImageIcon size={28} className="opacity-40 mb-1" />
                        <span className="text-[11px]">Enter URL or select a file to preview</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                      {form.aspectRatio}
                    </span>
                  </div>

                  {/* Card Content Details */}
                  <div className="mt-3 space-y-1">
                    <h4 className="font-bold text-sm text-foreground truncate font-display">
                      {form.title || "Untitled Media Asset"}
                    </h4>

                    {form.authorName && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="font-semibold text-foreground">
                          {form.authorName}{" "}
                          {form.authorRole && (
                            <span className="text-muted-foreground font-normal">
                              • {form.authorRole}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: form.rating || 5 }).map((_, i) => (
                            <Star key={i} size={10} className="fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    )}

                    {form.quote ? (
                      <p className="text-xs italic text-muted-foreground line-clamp-2">
                        &ldquo;{form.quote}&rdquo;
                      </p>
                    ) : form.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {form.description}
                      </p>
                    ) : null}

                    {(form.durationText || form.level) && (
                      <div className="text-[11px] text-muted-foreground pt-1">
                        {form.durationText && <span>{form.durationText}</span>}
                        {form.level && <span> • {form.level}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Live Public Sync</p>
                  <p className="text-[11px] leading-relaxed">
                    Saving as <strong>Active</strong> immediately updates the live Landing Page & Portfolio Page for athletes. Draft items stay visible to admins only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={handleSubmit}
          submitText={
            isSubmitting || isUploadingMedia
              ? "Saving Media..."
              : editingItem
                ? "Update Media"
                : "Save Media Asset"
          }
          submitIcon={Check}
          isSubmitting={isSubmitting || isUploadingMedia}
        />
      </form>
    </FormModal>
  );
}

export default PortfolioModal;
