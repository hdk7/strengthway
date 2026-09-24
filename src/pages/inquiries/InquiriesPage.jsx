import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  Search,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Eye,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
  UserPlus,
  Plus,
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

const STATUS_OPTIONS = ["All", "Inquiry", "Contacted", "Converted", "Archived"];

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryToConvert, setInquiryToConvert] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  useEffect(() => {
    loadInquiries();
    window.addEventListener("storage", loadInquiries);
    return () => window.removeEventListener("storage", loadInquiries);
  }, []);

  const loadInquiries = () => {
    setInquiries(getInquiries());
  };

  const handleStatusChange = (id, newStatus) => {
    try {
      const updated = updateInquiryStatus(id, newStatus);
      if (updated) {
        setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (selectedInquiry?.id === id) setSelectedInquiry(updated);
        toast.success(`Inquiry marked as ${newStatus}.`);
      }
    } catch {
      toast.error("Failed to update inquiry status.");
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete inquiry from ${name || "this user"}?`)) {
      deleteInquiry(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      toast.success("Inquiry deleted successfully.");
    }
  };

  const handleOpenRegistration = (inq) => {
    setInquiryToConvert(inq);
  };

  const handleRegistrationSuccess = (registeredMember) => {
    if (inquiryToConvert) {
      updateInquiryStatus(inquiryToConvert.id, "Converted");
      loadInquiries();
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            Customer Inquiries
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Inbound queries stored as inquiries. Convert inquiries directly into active gym members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Inquiry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Inbox size={18} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Lifetime inquiries</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Inquiries</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-400">
            {stats.pendingInquiries}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending inquiries</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Contacted</span>
            <MessageSquare size={18} className="text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-400">{stats.contacted}</div>
          <p className="mt-1 text-xs text-muted-foreground">In communication</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Converted</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">{stats.converted}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active members</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-foreground text-background shadow-sm"
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
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Inquiries Table */}
      {filteredInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No inquiries found</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
            {searchQuery
              ? "Try adjusting your search query or filter selection."
              : "Submissions from your website's inquiry form will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Inquiry / Sender</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Subject & Message</th>
                <th className="px-5 py-3.5">Received</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredInquiries.map((inq) => {
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

                return (
                  <tr key={inq.id} className="hover:bg-muted/20 transition-colors">
                    {/* Sender */}
                    <td className="px-5 py-4">
                      <div
                        onClick={() => navigate(`/admin/inquiries/${inq.id}`)}
                        className="flex items-center gap-3 cursor-pointer group"
                        title="Click to view inquiry profile page"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent group-hover:scale-105 text-xs font-extrabold transition-transform">
                          {inq.name ? inq.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm flex items-center gap-2 group-hover:text-accent group-hover:underline transition-colors">
                            <span>{inq.name || "Anonymous Inquiry"}</span>
                            {inq.gender && (
                              <span className="rounded-full bg-accent/40 px-2 py-0.2 text-[10px] text-muted-foreground font-normal">
                                {inq.gender}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {inq.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 text-xs space-y-1">
                      {inq.mobile ? (
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Phone size={12} className="text-muted-foreground shrink-0" />
                          <span>{inq.mobile}</span>
                        </div>
                      ) : null}
                      {inq.email ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail size={12} className="text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[170px]">{inq.email}</span>
                        </div>
                      ) : null}
                      {!inq.mobile && !inq.email && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Message Preview */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {inq.subject || "General Inquiry"}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {inq.message || inq.address || "No message body."}
                        </p>
                      </div>
                    </td>

                    {/* Received */}
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {dateLabel}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <select
                        value={displayStatus}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer focus:outline-none ${
                          displayStatus === "Inquiry"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : displayStatus === "Contacted"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : displayStatus === "Converted"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <option value="Inquiry">Inquiry</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Convert Member Button */}
                        {inq.status !== "Converted" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenRegistration(inq)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Open member registration form with auto-filled details"
                          >
                            <UserCheck size={13} />
                            <span>Convert Member</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={13} />
                            <span>Member</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/inquiries/${inq.id}`);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="View Full Profile Page"
                          aria-label="View Full Profile Page"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(inq.id, inq.name)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={15} />
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
