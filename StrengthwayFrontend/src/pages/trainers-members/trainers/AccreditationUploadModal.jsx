import { FileText, ShieldCheck } from "lucide-react";
import { InputField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

export default function AccreditationUploadModal({
  isOpen,
  onClose,
  pendingFile,
  customTitle,
  setCustomTitle,
  customIssuer,
  setCustomIssuer,
  onConfirmUpload,
  isUploading,
}) {
  if (!pendingFile) return null;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="md">
      <FormModalHeader
        title="Verify & Record Accreditation"
        subtitle="Upload coach credentials and certificate audit metadata"
        onClose={onClose}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/60 dark:bg-muted/30 p-3 flex items-center gap-3">
            <FileText size={24} className="text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-foreground truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
              </p>
            </div>
          </div>

          <InputField
            label="Accreditation / Certificate Name"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. CSCS Strength Specialist"
          />

          <InputField
            label="Issuing Authority / Academy"
            value={customIssuer}
            onChange={(e) => setCustomIssuer(e.target.value)}
            placeholder="e.g. NSCA, CrossFit LLC, ACE"
          />
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          onSubmit={onConfirmUpload}
          submitText={isUploading ? "Verifying..." : "Verify & Save Document"}
          submitIcon={ShieldCheck}
          isSubmitting={isUploading}
        />
      </div>
    </FormModal>
  );
}
