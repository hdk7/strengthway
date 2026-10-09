import { useRef, useId } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { FormLabel, FormError } from "./FormField";

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
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border bg-slate-50/90 dark:bg-muted/40 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-border/80 ${
          error
            ? "border-destructive bg-destructive/5 text-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : "border-slate-200 dark:border-border"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail / Icon */}
          <div className="h-11 w-11 rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card overflow-hidden flex items-center justify-center shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover object-top"
              />
            ) : isImage ? (
              <ImageIcon size={20} className="text-slate-400 dark:text-muted-foreground/60" />
            ) : (
              <FileText size={20} className="text-slate-400 dark:text-muted-foreground/60" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0">
            {hasFile ? (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-foreground truncate max-w-50 sm:max-w-xs">
                  {fileName || "File selected"}
                </p>
                {fileSize && (
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">{fileSize}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-foreground">
                  {buttonText}
                </p>
                {helperText && (
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate max-w-50 sm:max-w-xs">
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              title="Remove file"
            >
              <X size={16} />
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-muted transition-colors">
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
