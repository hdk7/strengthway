/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  UploadCloud,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { AdminMemberRegistrationModal } from "./MembersRegistration";
import { getMembers, toggleMemberStatus } from "@/lib/membersService";
import { createInquiry } from "@/lib/inquiriesService";
import { DataTable } from "@/components/table";
import { isAdmin } from "@/auth/currentUser";
import MemberMetricsRow from "./MemberMetricsRow";
import MemberTableRow from "./MemberTableRow";
import { SearchInput } from "@/components/ui";
import { MemberImportModal } from "./components";

const MEMBER_COLUMNS = [
  { header: "Member ID", width: "w-28" },
  { header: "Member" },
  { header: "Contact" },
  { header: "Physical Stats" },
  { header: "Emergency Contact" },
  { header: "Status", align: "center" },
];

export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInquiryForConfirm, setSelectedInquiryForConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Bulk import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
      .then((data) => {
        if (!cancelled) setMembers(data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load members.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = async (memberId) => {
    setTogglingId(memberId);
    try {
      const updated = await toggleMemberStatus(memberId);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: updated.status } : m)),
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
      prev.map((m) => (m.id === convertedMember.id ? convertedMember : m)),
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
      (m) => m.status === "Lead" || m.status === "Inquiry",
    ).length;
    const archived = members.filter((m) => m.isDeleted).length;
    return {
      total,
      active,
      inquiries,
      archived,
    };
  }, [members]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Members
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage members, profiles, status, bulk imports, and registrations.
          </p>
        </div>

        {/* Member Action Controls (Admin Only) */}
        {isAdmin() && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Bulk Import Members */}
            <button
              type="button"
              id="import-members-btn"
              onClick={() => setIsImportModalOpen(true)}
              title="Upload Excel or CSV file to import members in bulk"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-3.5 sm:px-4 py-2 min-h-[38px] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <UploadCloud size={15} className="text-emerald-500" />
              <span>Import Members</span>
            </button>

            {/* Add Member CTA Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 min-h-[38px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        )}
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
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, email, or ID…"
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
          <button
            onClick={fetchMembers}
            className="ml-auto text-xs font-semibold underline cursor-pointer hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Standardized Members Data Table */}
      <DataTable
        columns={MEMBER_COLUMNS}
        data={filteredMembers}
        pageSize={pageSize}
        currentPage={safePage}
        onPageChange={setCurrentPage}
        totalItems={filteredMembers.length}
        totalPages={totalPages}
        itemLabel="members"
        loading={loading}
        loadingRowsCount={7}
        showToolbar={false}
        emptyIcon={Users}
        emptyTitle="No members found"
        emptyMessage={
          searchQuery
            ? "Try adjusting your search query or filters."
            : statusFilter === "Archived"
              ? "There are no soft-deleted members in the archive."
              : statusFilter === "Lead" || statusFilter === "Inquiry"
                ? "No pending inquiries found."
                : "Get started by adding your first gym member."
        }
        emptyAction={
          !searchQuery &&
          statusFilter !== "Archived" &&
          statusFilter !== "Lead" &&
          statusFilter !== "Inquiry" ? (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-background shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Add Member</span>
            </button>
          ) : null
        }
        renderRow={(member) => (
          <MemberTableRow
            key={member.id}
            member={member}
            onNavigate={navigate}
            onOpenConfirmModal={handleOpenConfirmModal}
            onToggleStatus={handleToggleStatus}
            togglingId={togglingId}
            onMoveToInquiry={handleMoveToInquiry}
          />
        )}
        className="flex-1 min-h-0"
      />

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

      {/* --- MEMBER BULK IMPORT MODAL --- */}
      <MemberImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchMembers();
        }}
      />
    </div>
  );
}
