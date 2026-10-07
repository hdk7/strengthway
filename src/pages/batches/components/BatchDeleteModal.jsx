import { Trash2 } from "lucide-react";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export function BatchDeleteModal({
  batchToDelete,
  onClose,
  onConfirmDelete,
  isSubmitting,
}) {
  if (!batchToDelete) return null;

  return (
    <FormModal isOpen={Boolean(batchToDelete)} onClose={onClose} size="sm">
      <FormModalHeader
        title="Delete Batch"
        description="Permanent removal from active training schedule"
        icon={Trash2}
        onClose={onClose}
      />

      <FormModalBody className="space-y-4 py-5">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to remove <strong className="text-slate-900 dark:text-foreground">{batchToDelete.name}</strong> from the training schedule? All associated floor class records will be unlinked.
        </p>
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText="Cancel"
        onSubmit={onConfirmDelete}
        submitText={isSubmitting ? "Deleting..." : "Delete Batch"}
        submitVariant="danger"
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
}

export default BatchDeleteModal;
