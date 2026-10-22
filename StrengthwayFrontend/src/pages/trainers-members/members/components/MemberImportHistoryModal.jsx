/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  History,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  User,
} from "lucide-react";
import { SearchInput } from "@/components/ui";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import {
  getImportHistory,
  downloadErrorReport,
} from "@/lib/memberImportService";

export function MemberImportHistoryModal({ isOpen, onClose }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getImportHistory(50);
      if (res?.data) {
        setHistoryList(res.data);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to load import history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorCsv = async (importId) => {
    setDownloadingId(importId);
    try {
      await downloadErrorReport(importId);
      toast.success("Error report CSV downloaded successfully!");
    } catch (e) {
      toast.error(e?.message || "Failed to download error report.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredHistory = historyList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const id = (item.importId || "").toLowerCase();
    const file = (item.sourceFilename || "").toLowerCase();
    const admin = (item.adminName || "").toLowerCase();
    return id.includes(q) || file.includes(q) || admin.includes(q);
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="3xl">
      <FormModalHeader
        title="Member Import Audit History"
        subtitle="Review past bulk imports, tracked statistics, and download recovery reports for rows that needed attention."
        icon={History}
        onClose={onClose}
      />

      <FormModalBody className="space-y-4">
        {/* Search & Refresh Bar */}
        <div className="flex items-center justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by import ID, filename, admin..."
            className="flex-1 max-w-sm"
          />

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* History Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card text-xs max-h-[440px] overflow-y-auto no-scrollbar shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] sticky top-0 border-b border-border z-10">
              <tr>
                <th className="py-2.5 px-3">Import ID & Date</th>
                <th className="py-2.5 px-3">Admin</th>
                <th className="py-2.5 px-3">Source File</th>
                <th className="py-2.5 px-3 text-center">Results</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <RefreshCw size={20} className="mx-auto animate-spin mb-2 text-blue-500" />
                    <span>Loading past imports...</span>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-foreground">No import records found</p>
                    <p className="text-[11px] mt-0.5">
                      Completed member imports will appear here automatically with audit logs.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const dateStr = item.createdAt
                    ? new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const hasErrors =
                    (item.failedCount || 0) > 0 || (item.errorLog && item.errorLog.length > 0);

                  return (
                    <tr key={item._id || item.importId} className="hover:bg-muted/30 transition-colors">
                      {/* ID & Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-foreground text-xs">
                          {item.importId}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Clock size={11} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Admin */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User size={13} className="text-muted-foreground" />
                          <span>{item.adminName || "Admin"}</span>
                        </div>
                        {item.adminEmail && (
                          <div className="text-[11px] text-muted-foreground ml-5">
                            {item.adminEmail}
                          </div>
                        )}
                      </td>

                      {/* File */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-foreground max-w-[160px] truncate" title={item.sourceFilename}>
                          {item.sourceFilename}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.totalRows} row{item.totalRows === 1 ? "" : "s"}
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400" title="Created">
                            +{item.createdCount || 0} new
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-blue-600 dark:text-blue-400" title="Updated">
                            {item.updatedCount || 0} upd
                          </span>
                          {(item.skippedCount || 0) > 0 && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-slate-500" title="Skipped">
                                {item.skippedCount} skip
                              </span>
                            </>
                          )}
                          {(item.failedCount || 0) > 0 && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-rose-600 font-bold" title="Failed">
                                {item.failedCount} fail
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        {item.status === "completed" && !hasErrors ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 size={11} /> Success
                          </span>
                        ) : item.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                            <XCircle size={11} /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            <AlertTriangle size={11} /> Partial
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        {hasErrors ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadErrorCsv(item.importId)}
                            disabled={downloadingId === item.importId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Download size={11} />
                            <span>{downloadingId === item.importId ? "Saving..." : "Error CSV"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Clean import</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText="Close"
      />
    </FormModal>
  );
}
