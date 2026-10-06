import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

export default function TrainerPhotoUpload({
  photo,
  onPhotoFileChange,
  onRemovePhoto,
  photoInputRef,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-3.5 sm:p-4">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={onPhotoFileChange}
        className="hidden"
      />

      <div className="relative shrink-0 mx-auto sm:mx-0">
        <div className="h-20 w-20 rounded-2xl border-2 border-border/80 bg-background overflow-hidden flex items-center justify-center shadow-md">
          {photo ? (
            <img
              src={photo}
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-background shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload size={14} />
            <span>{photo ? "Change Photo" : "Upload Photo"}</span>
          </button>

          {photo && (
            <button
              type="button"
              onClick={onRemovePhoto}
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
  );
}
