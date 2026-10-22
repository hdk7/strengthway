/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  ExternalLink,
  Check,
  Settings2,
  FileSpreadsheet,
  Info,
  Sparkles,
  Download,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import {
  getImportConfig,
  updateImportConfig,
  downloadImportTemplate,
} from "@/lib/memberImportService";

const STANDARD_QUESTIONS = [
  {
    num: 1,
    title: "Full Name",
    type: "Short answer",
    required: true,
    crmField: "Full Name (firstName + lastName)",
    notes: "Standardized single or split name. Auto-split into First & Last name in CRM.",
  },
  {
    num: 2,
    title: "Phone Number",
    type: "Short answer / Number",
    required: true,
    crmField: "Phone / Mobile",
    notes: "10-digit mobile number. Primary identifier for member profiles and duplicate detection.",
  },
  {
    num: 3,
    title: "Email Address",
    type: "Short answer / Email",
    required: false,
    crmField: "Email",
    notes: "Valid email address for gym communication and receipts.",
  },
  {
    num: 4,
    title: "Existing Member ID",
    type: "Short answer",
    required: false,
    crmField: "Member ID (e.g. MEM00123)",
    notes: "Optional. If provided, CRM will find and offer to update their existing member profile.",
  },
  {
    num: 5,
    title: "Gender",
    type: "Dropdown / Multiple choice",
    required: false,
    crmField: "Gender",
    notes: "Options: Male, Female, Other",
  },
  {
    num: 6,
    title: "Date of Birth",
    type: "Date",
    required: false,
    crmField: "Date of Birth (DOB)",
    notes: "Member birthday. Accepts YYYY-MM-DD or DD-MM-YYYY format.",
  },
  {
    num: 7,
    title: "Membership Plan",
    type: "Dropdown",
    required: false,
    crmField: "Membership Plan",
    notes: "Use dropdown with exact names of your CRM plans (e.g., Monthly Standard, Annual Premium, Quarterly Fitness).",
  },
  {
    num: 8,
    title: "Batch",
    type: "Dropdown",
    required: false,
    crmField: "Batch Name",
    notes: "Use dropdown matching your gym batch timings (e.g., Morning 6:00 AM - 7:30 AM, Evening 6:00 PM - 7:30 PM).",
  },
  {
    num: 9,
    title: "Blood Group",
    type: "Dropdown",
    required: false,
    crmField: "Blood Group",
    notes: "Options: A+, A-, B+, B-, AB+, AB-, O+, O-",
  },
  {
    num: 10,
    title: "Emergency Contact Name",
    type: "Short answer",
    required: false,
    crmField: "Emergency Contact Name",
    notes: "Name of family member or emergency contact person.",
  },
  {
    num: 11,
    title: "Emergency Contact Phone",
    type: "Short answer / Number",
    required: false,
    crmField: "Emergency Contact Phone",
    notes: "Phone number of emergency contact.",
  },
  {
    num: 12,
    title: "Emergency Contact Relation",
    type: "Dropdown / Short answer",
    required: false,
    crmField: "Emergency Contact Relation",
    notes: "Options: Spouse, Parent, Sibling, Friend, Other",
  },
  {
    num: 13,
    title: "Height (cm)",
    type: "Short answer / Number",
    required: false,
    crmField: "Height",
    notes: "Physical stat in centimeters (e.g., 175).",
  },
  {
    num: 14,
    title: "Weight (kg)",
    type: "Short answer / Number",
    required: false,
    crmField: "Weight",
    notes: "Physical stat in kilograms (e.g., 72.5).",
  },
  {
    num: 15,
    title: "Fitness Goal",
    type: "Dropdown",
    required: false,
    crmField: "Fitness Goal",
    notes: "Options: Weight Loss, Muscle Gain, Endurance, General Fitness, Flexibility, Body Recomposition",
  },
  {
    num: 16,
    title: "Activity Level",
    type: "Dropdown",
    required: false,
    crmField: "Activity Level",
    notes: "Options: Sedentary, Lightly Active, Moderately Active, Very Active",
  },
  {
    num: 17,
    title: "Residential Address",
    type: "Paragraph / Long answer",
    required: false,
    crmField: "Address",
    notes: "Street address, area, and city.",
  },
  {
    num: 18,
    title: "Occupation",
    type: "Short answer",
    required: false,
    crmField: "Occupation",
    notes: "Member profession or occupation.",
  },
  {
    num: 19,
    title: "Medical Conditions / Injuries",
    type: "Paragraph / Long answer",
    required: false,
    crmField: "Medical Conditions",
    notes: "Any prior surgeries, injuries, or conditions trainers should be aware of.",
  },
  {
    num: 20,
    title: "Additional Notes / Requirements",
    type: "Paragraph / Long answer",
    required: false,
    crmField: "Notes / Bio",
    notes: "Any special notes or training preferences.",
  },
];

