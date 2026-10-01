/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  Search,
  Mail,
  Phone,
  Trash2,
  Eye,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from "@/lib/inquiriesService";
import { AdminMemberRegistrationModal } from "@/pages/trainers-members/members/MembersRegistration";
import { InquiryProfileModal } from "@/pages/inquiries/InquiryProfileModal";
import { LogInquiryModal } from "@/pages/inquiries/LogInquiryModal";
import { Pagination } from "@/components/table";

const STATUS_OPTIONS = ["All", "Inquiry", "Contacted", "Converted", "Archived"];

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryToConvert, setInquiryToConvert] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInquiries();
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
      setError(err.message || "Failed to load inquiries from server.");
      toast.error("Failed to load inquiries from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateInquiryStatus(id, newStatus);
      if (updated) {
        setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (selectedInquiry?.id === id) setSelectedInquiry(updated);
        toast.success(`Inquiry marked as ${newStatus}.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update inquiry status.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete inquiry from ${name || "this user"}?`)) {
      try {
        await deleteInquiry(id);
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        toast.success("Inquiry deleted successfully.");
      } catch (err) {
        toast.error(err.message || "Failed to delete inquiry.");
      }
    }
  };

  const handleOpenRegistration = (inq) => {
    setInquiryToConvert(inq);
  };

  const handleRegistrationSuccess = async (registeredMember) => {
    if (inquiryToConvert) {
      try {
        await updateInquiryStatus(inquiryToConvert.id, "Converted");
        await loadInquiries();
      } catch (err) {
        console.error("Failed to update status on conversion:", err);
      }
    }
    setInquiryToConvert(null);
    toast.success(
      `${registeredMember?.firstName || "Inquiry"} successfully converted & registered as an active Member!`,
      {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      },
    );
  };

  const stats = useMemo(() => {
    const total = inquiries.length;
    const pendingInquiries = inquiries.filter(
      (i) => i.status === "Inquiry" || i.status === "Lead" || i.status === "New" || !i.status,
    ).length;
    const contacted = inquiries.filter((i) => i.status === "Contacted").length;
    const converted = inquiries.filter((i) => i.status === "Converted").length;
    return { total, pendingInquiries, contacted, converted };
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((i) => {
      if (statusFilter !== "All") {
        if (statusFilter === "Inquiry" || statusFilter === "Lead") {
          if (
            i.status !== "Inquiry" &&
            i.status !== "Lead" &&
            i.status !== "New" &&
            i.status
          )
            return false;
        } else if (i.status !== statusFilter) {
          return false;
        }
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        i.name?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.mobile?.toLowerCase().includes(q) ||
        i.subject?.toLowerCase().includes(q) ||
        i.message?.toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedInquiries = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredInquiries.slice(start, start + pageSize);
  }, [filteredInquiries, safePage, pageSize]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-display">
            Customer Inquiries
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Inbound queries stored as inquiries. Convert inquiries directly into active gym members.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-background shadow-xs hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>New Inquiry</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadInquiries}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-2.5 py-0.5 font-semibold text-destructive-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 shrink-0">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <Inbox size={15} />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{stats.total}</div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Lifetime inquiries</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Inquiries</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-amber-400">
            {stats.pendingInquiries}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Pending inquiries</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Contacted</span>
            <MessageSquare size={15} className="text-blue-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-blue-400">{stats.contacted}</div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">In communication</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Converted</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-400">{stats.converted}</div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Active members</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {status}
              {status === "Inquiry" && stats.pendingInquiries > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-black font-extrabold">
                  {stats.pendingInquiries}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Inquiries Table Container - Independent scroll so pagination remains fixed at bottom */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        {isLoading ? (
          <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col justify-center">
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 px-4 bg-card rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-28 bg-muted rounded hidden sm:block" />
                  <div className="h-4 w-44 bg-muted rounded hidden md:block" />
                  <div className="h-6 w-16 bg-muted rounded-full" />
                  <div className="h-7 w-20 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border/50">
            <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No inquiries found</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? "Try adjusting your search query or filter selection."
                : "Submissions from your website's inquiry form will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Inquiry ID</th>
                  <th className="py-2.5 px-4 sm:px-5">Client</th>
                  <th className="py-2.5 px-4 sm:px-5">Contact</th>
                  <th className="py-2.5 px-4 sm:px-5">Subject & Message</th>
                  <th className="py-2.5 px-4 sm:px-5">Received</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Status</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {paginatedInquiries.map((inq) => {
                  const dateLabel = inq.createdAt
                    ? new Date(inq.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const displayStatus =
                    inq.status === "Lead" || inq.status === "New" || !inq.status
                      ? "Inquiry"
                      : inq.status;

                  const rawId = inq.id ? String(inq.id) : "";
                  const displayId = rawId.length > 7 ? rawId.slice(-6).toUpperCase() : rawId;

                  return (
                    <tr key={inq.id} className="group transition-all duration-150 hover:translate-y-[-1px]">
                      {/* Inquiry ID badge */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40">
                          #{displayId}
                        </span>
                      </td>

                      {/* Client / Sender */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div
                          onClick={() => navigate(`/admin/inquiries/${inq.id}`)}
                          className="flex items-center gap-2.5 cursor-pointer group/item"
                          title="Click to view inquiry profile page"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent group-hover/item:scale-105 text-xs font-extrabold transition-transform">
                            {inq.name ? inq.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-accent group-hover/item:underline transition-colors">
                              <span>{inq.name || "Anonymous Inquiry"}</span>
                              {inq.gender && (
                                <span className="rounded-full bg-accent/30 px-1.5 py-0.2 text-[9px] text-muted-foreground font-normal">
                                  {inq.gender}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="space-y-0.5">
                          {inq.mobile ? (
                            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                              <Phone size={12} className="text-amber-600/80 dark:text-amber-400 shrink-0" />
                              <span>{inq.mobile}</span>
                            </div>
                          ) : null}
                          {inq.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail size={12} className="text-muted-foreground/70 shrink-0" />
                              <span className="truncate max-w-[160px]">{inq.email}</span>
                            </div>
                          ) : null}
                          {!inq.mobile && !inq.email && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Subject & Message */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors max-w-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {inq.subject || "General Inquiry"}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {inq.message || inq.address || "No message body."}
                          </p>
                        </div>
                      </td>

                      {/* Received */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-xs text-muted-foreground whitespace-nowrap">
                        {dateLabel}
                      </td>

                      {/* Status Badge */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex items-center">
                          <select
                            value={displayStatus}
                            onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border cursor-pointer focus:outline-none transition-all ${
                              displayStatus === "Converted"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                                : displayStatus === "Contacted"
                                ? "bg-blue-50 text-blue-600 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
                                : displayStatus === "Inquiry"
                                ? "bg-amber-50 text-amber-600 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
                                : "bg-muted/60 text-muted-foreground border-border/60"
                            }`}
                          >
                            <option value="Inquiry">● Inquiry</option>
                            <option value="Contacted">● Contacted</option>
                            <option value="Converted">● Converted</option>
                            <option value="Archived">● Archived</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inq.status !== "Converted" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRegistration(inq)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-[11px] font-semibold shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Open member registration form with auto-filled details"
                            >
                              <UserCheck size={12} />
                              <span className="hidden sm:inline">Convert Member</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                              <CheckCircle2 size={11} />
                              <span>Member</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/inquiries/${inq.id}`);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="View Full Profile Page"
                            aria-label="View Full Profile Page"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(inq.id, inq.name)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls - Fixed in place at bottom of viewport */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredInquiries.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        itemLabel="inquiries"
        compact
        className="shrink-0 mt-auto"
      />

      {/* --- LOG NEW INQUIRY PROFILE FORM MODAL --- */}
      <LogInquiryModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={() => loadInquiries()}
      />

      {/* --- INQUIRY PROFILE MODAL --- */}
      <InquiryProfileModal
        isOpen={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        inquiry={selectedInquiry}
        onStatusChange={handleStatusChange}
        onConvert={(inq) => {
          setSelectedInquiry(null);
          handleOpenRegistration(inq);
        }}
        onDelete={(id, name) => {
          handleDelete(id, name);
        }}
      />

      {/* --- MEMBER REGISTRATION MODAL WITH AUTO-FILLED DATA --- */}
      {inquiryToConvert && (
        <AdminMemberRegistrationModal
          isOpen={Boolean(inquiryToConvert)}
          onClose={() => setInquiryToConvert(null)}
          onSuccess={handleRegistrationSuccess}
          leadToConfirm={{
            id: inquiryToConvert.id,
            name: inquiryToConvert.name,
            gender: inquiryToConvert.gender,
            mobile: inquiryToConvert.mobile,
            email: inquiryToConvert.email,
            address: inquiryToConvert.address,
            bio: inquiryToConvert.message
              ? `Inquiry (${inquiryToConvert.subject || "General"}): ${inquiryToConvert.message}`
              : "Prospective athlete via website inquiry.",
            status: "Inquiry",
          }}
        />
      )}
    </div>
  );
}
