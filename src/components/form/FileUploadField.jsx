import { useRef, useId } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

export default function FileUploadField({
  label,
  required = false,
  error,
  hint,
  id: providedId,
  accept,
  fileName,
  fileSize,
  previewUrl,
  onUpload,
  onRemove,
  buttonText = "Choose File",
  helperText,
  isImage = false,
  disabled = false,
  className = "",
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (onUpload) {
      onUpload(e);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const hasFile = Boolean(previewUrl || fileName);

  return (
    <div className={`flex flex-col text-left ${className}`}>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint}>
          {label}
        </FormLabel>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onClick={handleTriggerUpload}
        className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border bg-card/60 transition-all cursor-pointer hover:border-accent/40 ${
          error
            ? "border-destructive focus-within:ring-1 focus-within:ring-destructive"
            : "border-border/80"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail / Icon */}
          <div className="h-12 w-12 rounded-xl border border-border/80 bg-background overflow-hidden flex items-center justify-center shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover object-top"
              />
            ) : isImage ? (
              <ImageIcon size={20} className="text-muted-foreground/60" />
            ) : (
              <FileText size={20} className="text-muted-foreground/60" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0">
            {hasFile ? (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                  {fileName || "File selected"}
                </p>
                {fileSize && (
                  <p className="text-[11px] text-muted-foreground font-mono">{fileSize}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {buttonText}
                </p>
                {helperText && (
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                    {helperText}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {hasFile ? (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              title="Remove file"
            >
              <X size={16} />
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors">
              <Upload size={13} />
              <span>Browse</span>
            </div>
          )}
        </div>
      </div>

      <FormError error={error} />
    </div>
  );
}
