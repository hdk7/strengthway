import { Trash2, AlertTriangle } from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export function DeleteConfirmationModal({
  itemToDelete,
  onClose,
  onConfirmDelete,
  isSubmitting,
}) {
  if (!itemToDelete) return null;

  return (
    <FormModal isOpen={Boolean(itemToDelete)} onClose={onClose} size="sm">
      <FormModalHeader
        title="Delete Portfolio Item"
        description="Permanently remove content and clean up media"
        icon={Trash2}
        onClose={onClose}
      />

      <FormModalBody className="space-y-4 py-5">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">
              Are you sure you want to delete this item?
            </p>
            <p className="text-muted-foreground leading-relaxed">
              &ldquo;<strong className="text-foreground">{itemToDelete.title}</strong>&rdquo; will be permanently removed from the portfolio. Any media files stored in Cloudinary will also be unlinked.
            </p>
          </div>
        </div>
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText="Cancel"
        onSubmit={onConfirmDelete}
        submitText={isSubmitting ? "Deleting..." : "Delete Item"}
        submitVariant="danger"
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
}

export default DeleteConfirmationModal;
