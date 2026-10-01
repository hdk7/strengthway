/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Phone,
  Mail,
  FileCheck,
  Filter,
  Archive,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminMemberRegistrationModal } from "./MembersRegistration";
import { getMembers, toggleMemberStatus } from "@/lib/membersService";
import { Pagination } from "@/components/table";

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

  // Load all members including soft-deleted ones from API
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
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
        toast.success(`Member status changed to ${updated.status}.`);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenConfirmModal = (inquiryMember) => {
    setSelectedInquiryForConfirm(inquiryMember);
  };

  const handleInquiryConfirmed = (updatedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    setSelectedInquiryForConfirm(null);
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // If filtering by Archived, show only soft-deleted records
      if (statusFilter === "Archived") {
        if (!m.isDeleted) return false;
      } else {
        // By default, exclude soft-deleted members
        if (m.isDeleted) return false;
        if (statusFilter !== "All" && m.status !== statusFilter) return false;
      }

      const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        (m.mobile && m.mobile.toLowerCase().includes(query)) ||
        (m.email && m.email.toLowerCase().includes(query)) ||
        (m.id && m.id.toLowerCase().includes(query));

      return matchesSearch;
    });
  }, [members, searchQuery, statusFilter]);

  // Reset to page 1 whenever search query or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedMembers = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, safePage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const activeList = members.filter((m) => !m.isDeleted);
    const total = activeList.length;
    const inquiries = activeList.filter((m) => m.status === "Lead" || m.status === "Inquiry").length;
    const active = activeList.filter(
      (m) =>
        m.status === "Active" ||
        (!m.status && m.status !== "Lead" && m.status !== "Inquiry"),
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
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-background shadow-xs transition-all hover:bg-primary/90 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
        {/* Total Members */}
        <div
          onClick={() => setStatusFilter("All")}
          className={`rounded-xl border bg-card p-2 sm:p-2.5 shadow-xs cursor-pointer transition-all hover:border-accent/40 ${
            statusFilter === "All" ? "border-accent ring-1 ring-accent/30" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Enrolled
            </span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {stats.total}
            </span>
            <span className="text-[11px] text-muted-foreground">Registered in gym</span>
          </div>
        </div>

        {/* Archived (Soft Deleted) */}
        <div
          onClick={() => setStatusFilter("Archived")}
          className={`rounded-xl border bg-card p-2 sm:p-2.5 shadow-xs cursor-pointer hover:border-accent/40 transition-colors ${
            statusFilter === "Archived"
              ? "border-destructive ring-1 ring-destructive/30"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Archived / Deleted
            </span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Archive size={14} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {stats.archived}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Click to view & restore
            </span>
          </div>
        </div>
      </div>

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
          {/* Status filter tabs */}
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

      {/* Members Table - Independent Scrollable Content Area */}
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
                paginatedMembers.map((member) => {
                  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
                  const initials =
                    `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
                  const isDeleted = Boolean(member.isDeleted);

                  return (
                    <tr
                      key={member.id}
                      className={`group transition-all duration-150 hover:translate-y-[-1px] ${
                        isDeleted ? "opacity-75" : ""
                      }`}
                    >
                      {/* Member ID Badge */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/70 text-foreground/85 font-mono text-xs font-semibold tracking-tight shadow-2xs">
                          #{member.id}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2.5">
                          {member.photo ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/trainers-members/members/${member.id}`)
                              }
                              title="View full member profile"
                              className="shrink-0 cursor-pointer focus:outline-none"
                            >
                              <img
                                src={member.photo}
                                alt={fullName}
                                className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full object-cover border border-border hover:scale-105 transition-all"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/trainers-members/members/${member.id}`)
                              }
                              title="View full member profile"
                              className="grid h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-bold text-xs border border-accent/20 hover:scale-105 transition-all cursor-pointer focus:outline-none"
                            >
                              {initials || "M"}
                            </button>
                          )}
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/trainers-members/members/${member.id}`)
                              }
                              className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
                            >
                              {fullName}
                            </button>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {member.planName || "Member"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Phone size={12} className="text-muted-foreground shrink-0" />
                            <span>{member.mobile || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail size={12} className="text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[170px]">{member.email || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Physical Stats */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="text-xs text-foreground">
                          {member.height || member.weight ? (
                            <span className="font-medium">
                              {member.height ? `${member.height} cm` : ""}
                              {member.height && member.weight ? " • " : ""}
                              {member.weight ? `${member.weight} kg` : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>

                      {/* Emergency Contact */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                        {member.emergencyName ? (
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold text-foreground">
                              {member.emergencyName}
                              {member.emergencyRelationship && (
                                <span className="text-[11px] text-muted-foreground ml-1">
                                  ({member.emergencyRelationship})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {member.emergencyNumber || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Medical Doc */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                        {member.medicalDoc || member.medicalDocName ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <FileCheck size={13} />
                            <span>Attached</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            <span>Archived</span>
                          </span>
                        ) : member.status === "Lead" || member.status === "Inquiry" ? (
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Inquiry</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmModal(member)}
                              title="Confirm inquiry, complete mandatory details & payment to convert to active gym member"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              <UserCheck size={12} />
                              <span>Confirm</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member.id)}
                            disabled={togglingId === member.id}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-wait border ${
                              member.status === "Inactive"
                                ? "bg-muted text-muted-foreground border-border"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.status === "Inactive" ? "bg-muted-foreground" : "bg-emerald-500"
                              }`}
                            />
                            {togglingId === member.id && <Loader2 size={10} className="animate-spin" />}
                            <span>{member.status || "Active"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                            <UserPlus size={16} />
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

        {/* Pagination Controls (5 members per page) - Fixed in place at bottom */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="members"
          compact
          className="shrink-0"
        />
      </div>

      {/* Member Add / Confirm Registration Modal */}
      <AdminMemberRegistrationModal
        isOpen={isAddModalOpen || Boolean(selectedInquiryForConfirm)}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedInquiryForConfirm(null);
        }}
        leadToConfirm={selectedInquiryForConfirm}
        onSuccess={(savedMember, isConfirm) => {
          if (isConfirm || selectedInquiryForConfirm) {
            setMembers((prev) => prev.map((m) => (m.id === savedMember.id ? savedMember : m)));
          } else {
            setMembers((prev) => [savedMember, ...prev]);
          }
          setSelectedInquiryForConfirm(null);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
