/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminMemberRegistrationModal } from "./MembersRegistration";
import { getMembers, toggleMemberStatus } from "@/lib/membersService";
import { createInquiry } from "@/lib/inquiriesService";
import { Pagination } from "@/components/table";
import MemberMetricsRow from "./MemberMetricsRow";
import MemberTableRow from "./MemberTableRow";

export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInquiryForConfirm, setSelectedInquiryForConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchMembers = () => {
    setLoading(true);
    setError(null);
    getMembers(true)
      .then((data) => setMembers(data || []))
      .catch((e) => setError(e?.message || "Failed to load members."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMembers(true)
      .then((data) => { if (!cancelled) setMembers(data || []); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Failed to load members."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = async (memberId) => {
    setTogglingId(memberId);
    try {
      const updated = await toggleMemberStatus(memberId);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: updated.status } : m))
      );
      toast.success(`Member status updated to ${updated.status}.`);
    } catch (e) {
      toast.error(e?.message || "Failed to update member status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenConfirmModal = (inquiry) => {
    setSelectedInquiryForConfirm(inquiry);
  };

  const handleConfirmSuccess = (convertedMember) => {
    setSelectedInquiryForConfirm(null);
    setMembers((prev) =>
      prev.map((m) => (m.id === convertedMember.id ? convertedMember : m))
    );
    toast.success(`Inquiry for ${convertedMember.firstName} converted to active Member.`);
  };

  const handleMoveToInquiry = async (member) => {
    try {
      const name =
        `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
        member.name ||
        "Archived Member";
      const created = await createInquiry({
        name,
        gender: member.gender || "Male",
        mobile: member.mobile || member.phone || "",
        email: member.email || "",
        address: member.address || "",
        subject: "Restored from Archived Member",
        message: member.bio || "Restored from archive to restart workflow from the beginning.",
        status: "Inquiry",
      });
      window.dispatchEvent(new CustomEvent("inquiry-updated", { detail: created }));
      toast.success(
        `${name} moved to Customer Inquiries to start workflow from the beginning.`,
      );
      navigate("/admin/inquiries");
    } catch (err) {
      toast.error(err?.message || "Failed to move member to inquiries.");
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (statusFilter === "Archived") {
        if (!member.isDeleted) return false;
      } else {
        if (member.isDeleted) return false;
        if (statusFilter !== "All") {
          if (statusFilter === "Active" && member.status !== "Active") return false;
          if (statusFilter === "Inactive" && member.status !== "Inactive") return false;
          if (
            (statusFilter === "Lead" || statusFilter === "Inquiry") &&
            member.status !== "Lead" &&
            member.status !== "Inquiry" &&
            member.status !== "Contacted"
          )
            return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
        const mobile = (member.mobile || "").toLowerCase();
        const email = (member.email || "").toLowerCase();
        const id = (member.id || "").toLowerCase();
        return (
          fullName.includes(q) ||
          mobile.includes(q) ||
          email.includes(q) ||
          id.includes(q)
        );
      }
      return true;
    });
  }, [members, statusFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, safePage, pageSize]);

  const stats = useMemo(() => {
    const activeList = members.filter((m) => !m.isDeleted);
    const total = activeList.length;
    const active = activeList.filter((m) => m.status === "Active").length;
    const inquiries = activeList.filter(
      (m) => m.status === "Lead" || m.status === "Inquiry"
    ).length;
    const withMedical = activeList.filter((m) => m.medicalDoc || m.medicalDocName).length;
    const archived = members.filter((m) => m.isDeleted).length;
    return {
      total,
      active,
      inquiries,
      withMedical,
      archived,
    };
  }, [members]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Members
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage members, profiles, status, edits, and registrations.
          </p>
        </div>

        {/* Add Member CTA Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <MemberMetricsRow
        stats={stats}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, email, or ID…"
            className="w-full h-8.5 sm:h-9 rounded-xl border border-border bg-card pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-0.5 text-xs">
            <Filter size={13} className="ml-1 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setStatusFilter("All")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "All"
                  ? "bg-primary text-background font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Active")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "Active"
                  ? "bg-primary text-background font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Inactive")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "Inactive"
                  ? "bg-primary text-background font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inactive
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Archived")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "Archived"
                  ? "bg-destructive text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Archived ({stats.archived})
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shrink-0">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
          <button onClick={fetchMembers} className="ml-auto text-xs font-semibold underline cursor-pointer hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1 min-h-0 flex flex-col pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs select-none">
              <tr className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-4 sm:px-5">Member ID</th>
                <th className="py-2.5 px-4 sm:px-5">Member</th>
                <th className="py-2.5 px-4 sm:px-5">Contact</th>
                <th className="py-2.5 px-4 sm:px-5">Physical Stats</th>
                <th className="py-2.5 px-4 sm:px-5">Emergency Contact</th>
                <th className="py-2.5 px-4 sm:px-5">Medical Doc</th>
                <th className="py-2.5 px-4 sm:px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center bg-card rounded-2xl border border-border/50 shadow-xs">
                    <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
                    <p className="mt-2 text-xs text-muted-foreground">Loading members…</p>
                  </td>
                </tr>
              ) : paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <MemberTableRow
                    key={member.id}
                    member={member}
                    onNavigate={navigate}
                    onOpenConfirmModal={handleOpenConfirmModal}
                    onToggleStatus={handleToggleStatus}
                    togglingId={togglingId}
                    onMoveToInquiry={handleMoveToInquiry}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={36} className="text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No members found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery
                           ? "Try adjusting your search query or filters."
                          : statusFilter === "Archived"
                            ? "There are no soft-deleted members in the archive."
                            : statusFilter === "Lead" || statusFilter === "Inquiry"
                              ? "No pending inquiries found."
                              : "Get started by adding your first gym member."}
                      </p>
                      {!searchQuery &&
                        statusFilter !== "Archived" &&
                        statusFilter !== "Lead" &&
                        statusFilter !== "Inquiry" && (
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-background shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                          >
                            <UserPlus size={15} />
                            <span>Add Member</span>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="members"
          compact
          className="shrink-0 mt-auto"
        />
      </div>

      {/* --- ADD NEW MEMBER MODAL --- */}
      <AdminMemberRegistrationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchMembers();
        }}
      />

      {/* --- CONFIRM INQUIRY CONVERSION MODAL --- */}
      {selectedInquiryForConfirm && (
        <AdminMemberRegistrationModal
          isOpen={Boolean(selectedInquiryForConfirm)}
          onClose={() => setSelectedInquiryForConfirm(null)}
          onSuccess={handleConfirmSuccess}
          leadToConfirm={selectedInquiryForConfirm}
        />
      )}
    </div>
  );
}
