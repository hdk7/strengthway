/* eslint-disable max-lines */
import { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import {
  downloadImportTemplate,
  uploadAndParseImportFile,
  validateImportRows,
  executeMemberImport,
  downloadErrorReport,
} from "@/lib/memberImportService";

const STEPS = [
  { id: 1, name: "Upload File" },
  { id: 2, name: "Column Mapping" },
  { id: 3, name: "Validation & Exceptions" },
  { id: 4, name: "Import Summary" },
];

export function MemberImportModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Upload state
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null);
  const fileInputRef = useRef(null);

  // Step 2: Mapping state
  const [parsedData, setParsedData] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [saveAsPreset, setSaveAsPreset] = useState(true);
  const [filterUnmappedOnly, setFilterUnmappedOnly] = useState(false);

  // Step 3: Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [recordsState, setRecordsState] = useState([]);
  const [activeReviewTab, setActiveReviewTab] = useState("exceptions"); // 'exceptions' | 'existing' | 'ready' | 'all'
  const [existingBulkAction, setExistingBulkAction] = useState("update"); // 'update' | 'skip'

  // Step 4: Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [isDownloadingErrorCsv, setIsDownloadingErrorCsv] = useState(false);

  // Reset state on close
  const handleClose = () => {
    setCurrentStep(1);
    setFile(null);
    setParsedData(null);
    setColumnMappings({});
    setValidationResult(null);
    setRecordsState([]);
    setExecutionResult(null);
    onClose();
  };

  /* -------------------------------------------------------------
   * STEP 1: UPLOAD & TEMPLATE DOWNLOAD
   * ------------------------------------------------------------- */
  const handleDownloadTemplate = async (format) => {
    setIsDownloading(format);
    try {
      await downloadImportTemplate(format);
      toast.success(`Blank import template (${format.toUpperCase()}) downloaded!`);
    } catch (e) {
      toast.error(e?.message || `Failed to download ${format} template.`);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      toast.error("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadAndParse = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    try {
      const res = await uploadAndParseImportFile(file);
      if (res?.data) {
        setParsedData(res.data);
        // Build initial mapping state from backend recommendation
        const initialMap = {};
        Object.entries(res.data.mappings || {}).forEach(([header, info]) => {
          initialMap[header] = info.crmField || "";
        });
        setColumnMappings(initialMap);
        setCurrentStep(2);
        toast.success(`Parsed ${res.data.totalRows} data rows from ${res.data.sourceFilename}.`);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to parse uploaded file.");
    } finally {
      setIsUploading(false);
    }
  };

  /* -------------------------------------------------------------
   * STEP 2: COLUMN MAPPING
   * ------------------------------------------------------------- */
  const handleMappingChange = (header, targetField) => {
    setColumnMappings((prev) => ({
      ...prev,
      [header]: targetField,
    }));
  };

  const handleProceedToValidation = async () => {
    // Check if at least fullName and phone are mapped
    const mappedCrmFields = Object.values(columnMappings).filter(Boolean);
    const hasFullName =
      mappedCrmFields.includes("fullName") ||
      (mappedCrmFields.includes("firstName") && mappedCrmFields.includes("lastName"));
    const hasPhone = mappedCrmFields.includes("phone");

    if (!hasFullName) {
      toast.error("Please map a column to Full Name (or First Name + Last Name).");
      return;
    }
    if (!hasPhone) {
      toast.error("Please map a column to Phone / Mobile Number.");
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateImportRows({
        rows: parsedData.rows,
        mappings: columnMappings,
      });

      if (res?.data) {
        setValidationResult(res.data);
        setRecordsState(res.data.records || []);

        // Choose default active review tab
        if ((res.data.summary.issueCount || 0) > 0) {
          setActiveReviewTab("exceptions");
        } else if ((res.data.summary.existingCount || 0) > 0) {
          setActiveReviewTab("existing");
        } else {
          setActiveReviewTab("ready");
        }

        setCurrentStep(3);
      }
    } catch (e) {
      toast.error(e?.message || "Validation failed.");
    } finally {
      setIsValidating(false);
    }
  };

  /* -------------------------------------------------------------
   * STEP 3: EXCEPTION-ONLY REVIEW
   * ------------------------------------------------------------- */
  const handleRecordActionToggle = (rowIndex, newAction) => {
    setRecordsState((prev) =>
      prev.map((rec) => (rec.rowIndex === rowIndex ? { ...rec, action: newAction } : rec)),
    );
  };

  const handleSetAllExistingAction = (action) => {
    setExistingBulkAction(action);
    setRecordsState((prev) =>
      prev.map((rec) => {
        if (rec.status === "existing_member") {
          return { ...rec, action };
        }
        return rec;
      }),
    );
    toast.success(`Set all existing members to: ${action === "update" ? "Update Profile" : "Skip"}`);
  };

  const handleExecuteImport = async () => {
    setIsExecuting(true);
    try {
      // Collect custom mappings to save if checkbox is checked
      const customMappingsToSave = saveAsPreset ? columnMappings : null;

      const res = await executeMemberImport({
        records: recordsState,
        customMappingsToSave,
        sourceFilename: parsedData.sourceFilename,
        fileSize: parsedData.fileSize,
      });

      if (res?.data) {
        setExecutionResult(res.data);
        setCurrentStep(4);
        toast.success("Bulk member import completed!");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (e) {
      toast.error(e?.message || "Import execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  /* -------------------------------------------------------------
   * STEP 4: SUMMARY & ERROR REPORT
   * ------------------------------------------------------------- */
  const handleDownloadExecutionErrorReport = async () => {
    if (!executionResult?.importId) return;
    setIsDownloadingErrorCsv(true);
    try {
      await downloadErrorReport(executionResult.importId);
      toast.success("Error report CSV downloaded!");
    } catch (e) {
      toast.error(e?.message || "Failed to download error report.");
    } finally {
      setIsDownloadingErrorCsv(false);
    }
  };

  // Helper getters for step 3
  const summary = validationResult?.summary || {
    total: 0,
    readyCount: 0,
    existingCount: 0,
    issueCount: 0,
  };

  const filteredRecords = recordsState.filter((r) => {
    if (activeReviewTab === "exceptions") {
      return (
        r.status === "has_issues" ||
        (r.issues && r.issues.length > 0) ||
        r.status === "file_duplicate"
      );
    }
    if (activeReviewTab === "existing") {
      return r.status === "existing_member";
    }
    if (activeReviewTab === "ready") {
      return r.status === "ready" && (!r.issues || r.issues.length === 0);
    }
    return true; // 'all'
  });

  const readyToCreateCount = recordsState.filter((r) => r.action === "create").length;
  const readyToUpdateCount = recordsState.filter((r) => r.action === "update").length;
  const readyToSkipCount = recordsState.filter((r) => r.action === "skip").length;

  return (
    <FormModal isOpen={isOpen} onClose={handleClose} size="4xl">
      <FormModalHeader
        title="Smart Member Import"
        subtitle="Import member responses from Google Sheets or Excel with automatic header matching, duplicate detection, and exception-only review."
        badge={
          <div className="flex items-center gap-1 text-xs">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentStep === step.id
                      ? "bg-blue-600 text-white"
                      : currentStep > step.id
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}. {step.name}
                </span>
                {idx < STEPS.length - 1 && (
                  <span className="text-muted-foreground/40 text-[10px]">›</span>
                )}
              </div>
            ))}
          </div>
        }
        icon={FileSpreadsheet}
        onClose={handleClose}
      />

      <FormModalBody className="space-y-4">
        {/* =========================================================
            STEP 1: UPLOAD & TEMPLATE DOWNLOAD
            ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5">
            {/* Download Templates Banner */}
            <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  Need a pre-formatted template?
                </h4>
                <p className="text-[11px] text-blue-900/70 dark:text-blue-300/70">
                  Download standardized Excel or CSV templates with sample data matching CRM fields.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  disabled={isDownloading === "xlsx"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>{isDownloading === "xlsx" ? "Saving..." : "Excel (.xlsx)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  disabled={isDownloading === "csv"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>{isDownloading === "csv" ? "Saving..." : "CSV (.csv)"}</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.005]"
                  : file
                    ? "border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-border hover:border-blue-400 bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">{file.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {(file.size / 1024).toFixed(1)} KB · Ready to parse
                  </p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 underline pt-1">
                    Click to choose a different file
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">
                    Drag & drop your Google Form response sheet or Excel file
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> exported from Google Sheets or Excel.
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-lg border border-border bg-card text-xs font-semibold text-foreground shadow-2xs">
                    Browse Computer
                  </span>
                </div>
              )}
            </div>

            {/* Smart Features Note */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg border border-border/80 bg-card/60 flex items-start gap-2">
                <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Smart Auto-Mapping:</strong> Google Form and CSV headers map automatically with zero manual effort.
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border/80 bg-card/60 flex items-start gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Duplicate Safeguards:</strong> Existing members are identified via Phone and ID with option to Update or Skip.
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border/80 bg-card/60 flex items-start gap-2">
                <UserCheck size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Database Verified:</strong> Plans & batches are verified against active CRM records.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: SMART COLUMN MAPPING
            ========================================================= */}
        {currentStep === 2 && parsedData && (
          <div className="space-y-3.5">
            {/* Header info & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">
                    File: <span className="text-blue-600 dark:text-blue-400">{parsedData.sourceFilename}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {parsedData.totalRows} data rows
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Verify or customize how file columns map to CRM member fields.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilterUnmappedOnly(!filterUnmappedOnly)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    filterUnmappedOnly
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Filter size={12} />
                  <span>
                    {filterUnmappedOnly ? "Showing Unmapped / Ambiguous" : "Show All Columns"}
                  </span>
                </button>
              </div>
            </div>

            {/* Column Mapping Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs max-h-[380px] overflow-y-auto no-scrollbar shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] sticky top-0 border-b border-border z-10">
                  <tr>
                    <th className="py-2.5 px-3">Column in Uploaded File</th>
                    <th className="py-2.5 px-3">Sample Value</th>
                    <th className="py-2.5 px-3">Match Confidence</th>
                    <th className="py-2.5 px-3">Target CRM Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-normal">
                  {parsedData.detectedHeaders
                    .filter((header) => {
                      if (!filterUnmappedOnly) return true;
                      const crm = columnMappings[header];
                      return !crm;
                    })
                    .map((header) => {
                      const mappingInfo = parsedData.mappings?.[header] || {};
                      const currentSelected = columnMappings[header] || "";
                      const sampleVal = parsedData.previewRows?.[0]?.[header] || "—";

                      return (
                        <tr key={header} className="hover:bg-muted/30 transition-colors">
                          {/* File Column */}
                          <td className="py-2 px-3 font-semibold text-foreground whitespace-nowrap">
                            {header}
                          </td>

                          {/* Sample Value */}
                          <td
                            className="py-2 px-3 text-muted-foreground max-w-[140px] truncate font-mono text-[11px]"
                            title={String(sampleVal)}
                          >
                            {String(sampleVal)}
                          </td>

                          {/* Match Confidence Badge */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            {mappingInfo.matchType === "exact" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                Exact Match (100%)
                              </span>
                            ) : mappingInfo.matchType === "alias" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                                Smart Alias ({Math.round((mappingInfo.confidence || 0.9) * 100)}%)
                              </span>
                            ) : mappingInfo.matchType === "normalized" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                                Normalized ({Math.round((mappingInfo.confidence || 0.85) * 100)}%)
                              </span>
                            ) : mappingInfo.matchType === "preset" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">
                                Saved Preset
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                                Unmapped
                              </span>
                            )}
                          </td>

                          {/* Target CRM Field Selector */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <select
                              value={currentSelected}
                              onChange={(e) => handleMappingChange(header, e.target.value)}
                              className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                            >
                              <option value="">— Skip / Ignore Column —</option>
                              {parsedData.crmFields.map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label} {f.required ? "(Required)" : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Preset Saving Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsPreset}
                  onChange={(e) => setSaveAsPreset(e.target.checked)}
                  className="rounded border-border text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-foreground">
                  Save these confirmed column mappings as presets for future imports
                </span>
              </label>

              <span className="text-[11px] text-muted-foreground">
                Google Form responses will automatically reuse this configuration.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: VALIDATION & EXCEPTION-ONLY REVIEW
            ========================================================= */}
        {currentStep === 3 && validationResult && (
          <div className="space-y-3.5">
            {/* Metric Summary Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Total Records */}
              <div className="p-3 rounded-xl border border-border bg-card space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground">Total Uploaded</span>
                <div className="text-lg font-extrabold text-foreground">{summary.total}</div>
                <span className="text-[10px] text-muted-foreground">Valid rows parsed</span>
              </div>

              {/* Ready to Import */}
              <div
                onClick={() => setActiveReviewTab("ready")}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-0.5 ${
                  activeReviewTab === "ready"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                    : "border-border bg-card hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                    Ready to Import
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                </div>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                  {summary.readyCount}
                </div>
                <span className="text-[10px] text-emerald-600/80">New clean profiles</span>
              </div>

              {/* Existing Members */}
              <div
                onClick={() => setActiveReviewTab("existing")}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-0.5 ${
                  activeReviewTab === "existing"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-border bg-card hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-blue-800 dark:text-blue-400">
                    Existing Members
                  </span>
                  <UserCheck size={13} className="text-blue-600" />
                </div>
                <div className="text-lg font-extrabold text-blue-700 dark:text-blue-400">
                  {summary.existingCount}
                </div>
                <span className="text-[10px] text-blue-600/80">Matched by Phone/ID</span>
              </div>

              {/* Exceptions / Issues */}
              <div
                onClick={() => setActiveReviewTab("exceptions")}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-0.5 ${
                  activeReviewTab === "exceptions"
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                    : "border-border bg-card hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                    Exceptions & Issues
                  </span>
                  <AlertTriangle size={13} className="text-amber-600" />
                </div>
                <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                  {summary.issueCount}
                </div>
                <span className="text-[10px] text-amber-600/80">Requires your review</span>
              </div>
            </div>

            {/* Filter Tabs & Bulk Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveReviewTab("exceptions")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeReviewTab === "exceptions"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Exceptions & Issues ({summary.issueCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewTab("existing")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeReviewTab === "existing"
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Existing Members ({summary.existingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewTab("ready")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeReviewTab === "ready"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ready to Import ({summary.readyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewTab("all")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeReviewTab === "all"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({summary.total})
                </button>
              </div>

              {/* Bulk actions for Existing Members */}
              {activeReviewTab === "existing" && summary.existingCount > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground text-[11px]">All existing:</span>
                  <button
                    type="button"
                    onClick={() => handleSetAllExistingAction("update")}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                      existingBulkAction === "update"
                        ? "bg-blue-600 text-white"
                        : "border border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    Update Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllExistingAction("skip")}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                      existingBulkAction === "skip"
                        ? "bg-slate-700 text-white"
                        : "border border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    Skip All
                  </button>
                </div>
              )}
            </div>

            {/* Records List Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs max-h-[380px] overflow-y-auto no-scrollbar shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] sticky top-0 border-b border-border z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Row</th>
                    <th className="py-2.5 px-3">Member Name & Contact</th>
                    <th className="py-2.5 px-3">Plan & Batch</th>
                    <th className="py-2.5 px-3">Status & Detected Issues</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-normal">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500 opacity-80" />
                        <p className="font-semibold text-foreground">No records in this category</p>
                        <p className="text-[11px]">All records have been resolved or are ready.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const data = rec.data || {};
                      const fullName =
                        `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
                        data.fullName ||
                        "Unnamed";

                      return (
                        <tr key={rec.rowIndex} className="hover:bg-muted/30 transition-colors">
                          {/* Row Number */}
                          <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                            #{rec.rowIndex}
                          </td>

                          {/* Name & Contact */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-foreground">{fullName}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {data.phone || "No phone"} {data.email ? `· ${data.email}` : ""}
                            </div>
                          </td>

                          {/* Plan & Batch */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="text-foreground font-medium">
                              {rec.planMatched ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 size={11} /> {rec.planMatched.planName}
                                </span>
                              ) : data.planName ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {data.planName} (Unmatched)
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">No plan</span>
                              )}
                            </div>

                            <div className="text-[11px] text-muted-foreground">
                              {rec.batchMatched ? (
                                <span className="text-indigo-700 dark:text-indigo-300">
                                  Batch: {rec.batchMatched.batchName}
                                </span>
                              ) : data.batchName ? (
                                <span className="text-amber-600">
                                  Batch: {data.batchName} (Unmatched)
                                </span>
                              ) : (
                                <span className="italic">No batch</span>
                              )}
                            </div>
                          </td>

                          {/* Status & Issues */}
                          <td className="py-2.5 px-3">
                            {rec.status === "existing_member" && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                                  <UserCheck size={11} /> Existing: {rec.existingMember?.memberId || "Member"}
                                </span>
                                <p className="text-[10px] text-muted-foreground">
                                  Matched by: {rec.existingMatchReason || "Phone"}
                                </p>
                              </div>
                            )}

                            {rec.status === "ready" && (!rec.issues || rec.issues.length === 0) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <CheckCircle2 size={11} /> Ready to import
                              </span>
                            )}

                            {rec.issues && rec.issues.length > 0 && (
                              <div className="space-y-1">
                                {rec.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300"
                                  >
                                    <AlertTriangle size={11} className="shrink-0 text-amber-500" />
                                    <span>{issue.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Action Selector */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-right">
                            {rec.status === "existing_member" ? (
                              <select
                                value={rec.action || "update"}
                                onChange={(e) => handleRecordActionToggle(rec.rowIndex, e.target.value)}
                                className="h-7 rounded-md border border-border bg-card px-2 text-[11px] font-semibold text-foreground outline-none focus:border-blue-500"
                              >
                                <option value="update">Update Profile</option>
                                <option value="skip">Skip Record</option>
                              </select>
                            ) : (
                              <select
                                value={rec.action || "create"}
                                onChange={(e) => handleRecordActionToggle(rec.rowIndex, e.target.value)}
                                className="h-7 rounded-md border border-border bg-card px-2 text-[11px] font-semibold text-foreground outline-none focus:border-blue-500"
                              >
                                <option value="create">Import as New</option>
                                <option value="skip">Skip Record</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Safeguards Disclaimer */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>
                  <strong>Safe Updates:</strong> Updating existing members preserves their existing data and never clears untouched fields.
                </span>
              </div>
              <div className="font-semibold text-foreground">
                Action Plan: +{readyToCreateCount} new · {readyToUpdateCount} updates · {readyToSkipCount} skipped
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4: IMPORT EXECUTION & SUMMARY
            ========================================================= */}
        {currentStep === 4 && executionResult && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground font-display">
                Bulk Import Completed Successfully!
              </h3>
              <p className="text-xs text-muted-foreground">
                Import Batch: <span className="font-mono font-bold text-foreground">{executionResult.importId}</span>
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                  New Members Created
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                  +{executionResult.createdCount || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20">
                <span className="text-[11px] font-medium text-blue-800 dark:text-blue-400">
                  Profiles Updated
                </span>
                <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                  {executionResult.updatedCount || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <span className="text-[11px] font-medium text-muted-foreground">Records Skipped</span>
                <div className="text-2xl font-extrabold text-muted-foreground mt-1">
                  {executionResult.skippedCount || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <span className="text-[11px] font-medium text-muted-foreground">Failures</span>
                <div className="text-2xl font-extrabold text-foreground mt-1">
                  {executionResult.failedCount || 0}
                </div>
              </div>
            </div>

            {/* If errors occurred, download error report */}
            {executionResult.failedCount > 0 && (
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 max-w-xl mx-auto flex items-center justify-between gap-3 text-left">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Some rows could not be imported
                  </h4>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
                    Download the error report CSV to fix failed records and re-import them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExecutionErrorReport}
                  disabled={isDownloadingErrorCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Download size={13} />
                  <span>{isDownloadingErrorCsv ? "Downloading..." : "Download Error CSV"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </FormModalBody>

      <FormModalFooter
        onCancel={handleClose}
        cancelText={currentStep === 4 ? "Done" : "Cancel"}
        extraLeft={
          currentStep > 1 && currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          ) : null
        }
      >
        {/* Step 1 Action */}
        {currentStep === 1 && (
          <button
            type="button"
            onClick={handleUploadAndParse}
            disabled={!file || isUploading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Parsing Sheet...</span>
              </>
            ) : (
              <>
                <span>Continue to Column Mapping</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        )}

        {/* Step 2 Action */}
        {currentStep === 2 && (
          <button
            type="button"
            onClick={handleProceedToValidation}
            disabled={isValidating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Validating Data...</span>
              </>
            ) : (
              <>
                <span>Validate & Review Exceptions</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        )}

        {/* Step 3 Action */}
        {currentStep === 3 && (
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isExecuting || readyToCreateCount + readyToUpdateCount === 0}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Executing Bulk Import...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>
                  Confirm Import ({readyToCreateCount} New, {readyToUpdateCount} Updates)
                </span>
              </>
            )}
          </button>
        )}

        {/* Step 4 Action */}
        {currentStep === 4 && (
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Close & View Members</span>
          </button>
        )}
      </FormModalFooter>
    </FormModal>
  );
}
