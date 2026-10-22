import ConfirmDialog from "@/components/ui/ConfirmDialog";

export function BatchDeleteModal({
  batchToDelete,
  onClose,
  onConfirmDelete,
  isSubmitting,
}) {
  return (
    <ConfirmDialog
      isOpen={Boolean(batchToDelete)}
      onClose={onClose}
      onConfirm={onConfirmDelete}
      title="Delete Batch"
      message={`Are you sure you want to remove "${batchToDelete?.name || "this batch"}" from the training schedule? All associated floor class records will be unlinked.`}
      confirmText="Delete Batch"
      variant="danger"
      isLoading={isSubmitting}
    />
  );
}

export default BatchDeleteModal;
