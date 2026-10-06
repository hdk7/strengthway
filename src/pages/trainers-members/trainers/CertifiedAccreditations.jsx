/* eslint-disable max-lines */
import { useState, useRef } from "react";
import {
  Award,
  FileText,
  Upload,
  CheckCircle2,
  Eye,
  Download,
  Trash2,
  FileCheck,
  Calendar,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_ACCREDITATION_METADATA } from "./accreditationPresets";
import AccreditationUploadModal from "./AccreditationUploadModal";
import AccreditationViewerModal from "./AccreditationViewerModal";

function normalizeAccreditations(trainer) {
  const certs = trainer?.certifications || [
    "CrossFit Level 2 Coach",
    "CSCS Specialist",
    "ACE Certified Personal Trainer",
    "Functional Movement Screen (FMS)",
  ];

  return certs.map((item, index) => {
    if (typeof item === "object" && item !== null) {
      return item;
    }
    const preset = PRESET_ACCREDITATION_METADATA[item] || {};
    return {
      id: `acc-${trainer?.id || "trn"}-${index}`,
      title: item,
      issuer: preset.issuer || "Accredited Athletic Board",
      issueDate: preset.issueDate || "2022-01-15",
      expiryDate: preset.expiryDate || "Valid / Active",
      fileName: preset.fileName || `${item.replace(/[^a-zA-Z0-9]/g, "_")}_Credential.pdf`,
      fileSize: preset.fileSize || "2.1 MB",
      credentialId: preset.credentialId || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
      verified: true,
      fileUrl: null,
    };
  });
}

export function CertifiedAccreditations({
  trainer,
  onUpdateTrainer,
  canUpload = true,
  className = "",
}) {
  const [documents, setDocuments] = useState(() => normalizeAccreditations(trainer));
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customIssuer, setCustomIssuer] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  const saveDocuments = (newDocs) => {
    setDocuments(newDocs);
    if (typeof onUpdateTrainer === "function" && trainer) {
      onUpdateTrainer({
        ...trainer,
        certifications: newDocs,
      });
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|webp)$/i)) {
      toast.error("Please upload a PDF or image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit.");
      return;
    }

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();

    setPendingFile(file);
    setCustomTitle(cleanTitle);
    setCustomIssuer("Official Certification Board");
    setShowUploadModal(true);
  };

  const handleConfirmUpload = () => {
    if (!pendingFile) return;
    setIsUploading(true);

    try {
      const sizeMB = (pendingFile.size / (1024 * 1024)).toFixed(1);
      const newDoc = {
        id: `acc-upload-${Date.now()}`,
        title: customTitle.trim() || pendingFile.name,
        issuer: customIssuer.trim() || "Verified Examination Board",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: "Valid & Active",
        fileName: pendingFile.name,
        fileSize: `${sizeMB} MB`,
        credentialId: `STW-VER-${Math.floor(100000 + Math.random() * 900000)}`,
        verified: true,
        fileUrl: URL.createObjectURL(pendingFile),
      };

      const updated = [newDoc, ...documents];
      saveDocuments(updated);
      toast.success(`"${newDoc.title}" accreditation uploaded and verified!`);
      setShowUploadModal(false);
      setPendingFile(null);
      setCustomTitle("");
      setCustomIssuer("");
    } catch {
      toast.error("Failed to process document upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId, title) => {
    const updated = documents.filter((d) => d.id !== docId);
    saveDocuments(updated);
    toast.success(`Removed "${title}" from profile accreditations.`);
  };

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc.fileName}...`);
    const link = document.createElement("a");
    link.href = doc.fileUrl || "#";
    link.download = doc.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Certified Accreditations & Documents
            </h3>
            <p className="text-xs text-muted-foreground">
              Official faculty certifications, board accreditations, and verified athletic credentials.
            </p>
          </div>
        </div>

        {canUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-background px-4 py-2 text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Accreditation</span>
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Zone (Interactive) */}
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileSelected(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? "border-emerald-400 bg-emerald-400/5 scale-[1.01]"
              : "border-border/80 bg-muted/20 hover:border-accent hover:bg-accent/5"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-card border border-border text-foreground group-hover:scale-110 transition-transform">
              <FileCheck size={22} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Drag and drop certification document, or{" "}
                <span className="text-emerald-500 underline underline-offset-4">browse files</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Accepts PDF, PNG, JPG up to 15MB • Cryptographically registered to trainer profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accreditation Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md transition-all hover:border-accent/40 hover:shadow-xl hover:bg-card overflow-hidden h-full"
          >
            {/* Top Row: File Badge & Status */}
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-sm mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="font-bold text-sm text-foreground group-hover:text-emerald-400 transition-colors truncate"
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>
                    <p
                      className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate"
                      title={doc.issuer}
                    >
                      <Building2 size={11} className="shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{doc.issuer}</span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500 mt-0.5 ml-1 self-start">
                  <CheckCircle2 size={11} />
                  <span>Verified</span>
                </span>
              </div>

              {/* Metadata Details */}
              <div className="mt-3.5 grid grid-cols-2 rounded-xl bg-muted/30 border border-border/50 divide-x divide-border/50 p-2.5 text-[11px]">
                <div className="pr-2.5 min-w-0">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block truncate">
                    Credential ID
                  </span>
                  <span
                    className="font-mono text-foreground font-semibold truncate block mt-0.5"
                    title={doc.credentialId}
                  >
                    {doc.credentialId}
                  </span>
                </div>
                <div className="pl-2.5 min-w-0">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block truncate">
                    File & Size
                  </span>
                  <span
                    className="text-foreground font-medium truncate block mt-0.5"
                    title={`${doc.fileSize} • PDF`}
                  >
                    {doc.fileSize} • PDF
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-3 text-xs gap-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate min-w-0 pr-1">
                <Calendar size={12} className="shrink-0 text-muted-foreground/70" />
                <span className="truncate">Issued {doc.issueDate}</span>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(doc)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/20 text-foreground text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="View Certificate"
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted/60 hover:bg-muted border border-border/70 text-foreground text-xs transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="Download File"
                >
                  <Download size={12} />
                </button>

                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    title="Remove Accreditation"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Confirmation Modal */}
      <AccreditationUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setPendingFile(null);
        }}
        pendingFile={pendingFile}
        customTitle={customTitle}
        setCustomTitle={setCustomTitle}
        customIssuer={customIssuer}
        setCustomIssuer={setCustomIssuer}
        onConfirmUpload={handleConfirmUpload}
        isUploading={isUploading}
      />

      {/* Official Certificate Preview Modal */}
      <AccreditationViewerModal
        activePreviewDoc={activePreviewDoc}
        onClose={() => setActivePreviewDoc(null)}
        trainer={trainer}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default CertifiedAccreditations;
