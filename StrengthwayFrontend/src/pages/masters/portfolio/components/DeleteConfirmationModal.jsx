import ConfirmDialog from "@/components/ui/ConfirmDialog";

export function DeleteConfirmationModal({
  itemToDelete,
  onClose,
  onConfirmDelete,
  isSubmitting,
}) {
  return (
    <ConfirmDialog
      isOpen={Boolean(itemToDelete)}
      onClose={onClose}
      onConfirm={onConfirmDelete}
      title="Delete Portfolio Item"
      message={`"${itemToDelete?.title || "This item"}" will be permanently removed from the portfolio. Any media files stored in Cloudinary will also be unlinked.`}
      confirmText="Delete Item"
      variant="danger"
      isLoading={isSubmitting}
    />
  );
}

export default DeleteConfirmationModal;
