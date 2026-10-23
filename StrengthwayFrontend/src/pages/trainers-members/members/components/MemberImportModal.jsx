import { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  Search,
  Filter,
  Check,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
} from "@/components/ui/FormModal";
import {
  downloadImportTemplate,
  uploadAndParseImportFile,
  validateImportRows,
  executeMemberImport,
} from "@/lib/memberImportService";

export function MemberImportModal({ isOpen, onClose, onSuccess }) {
  // Stepper: 1 = Upload, 2 = Preview & Validation, 3 = Summary Result
  const [step, setStep] = useState(1);

  // File & Upload State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  // Preview & Validation State
  const [validationData, setValidationData] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | READY | DUPLICATES | INVALID
  const [searchFilter, setSearchFilter] = useState("");

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setIsDragging(false);
    setValidationData(null);
    setActiveFilter("ALL");
    setSearchFilter("");
    setIsExecuting(false);
    setExecutionResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  /* -------------------------------------------------------------
   * STEP 1: TEMPLATE DOWNLOAD & FILE PARSING
   * ------------------------------------------------------------- */
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadImportTemplate("xlsx");
      toast.success("Excel Import Template downloaded successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to download template.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (selectedFile) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const isExtValid = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isExtValid) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      // 1. Upload & parse file on server
      const parseRes = await uploadAndParseImportFile(selectedFile);
      // apiClient automatically unwraps json.data, but guard against both shapes
      const parsedRows = parseRes?.rows || parseRes?.data?.rows || [];

      if (!parsedRows || parsedRows.length === 0) {
        throw new Error("No data rows found in the uploaded file.");
      }

      // 2. Validate parsed rows and run duplicate detection
      const valRes = await validateImportRows(parsedRows);
      const validatedData = valRes?.rows ? valRes : (valRes?.data || valRes);
      setValidationData(validatedData);
      setStep(2);
      toast.success(
        `Parsed ${parsedRows.length} member records. Review preview below.`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to parse spreadsheet file.");
      setFile(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* -------------------------------------------------------------
   * STEP 2: EXECUTE BULK IMPORT
   * ------------------------------------------------------------- */
  const handleExecuteImport = async () => {
    if (!validationData || !validationData.rows) return;

    const readyRecords = validationData.rows.filter((r) => r.status === "READY");
    if (readyRecords.length === 0) {
      toast.error("No valid records to import. Please resolve errors in your spreadsheet.");
      return;
    }

    setIsExecuting(true);
    try {
      const res = await executeMemberImport({
        records: readyRecords,
        sourceFilename: file?.name || "member_import.xlsx",
      });

      const execResult = res?.importedCount !== undefined ? res : (res?.data || res);
      setExecutionResult(execResult);
      setStep(3);
      toast.success(
        `Successfully imported ${execResult?.importedCount || 0} member records!`
      );
      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (err) {
      toast.error(err?.message || "Bulk import failed. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  /* -------------------------------------------------------------
   * PREVIEW FILTERING
   * ------------------------------------------------------------- */
  const filteredRows = (validationData?.rows || []).filter((row) => {
    // Tab filter
    if (activeFilter === "READY" && row.status !== "READY") return false;
    if (
      activeFilter === "DUPLICATES" &&
      row.status !== "DUPLICATE_IN_FILE" &&
      row.status !== "EXISTING_IN_DB"
    )
      return false;
    if (activeFilter === "INVALID" && row.status !== "INVALID") return false;

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = (row.fullName || "").toLowerCase().includes(q);
      const matchEmail = (row.email || "").toLowerCase().includes(q);
      const matchPhone = (row.mobile || "").toLowerCase().includes(q);
      const matchCity = (row.city || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchCity) return false;
    }

    return true;
  });

  const summary = validationData?.summary || {
    totalRows: 0,
    readyCount: 0,
    fileDuplicateCount: 0,
    dbDuplicateCount: 0,
    invalidCount: 0,
  };

  return (
    <FormModal isOpen={isOpen} onClose={handleClose} size="4xl">
      <FormModalHeader
        title="Bulk Member Import"
        subtitle="Upload an Excel file (.xlsx) to validate and import real member records in bulk."
        onClose={handleClose}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="p-4 sm:p-6 space-y-5">
          {/* ── STEP 1: UPLOAD & TEMPLATE ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Template Download Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Standard Excel Import Template
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download the official formatted template pre-configured with required fields and data constraints.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Download size={14} className={isDownloadingTemplate ? "animate-bounce" : ""} />
                  <span>{isDownloadingTemplate ? "Downloading…" : "Download Template (.xlsx)"}</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border hover:border-border/80 bg-card hover:bg-muted/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="member-import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="p-4 rounded-2xl bg-muted/60 text-primary mb-3">
                  {isParsing ? (
                    <Loader2 size={32} className="animate-spin text-primary" />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {isParsing
                      ? "Parsing & Validating Member Records…"
                      : "Drag and drop your Excel file here, or browse"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PREVIEW & VALIDATION ──────────────────────────────────── */}
          {step === 2 && validationData && (
            <div className="space-y-4">
              {/* Summary KPIs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  onClick={() => setActiveFilter("ALL")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeFilter === "ALL"
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Total Records
                  </span>
                  <div className="text-xl font-extrabold text-foreground mt-0.5">
                    {summary.totalRows}
                  </div>
                </div>

                <div
                  onClick={() => setActiveFilter("READY")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeFilter === "READY"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Ready to Import
                  </span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {summary.readyCount}
                  </div>
                </div>

                <div
                  onClick={() => setActiveFilter("DUPLICATES")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeFilter === "DUPLICATES"
                      ? "border-amber-500 bg-amber-500/10 shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    Duplicates
                  </span>
                  <div className="text-xl font-extrabold text-amber-500 mt-0.5">
                    {summary.fileDuplicateCount + summary.dbDuplicateCount}
                  </div>
                </div>

                <div
                  onClick={() => setActiveFilter("INVALID")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeFilter === "INVALID"
                      ? "border-rose-500 bg-rose-500/10 shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                    Invalid Rows
                  </span>
                  <div className="text-xl font-extrabold text-rose-500 mt-0.5">
                    {summary.invalidCount}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80 text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === "ALL"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({summary.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("READY")}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === "READY"
                        ? "bg-card text-emerald-500 shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ready ({summary.readyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("DUPLICATES")}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === "DUPLICATES"
                        ? "bg-card text-amber-500 shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Duplicates ({summary.fileDuplicateCount + summary.dbDuplicateCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("INVALID")}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === "INVALID"
                        ? "bg-card text-rose-500 shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Invalid ({summary.invalidCount})
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search preview…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Records Preview Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="max-h-[360px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12">#</th>
                        <th className="py-2.5 px-3">Member Name</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">DOB & Gender</th>
                        <th className="py-2.5 px-3">Address</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            No member records found matching the active filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              row.status === "READY"
                                ? "hover:bg-emerald-500/5"
                                : row.status === "EXISTING_IN_DB" || row.status === "DUPLICATE_IN_FILE"
                                ? "bg-amber-500/5 hover:bg-amber-500/10"
                                : "bg-rose-500/5 hover:bg-rose-500/10"
                            }`}
                          >
                            <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                              {row.rowNumber}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-foreground block">
                                {row.fullName || "—"}
                              </span>
                              {row.emergencyName && (
                                <span className="text-[10px] text-muted-foreground block">
                                  Emerg: {row.emergencyName}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-mono text-[11px] text-foreground block">
                                {row.mobile || "—"}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block max-w-[150px]">
                                {row.email || "—"}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-foreground block">{row.gender || "—"}</span>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                {row.dob || "—"}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-foreground block truncate max-w-[140px]">
                                {row.city || row.address || "—"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {row.state} {row.pincode}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {row.status === "READY" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check size={11} /> Ready
                                </span>
                              )}
                              {row.status === "DUPLICATE_IN_FILE" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                  <AlertTriangle size={11} /> File Dup
                                </span>
                              )}
                              {row.status === "EXISTING_IN_DB" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/20">
                                  <UserCheck size={11} /> In Database
                                </span>
                              )}
                              {row.status === "INVALID" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/20">
                                  <AlertCircle size={11} /> Invalid
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 max-w-[180px]">
                              {row.errors && row.errors.length > 0 ? (
                                <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-tight">
                                  {row.errors.join("; ")}
                                </p>
                              ) : row.duplicateReason ? (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                                  {row.duplicateReason}
                                </p>
                              ) : (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  Validated & eligible
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: EXECUTION SUMMARY ─────────────────────────────────────── */}
          {step === 3 && executionResult && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in duration-200">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-foreground">
                  Bulk Import Completed Successfully
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  All valid records have been saved directly into the gym database and assigned consecutive Member IDs.
                </p>
              </div>

              {/* Result Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg pt-2">
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Imported
                  </span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    {executionResult.importedCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Skipped / Dupes
                  </span>
                  <div className="text-2xl font-black text-foreground mt-0.5 font-mono">
                    {executionResult.skippedCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                    Failed
                  </span>
                  <div className="text-2xl font-black text-rose-500 mt-0.5 font-mono">
                    {executionResult.failedCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </FormModalBody>

        <div className="relative z-10 border-t border-slate-200/90 dark:border-border/60 bg-slate-50/60 dark:bg-muted/15 px-6 py-4 sm:px-7 shrink-0 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <div className="text-[11px] text-muted-foreground">
                Select or drop an Excel (.xlsx) file to proceed
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isExecuting}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Back to Upload
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isExecuting || summary.readyCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Importing Members…</span>
                    </>
                  ) : (
                    <>
                      <span>Import {summary.readyCount} Valid Records</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-xl bg-blue-900 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Done & View Members
              </button>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
