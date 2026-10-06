import { X, Sparkles, ShieldCheck, Download } from "lucide-react";

export default function AccreditationViewerModal({
  activePreviewDoc,
  onClose,
  trainer,
  onDownload,
}) {
  if (!activePreviewDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-amber-400/40 bg-zinc-950 p-6 sm:p-10 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Certificate Layout */}
        <div className="relative rounded-2xl border-4 border-double border-amber-400/50 bg-linear-to-b from-zinc-900 via-black to-zinc-900 p-6 sm:p-10 text-center space-y-5 shadow-inner">
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
              onClick={() => onDownload(activePreviewDoc)}
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-white/90 text-black px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download size={14} />
              <span>Download Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