export function GoogleFormTemplateModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    googleFormUrl: "",
    googleSheetUrl: "",
    configuredBy: "",
  });
  const [formUrlInput, setFormUrlInput] = useState("");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState("guide"); // 'guide' | 'workflow' | 'settings'
  const [isDownloading, setIsDownloading] = useState(null); // 'xlsx' | 'csv' | null

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await getImportConfig();
      if (res?.data) {
        setConfig(res.data);
        setFormUrlInput(res.data.googleFormUrl || "");
      }
    } catch {
      // ignore
    }
  };

  const handleSaveUrl = async () => {
    if (!formUrlInput.trim()) {
      toast.error("Please enter a valid Google Form URL.");
      return;
    }
    setIsSavingUrl(true);
    try {
      const res = await updateImportConfig({ googleFormUrl: formUrlInput.trim() });
      if (res?.data) {
        setConfig((prev) => ({ ...prev, ...res.data }));
      }
      setIsEditingUrl(false);
      toast.success("Google Form template URL updated successfully!");
    } catch (e) {
      toast.error(e?.message || "Failed to save Google Form URL.");
    } finally {
      setIsSavingUrl(false);
    }
  };

  const activeFormUrl =
    config.googleFormUrl ||
    "https://docs.google.com/forms/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/viewform";

  // Create a /copy duplicate URL if it is a google docs link
  const duplicateUrl = activeFormUrl.includes("/viewform")
    ? activeFormUrl.replace("/viewform", "/copy")
    : activeFormUrl.includes("/edit")
      ? activeFormUrl.replace("/edit", "/copy")
      : activeFormUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(duplicateUrl);
    setCopiedLink(true);
    toast.success("Duplicable Google Form template link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Please complete your gym membership registration for The Strength Way using our official registration form: ${activeFormUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleDownload = async (format) => {
    setIsDownloading(format);
    try {
      await downloadImportTemplate(format);
      toast.success(`Member Import Template (${format.toUpperCase()}) downloaded!`);
    } catch (e) {
      toast.error(e?.message || `Failed to download ${format.toUpperCase()} template.`);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="3xl">
      <FormModalHeader
        title="Google Form Member Registration Template"
        subtitle="Share a standardized Google Form with existing members, collect responses in Google Sheets, and import them directly into the CRM."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <Sparkles size={11} /> Auto-Mapped Template
          </span>
        }
        icon={FileSpreadsheet}
        onClose={onClose}
      />

      <FormModalBody className="space-y-5">
        {/* Quick Action Banner */}
        <div className="p-4.5 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/60 dark:border-blue-900/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-blue-950 dark:text-blue-100">
                Standardized Registration Form
              </h4>
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded-md">
                Ready to Duplicate & Share
              </span>
            </div>
            <p className="text-xs text-blue-900/80 dark:text-blue-200/70 leading-relaxed max-w-xl">
              Members fill this form externally without logging into the CRM. Question names exactly match CRM import fields so Google Sheets responses map automatically!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={duplicateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink size={13} />
              <span>Open & Copy Form</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-card hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border text-xs font-medium gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`px-3.5 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "guide"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Question Field Guide (20 Fields)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            className={`px-3.5 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "workflow"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            How It Works (Workflow)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom Form Link Settings
          </button>
        </div>

        {/* TAB 1: FIELD GUIDE */}
        {activeTab === "guide" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Standard question titles configured for 100% automatic header mapping:
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload("xlsx")}
                  disabled={isDownloading === "xlsx"}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors cursor-pointer"
                >
                  <Download size={12} />
                  <span>{isDownloading === "xlsx" ? "Downloading..." : "Download Excel (.xlsx)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("csv")}
                  disabled={isDownloading === "csv"}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors cursor-pointer"
                >
                  <Download size={12} />
                  <span>{isDownloading === "csv" ? "Downloading..." : "Download CSV (.csv)"}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs max-h-[380px] overflow-y-auto no-scrollbar shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] sticky top-0 border-b border-border z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Standard Question Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Required?</th>
                    <th className="py-2.5 px-3">Maps to CRM Field</th>
                    <th className="py-2.5 px-3">Notes & Recommended Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-normal">
                  {STANDARD_QUESTIONS.map((q) => (
                    <tr key={q.num} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                        {q.num}
                      </td>
                      <td className="py-2 px-3 font-semibold text-foreground whitespace-nowrap">
                        {q.title}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        {q.type}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {q.required ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                            Required
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        {q.crmField}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-[11px] leading-relaxed">
                        {q.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <Info size={15} className="shrink-0 mt-0.5" />
              <p>
                <strong>Tip for Dropdowns:</strong> Use dropdown menus in Google Forms for <em>Membership Plan</em> and <em>Batch</em> to ensure members select existing names accurately. This prevents misspellings and allows 100% automatic plan and batch assignment during import!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: WORKFLOW */}
        {activeTab === "workflow" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h4 className="font-bold text-foreground text-sm">Open & Duplicate Template</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Click <strong>Open & Copy Form</strong> above. Google Forms will make an editable copy in your Google Drive where you can adjust your gym name, logo, and active batch timings.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h4 className="font-bold text-foreground text-sm">Share Externally</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Share your copied Google Form link with members via WhatsApp, SMS, or email. Members can fill in their details on their phone without needing to login to the Gym CRM.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h4 className="font-bold text-foreground text-sm">Download Google Sheets File</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  In your Google Form, click the <strong>Responses</strong> tab and click <strong>View in Sheets</strong>. Then go to <strong>File → Download → Microsoft Excel (.xlsx)</strong> or <strong>CSV (.csv)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <h4 className="font-bold text-foreground text-sm">Upload & Smart Import in CRM</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Click <strong>Import Members</strong> in the CRM. The system auto-maps headers, identifies duplicates/existing members, validates plans/batches, and allows 1-click bulk import!
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold text-xs">Safety & Privacy First</h5>
                <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
                  The form never asks for payment card numbers, bank credentials, or passwords. Imported records do not automatically mark fees paid or activate memberships prematurely, keeping your financial audits clean and accurate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM URL SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground text-sm">Configured Form Template Link</h4>
                  <p className="text-muted-foreground text-xs">
                    Configure the exact Google Form URL used by your gym administrators.
                  </p>
                </div>
                {!isEditingUrl ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                  >
                    <Settings2 size={13} />
                    <span>Change URL</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(false)}
                    className="px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium cursor-pointer text-muted-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingUrl ? (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/80 font-mono text-[11px] break-all select-all text-foreground">
                  {activeFormUrl}
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="url"
                    value={formUrlInput}
                    onChange={(e) => setFormUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSavingUrl}
                      onClick={handleSaveUrl}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingUrl ? "Saving..." : "Save Google Form URL"}
                    </button>
                  </div>
                </div>
              )}

              {config.configuredBy && (
                <p className="text-[11px] text-muted-foreground">
                  Last updated by: <span className="font-medium text-foreground">{config.configuredBy}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText="Close"
        extraLeft={
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <HelpCircle size={14} className="text-blue-500" />
            <span>Admins can download the blank template anytime from Member Import.</span>
          </div>
        }
      />
    </FormModal>
  );
}
