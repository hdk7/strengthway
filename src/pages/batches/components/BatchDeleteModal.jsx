import { Trash2, Loader2 } from "lucide-react";

export function BatchDeleteModal({
  batchToDelete,
  onClose,
  onConfirmDelete,
  isSubmitting,
}) {
  if (!batchToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <div className="h-10 w-10 rounded-full bg-destructive/10 grid place-items-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Delete Batch</h3>
            <p className="text-xs text-muted-foreground">Permanent action</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove <strong className="text-foreground">{batchToDelete.name}</strong> from the training schedule? All associated floor class records will be removed.
        </p>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            <span>{isSubmitting ? "Deleting..." : "Delete Batch"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
