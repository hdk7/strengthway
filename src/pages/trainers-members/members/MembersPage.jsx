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
} from "lucide-react";
import { toast } from "sonner";
import { AdminMemberRegistrationModal } from "./MembersRegistration";
import { getMembers, toggleMemberStatus } from "@/lib/membersService";

export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadForConfirm, setSelectedLeadForConfirm] = useState(null);

  // Load all members including soft-deleted ones from membersService
  useEffect(() => {
    try {
      const allMembers = getMembers(true);
      setMembers(allMembers);
    } catch {
      setMembers([]);
    }
  }, []);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleMemberSaved = (savedMember) => {
    setMembers((prev) => [savedMember, ...prev]);
  };

  const handleToggleStatus = (memberId) => {
    try {
      const updated = toggleMemberStatus(memberId);
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
        toast.success(`Member status changed to ${updated.status}.`);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleOpenConfirmModal = (leadMember) => {
    setSelectedLeadForConfirm(leadMember);
  };

  const handleLeadConfirmed = (updatedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    setSelectedLeadForConfirm(null);
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

  // Statistics
  const stats = useMemo(() => {
    const activeList = members.filter((m) => !m.isDeleted);
    const total = activeList.length;
    const leads = activeList.filter((m) => m.status === "Lead").length;
    const active = activeList.filter(
      (m) => m.status === "Active" || (!m.status && m.status !== "Lead"),
    ).length;
    const withMedical = activeList.filter((m) => m.medicalDoc || m.medicalDocName).length;
    const archived = members.filter((m) => m.isDeleted).length;
    return {
      total,
      active,
      leads,
      withMedical,
      archived,
    };
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Members</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage members, profiles, status, edits, and registrations.
          </p>
        </div>

        {/* Add Member CTA Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {/* Total Members */}
        <div
          onClick={() => setStatusFilter("All")}
          className={`rounded-2xl border bg-card p-4 shadow-sm cursor-pointer transition-all hover:border-accent/40 ${
            statusFilter === "All" ? "border-accent ring-1 ring-accent/30" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Enrolled</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Registered in gym</p>
          </div>
        </div>

        {/* Pending Leads */}
        <div
          onClick={() => setStatusFilter("Lead")}
          className={`rounded-2xl border bg-card p-4 shadow-sm cursor-pointer transition-all hover:border-amber-500/50 ${
            statusFilter === "Lead" ? "border-amber-500 ring-1 ring-amber-500/30" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Prospective Leads</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <UserPlus size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-500">{stats.leads}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Awaiting confirmation</p>
          </div>
        </div>

        {/* Active Members */}
        <div
          onClick={() => setStatusFilter("Active")}
          className={`rounded-2xl border bg-card p-4 shadow-sm cursor-pointer transition-all hover:border-emerald-500/50 ${
            statusFilter === "Active"
              ? "border-emerald-500 ring-1 ring-emerald-500/30"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Status</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-500">{stats.active}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Currently attending</p>
          </div>
        </div>

        {/* Medical Clearance */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Medical Clearance</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.withMedical}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Documents on record</p>
          </div>
        </div>

        {/* Archived (Soft Deleted) */}
        <div
          onClick={() => setStatusFilter("Archived")}
          className={`rounded-2xl border bg-card p-4 shadow-sm cursor-pointer hover:border-accent/40 transition-colors ${
            statusFilter === "Archived"
              ? "border-destructive ring-1 ring-destructive/30"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Archived / Deleted</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Archive size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.archived}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Click to view & restore</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, email, or ID…"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 text-xs">
            <Filter size={14} className="ml-1.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setStatusFilter("All")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "All"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Lead")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "Lead"
                  ? "bg-amber-500 text-black font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Leads</span>
              {stats.leads > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === "Lead"
                      ? "bg-black/20 text-black"
                      : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {stats.leads}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Active")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "Active"
                  ? "bg-accent text-accent-foreground font-semibold"
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
                  ? "bg-accent text-accent-foreground font-semibold"
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
                  ? "bg-destructive text-destructive-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Archived ({stats.archived})
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Member</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Physical Stats</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4">Medical Doc</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
                  const initials =
                    `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
                  const isDeleted = Boolean(member.isDeleted);

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-accent/5 transition-colors duration-150 ${
                        isDeleted ? "opacity-75 bg-muted/20" : ""
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
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
                                className="h-10 w-10 rounded-full object-cover border border-border hover:scale-105 hover:ring-2 hover:ring-accent/40 transition-all"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/trainers-members/members/${member.id}`)
                              }
                              title="View full member profile"
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs border border-accent/20 hover:scale-105 hover:ring-2 hover:ring-accent/40 transition-all cursor-pointer focus:outline-none"
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
                              className="font-semibold text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
                            >
                              {fullName}
                            </button>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {member.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Phone size={12} className="text-muted-foreground shrink-0" />
                            <span>{member.mobile || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail size={12} className="text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[150px]">{member.email || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Physical Stats */}
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4">
                        {member.emergencyName ? (
                          <div className="text-xs">
                            <p className="font-medium text-foreground">
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
                      <td className="py-3.5 px-4">
                        {member.medicalDoc || member.medicalDocName ? (
                          <div className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                            <FileCheck size={15} />
                            <span>Attached</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
                            Archived
                          </span>
                        ) : member.status === "Lead" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                              Lead
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmModal(member)}
                              title="Confirm lead, complete mandatory details & payment to convert to active gym member"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              <UserCheck size={13} />
                              <span>Confirm Member</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member.id)}
                            title="Click to toggle status"
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${
                              member.status === "Inactive"
                                ? "bg-muted text-muted-foreground"
                                : "bg-emerald-500/10 text-emerald-500"
                            }`}
                          >
                            {member.status || "Active"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={36} className="text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No members found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery
                          ? "Try adjusting your search query or filters."
                          : statusFilter === "Archived"
                            ? "There are no soft-deleted members in the archive."
                            : statusFilter === "Lead"
                              ? "No pending leads found."
                              : "Get started by adding your first gym member."}
                      </p>
                      {!searchQuery && statusFilter !== "Archived" && statusFilter !== "Lead" && (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
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
      </div>

      {/* Member Add / Confirm Registration Modal */}
      <AdminMemberRegistrationModal
        isOpen={isAddModalOpen || Boolean(selectedLeadForConfirm)}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLeadForConfirm(null);
        }}
        leadToConfirm={selectedLeadForConfirm}
        onSuccess={(savedMember, isConfirm) => {
          if (isConfirm || selectedLeadForConfirm) {
            setMembers((prev) => prev.map((m) => (m.id === savedMember.id ? savedMember : m)));
          } else {
            setMembers((prev) => [savedMember, ...prev]);
          }
          setSelectedLeadForConfirm(null);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
