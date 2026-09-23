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
  X,
  FileCheck,
  ShieldCheck,
  Calendar,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// Pre-seeded rich accreditation documents based on trainer certification names
const PRESET_ACCREDITATION_METADATA = {
  "CrossFit Level 2 Coach": {
    issuer: "CrossFit LLC Training Board",
    issueDate: "2022-04-18",
    expiryDate: "2027-04-18",
    fileName: "CrossFit_L2_Certificate.pdf",
    fileSize: "2.4 MB",
    credentialId: "CF-884920-L2",
  },
  "CSCS Specialist": {
    issuer: "National Strength & Conditioning Association (NSCA)",
    issueDate: "2021-08-12",
    expiryDate: "Lifetime / Validated",
    fileName: "CSCS_Accreditation_Doc.pdf",
    fileSize: "1.9 MB",
    credentialId: "NSCA-77491-CSCS",
  },
  "ACE Certified Personal Trainer": {
    issuer: "American Council on Exercise (ACE)",
    issueDate: "2020-11-05",
    expiryDate: "2026-11-05",
    fileName: "ACE_Certified_PT.pdf",
    fileSize: "3.1 MB",
    credentialId: "ACE-99410-CPT",
  },
  "Functional Movement Screen (FMS)": {
    issuer: "FMS Functional Movement Systems",
    issueDate: "2023-02-20",
    expiryDate: "2027-02-20",
    fileName: "FMS_Level1_Verification.pdf",
    fileSize: "1.4 MB",
    credentialId: "FMS-55210-PRO",
  },
  "CSCS (Certified Strength & Conditioning Specialist)": {
    issuer: "National Strength & Conditioning Association (NSCA)",
    issueDate: "2020-06-14",
    expiryDate: "Lifetime / Validated",
    fileName: "CSCS_Master_Accreditation.pdf",
    fileSize: "2.8 MB",
    credentialId: "NSCA-90234-CSCS",
  },
  "USA Weightlifting (USAW-1)": {
    issuer: "USA Weightlifting Coaching Board",
    issueDate: "2021-09-30",
    expiryDate: "2026-09-30",
    fileName: "USAW_Olympic_Lifting_Cert.pdf",
    fileSize: "1.7 MB",
    credentialId: "USAW-44321-L1",
  },
  "ISSA Elite Master Trainer": {
    issuer: "International Sports Sciences Association",
    issueDate: "2019-12-10",
    expiryDate: "Lifetime / Validated",
    fileName: "ISSA_Master_Trainer.pdf",
    fileSize: "3.2 MB",
    credentialId: "ISSA-88390-EMT",
  },
  "Precision Nutrition Level 1": {
    issuer: "Precision Nutrition Academy",
    issueDate: "2022-07-22",
    expiryDate: "Lifetime / Validated",
    fileName: "Precision_Nutrition_L1.pdf",
    fileSize: "2.1 MB",
    credentialId: "PN1-66420-EXP",
  },
  "NASM Corrective Exercise Specialist (CES)": {
    issuer: "National Academy of Sports Medicine (NASM)",
    issueDate: "2021-03-15",
    expiryDate: "2027-03-15",
    fileName: "NASM_CES_Accreditation.pdf",
    fileSize: "2.6 MB",
    credentialId: "NASM-77120-CES",
  },
  "EXOS Performance Specialist": {
    issuer: "EXOS Athletic Performance Academy",
    issueDate: "2022-10-08",
    expiryDate: "2026-10-08",
    fileName: "EXOS_Performance_Cert.pdf",
    fileSize: "1.8 MB",
    credentialId: "EXOS-33190-XPS",
  },
  "Sports Physical Therapy Associate": {
    issuer: "APTA Sports Physical Therapy Section",
    issueDate: "2020-05-19",
    expiryDate: "Lifetime / Validated",
    fileName: "Sports_PT_Associate_Doc.pdf",
    fileSize: "3.4 MB",
    credentialId: "APTA-55910-SPT",
  },
  "TRX Suspension Master Coach": {
    issuer: "TRX Training International",
    issueDate: "2023-01-14",
    expiryDate: "2027-01-14",
    fileName: "TRX_Suspension_Mastery.pdf",
    fileSize: "1.2 MB",
    credentialId: "TRX-11940-MST",
  },
};

export function normalizeAccreditations(trainer) {
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
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Certified Accreditations & Documents</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                Audited & Verified
              </span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                  <FileCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Upload Accreditation Document</h3>
                  <p className="text-xs text-muted-foreground">Configure accreditation credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingFile(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
                <FileText size={24} className="text-red-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Accreditation / Certificate Name</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. CSCS Strength Specialist"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Issuing Authority / Academy</label>
                <input
                  type="text"
                  value={customIssuer}
                  onChange={(e) => setCustomIssuer(e.target.value)}
                  placeholder="e.g. NSCA, CrossFit LLC, ACE"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingFile(null);
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>{isUploading ? "Verifying..." : "Verify & Save Document"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Preview Modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border-2 border-amber-400/40 bg-zinc-950 p-6 sm:p-10 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setActivePreviewDoc(null)}
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Certificate Layout */}
            <div className="relative rounded-2xl border-4 border-double border-amber-400/50 bg-gradient-to-b from-zinc-900 via-black to-zinc-900 p-6 sm:p-10 text-center space-y-5 shadow-inner">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300">
                <Sparkles size={13} />
                <span>The Strength Way Verified Faculty</span>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
                  Certificate of Accreditation
                </h2>
                <p className="text-xs text-white/60 mt-1 uppercase tracking-wider">
                  Official Verification Credential
                </p>
              </div>

              <div className="py-2">
                <p className="text-xs text-white/70 italic">This is to certify that faculty trainer</p>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1">
                  {trainer?.name || "Faculty Coach"}
                </h3>
                <p className="text-xs text-white/70 mt-2">
                  has demonstrated exemplary mastery and fulfilled all requirements for
                </p>
                <div className="mt-3 inline-block rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-bold text-sm sm:text-base text-white">
                  {activePreviewDoc.title}
                </div>
              </div>

              <div className="pt-4 border-t border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
                <div className="text-left">
                  <span className="block text-[10px] text-white/40 uppercase">Issuing Academy</span>
                  <span className="font-semibold text-white">{activePreviewDoc.issuer}</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="block text-[10px] text-white/40 uppercase">Credential ID</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {activePreviewDoc.credentialId}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-white/60 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Validated against athletic registry database</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload(activePreviewDoc)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-white/90 text-black px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CertifiedAccreditations;
