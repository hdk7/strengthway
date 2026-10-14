import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Video, Link as LinkIcon, Loader2 } from "lucide-react";

export function MediaUploadDropzone({
  label = "Media Asset",
  fileType = "media", // "image" | "video" | "media"
  value = "",
  thumbnailUrl = "",
  onUploadSuccess,
  onClear,
  aspectRecommendation = "",
  disabled = false,
  uploadFunction, // async function(file) => { url, publicId, thumbnailUrl }
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [inputMode, setInputMode] = useState("file"); // "file" | "url"
  const [manualUrl, setManualUrl] = useState(value);
  const fileInputRef = useRef(null);

  const isVideo =
    fileType === "video" ||
    (value && (value.includes(".mp4") || value.includes(".webm") || value.includes("/video/")));

  const acceptMime =
    fileType === "image"
      ? "image/jpeg,image/png,image/webp,image/gif"
      : fileType === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError("");

    // Size validation
    const maxMb = file.type.startsWith("video/") ? 50 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`File too large. Maximum allowed size is ${maxMb} MB.`);
      return;
    }

    if (!uploadFunction) {
      // Local preview fallback
      const localUrl = URL.createObjectURL(file);
      onUploadSuccess?.({ url: localUrl, publicId: "", file });
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadFunction(file);
      onUploadSuccess?.(res);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleManualUrlSubmit = (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    onUploadSuccess?.({ url: manualUrl.trim(), publicId: "" });
  };

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          {fileType === "video" ? (
            <Video size={13} className="text-primary" />
          ) : (
            <ImageIcon size={13} className="text-primary" />
          )}
          {label}
        </label>

        {/* Toggle between File upload and URL */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
              inputMode === "file"
                ? "bg-primary/20 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setInputMode("url")}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
              inputMode === "url"
                ? "bg-primary/20 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      {aspectRecommendation && (
        <p className="text-[11px] text-muted-foreground">{aspectRecommendation}</p>
      )}

      {/* Preview if already has a value */}
      {value ? (
        <div className="relative rounded-2xl border border-border bg-black/60 overflow-hidden p-2 group">
          {isVideo ? (
            <video
              src={value}
              poster={thumbnailUrl}
              controls
              className="w-full max-h-56 rounded-xl object-contain bg-black mx-auto"
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-56 rounded-xl object-contain bg-black/40 mx-auto"
            />
          )}

          {!disabled && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClear?.();
                  setManualUrl("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-destructive hover:text-destructive-foreground transition-all shadow-md cursor-pointer"
                title="Remove Media"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      ) : inputMode === "file" ? (
        /* Drag & Drop File Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMime}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            disabled={disabled || isUploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-xs font-semibold text-foreground">Uploading media...</p>
              </div>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse or drag & drop file
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fileType === "video"
                      ? "MP4, WebM, MOV (Max 50 MB)"
                      : fileType === "image"
                      ? "JPEG, PNG, WebP, GIF (Max 10 MB)"
                      : "Image or Video (Max 50 MB)"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Manual URL input */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="url"
              placeholder="https://example.com/media.mp4 or photo.jpg"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleManualUrlSubmit}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-destructive font-medium mt-1">{uploadError}</p>
      )}
    </div>
  );
}

export default MediaUploadDropzone;
