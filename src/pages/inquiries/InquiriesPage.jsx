/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInquiries,
  updateInquiryStatus,
  recordInquiryContact,
  archiveInquiry,
  deleteInquiry,
} from "@/lib/inquiriesService";
import { AdminMemberRegistrationModal } from "@/pages/trainers-members/members/MembersRegistration";
import { InquiryProfileModal } from "@/pages/inquiries/InquiryProfileModal";
import { LogInquiryModal } from "@/pages/inquiries/LogInquiryModal";
import ContactLeadModal from "@/pages/inquiries/ContactLeadModal";
import { Pagination } from "@/components/table";
import InquiryStatsCards from "./InquiryStatsCards";
import InquiryTableRow from "./InquiryTableRow";

const STATUS_OPTIONS = ["All", "Inquiry", "Contacted", "Converted", "Archived"];

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryToContact, setInquiryToContact] = useState(null);
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

  const handleContactSubmit = async (contactData) => {
    if (!inquiryToContact) return;
    try {
      const updated = await recordInquiryContact(inquiryToContact.id, contactData);
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === inquiryToContact.id
            ? {
                ...i,
                status: "Contacted",
                contactDetails: updated?.contactDetails || contactData,
              }
            : i,
        ),
      );
      toast.success(
        `Contact recorded for ${inquiryToContact.name || "prospect"}. Status changed to Contacted.`,
      );
      setInquiryToContact(null);
    } catch (err) {
      toast.error(err?.message || "Failed to record contact interaction.");
      throw err;
    }
  };

  const handleArchiveInquiry = async (inq) => {
    if (!window.confirm(`Move inquiry from "${inq.name || "prospect"}" to Archived?`)) return;
    try {
      await archiveInquiry(inq.id, "Archived by staff after contact interaction");
      setInquiries((prev) =>
        prev.map((i) => (i.id === inq.id ? { ...i, status: "Archived" } : i)),
      );
      toast.success(`Inquiry for ${inq.name || "prospect"} moved to Archived.`);
    } catch (err) {
      toast.error(err?.message || "Failed to archive inquiry.");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the inquiry for "${name || "Anonymous"}"?`,
      )
    ) {
      return;
    }
    try {
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      toast.success("Inquiry deleted successfully.");
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    } catch {
      toast.error("Failed to delete inquiry.");
    }
  };

  const handleOpenRegistration = (inq) => {
    setInquiryToConvert(inq);
  };

  const handleRegistrationSuccess = async (registeredMember) => {
    if (inquiryToConvert) {
      try {
        await updateInquiryStatus(inquiryToConvert.id, "Converted", {
          convertedMemberId: registeredMember?.id,
        });
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryToConvert.id
              ? {
                  ...inq,
                  status: "Converted",
                  convertedMemberId: registeredMember?.id,
                  convertedAt: new Date().toISOString(),
                }
              : inq,
          ),
        );
      } catch (err) {
        console.error("Failed to update status on conversion:", err);
      }
    }
    setInquiryToConvert(null);
    toast.success(
      `${registeredMember?.firstName || inquiryToConvert?.name || "Inquiry"} successfully converted to Member!`,
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
        i.gender?.toLowerCase().includes(q) ||
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

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shrink-0">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button
            onClick={loadInquiries}
            className="ml-auto underline font-bold hover:text-foreground cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <InquiryStatsCards stats={stats} />

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

      {/* Inquiries Table Container */}
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
                  <th className="py-2.5 px-4 sm:px-5">Gender</th>
                  <th className="py-2.5 px-4 sm:px-5">Contact</th>
                  <th className="py-2.5 px-4 sm:px-5">Subject & Message</th>
                  <th className="py-2.5 px-4 sm:px-5">Received</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {paginatedInquiries.map((inq) => (
                  <InquiryTableRow
                    key={inq.id}
                    inq={inq}
                    onNavigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
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

      {/* --- CONTACT LEAD MODAL --- */}
      <ContactLeadModal
        isOpen={Boolean(inquiryToContact)}
        onClose={() => setInquiryToContact(null)}
        onSubmit={handleContactSubmit}
        leadName={inquiryToContact?.name}
        leadPhone={inquiryToContact?.mobile}
        leadEmail={inquiryToContact?.email}
      />

      {/* --- INQUIRY PROFILE MODAL --- */}
      <InquiryProfileModal
        isOpen={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        inquiry={selectedInquiry}
        onContact={(inq) => {
          setSelectedInquiry(null);
          setInquiryToContact(inq);
        }}
        onConvert={(inq) => {
          setSelectedInquiry(null);
          handleOpenRegistration(inq);
        }}
        onArchive={(inq) => {
          setSelectedInquiry(null);
          handleArchiveInquiry(inq);
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
            status: inquiryToConvert.status || "Contacted",
          }}
        />
      )}
    </div>
  );
}
