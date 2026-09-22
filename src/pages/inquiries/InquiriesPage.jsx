/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Trash2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { getInquiries, createInquiry, updateInquiry, deleteInquiry } from "@/lib/inquiriesService";
import { InquiryDetailsModal } from "./InquiryDetailsModal";
import { LogInquiryModal } from "./LogInquiryModal";

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    try {
      const data = getInquiries();
      setInquiries(data);
    } catch {
      setInquiries([]);
    }
  }, []);

  const handleCreateInquiry = (formData) => {
    try {
      const created = createInquiry(formData);
      setInquiries((prev) => [created, ...prev]);
    } catch {
      toast.error("Failed to save inquiry.");
    }
  };

  const handleStatusChange = (id, newStatus, notes) => {
    try {
      const updated = updateInquiry(id, { status: newStatus, notes });
      if (updated) {
        setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
        setSelectedInquiry(updated);
        toast.success(`Inquiry updated to "${newStatus}".`);
      }
    } catch {
      toast.error("Failed to update inquiry status.");
    }
  };

  const handleDeleteInquiry = (id, subject) => {
    if (!window.confirm(`Delete inquiry "${subject}"?`)) return;

    try {
      deleteInquiry(id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      toast.success("Inquiry deleted successfully.");
    } catch {
      toast.error("Failed to delete inquiry.");
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.subject?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query) ||
        item.id?.toLowerCase().includes(query)
      );
    });
  }, [inquiries, searchQuery, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === "New").length;
    const inProgress = inquiries.filter((i) => i.status === "In Progress").length;
    const resolved = inquiries.filter((i) => i.status === "Resolved").length;
    return { total, newCount, inProgress, resolved };
  }, [inquiries]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Inquiries
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Track, reply, and manage incoming prospective member inquiries and contact requests.
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Log Inquiry</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Inquiries</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Inbox size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Website & walk-ins</p>
          </div>
        </div>

        {/* New / Unread */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">New / Unread</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-500">{stats.newCount}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Needs initial contact</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-500">{stats.inProgress}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Follow-up ongoing</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Resolved</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-500">{stats.resolved}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Successfully closed</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries by name, email, subject, or message…"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 text-xs">
          <Filter size={14} className="ml-1.5 text-muted-foreground" />
          {["All", "New", "In Progress", "Resolved"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Sender</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Message Snippet</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inquiry) => {
                  const initials = (inquiry.name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={inquiry.id}
                      className="hover:bg-accent/5 transition-colors duration-150"
                    >
                      {/* Sender */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs border border-accent/20">
                            {initials}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="font-semibold text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
                            >
                              {inquiry.name}
                            </button>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail size={10} />
                              <span className="truncate max-w-[160px]">{inquiry.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground text-xs">
                          {inquiry.subject}
                        </span>
                      </td>

                      {/* Message Snippet */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {inquiry.message}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(inquiry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            inquiry.status === "Resolved"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : inquiry.status === "In Progress"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              inquiry.status === "Resolved"
                                ? "bg-emerald-500"
                                : inquiry.status === "In Progress"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-blue-500 animate-pulse"
                            }`}
                          />
                          {inquiry.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inquiry)}
                            title="View inquiry details"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(inquiry.id, inquiry.subject)}
                            title="Delete inquiry"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox size={36} className="text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No inquiries found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery
                          ? "Try adjusting your search query or filters."
                          : "New inquiries from your website contact form will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Read & Update Modal */}
      <InquiryDetailsModal
        isOpen={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        inquiry={selectedInquiry}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteInquiry}
      />

      {/* Log Inquiry Modal */}
      <LogInquiryModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={handleCreateInquiry}
      />
    </div>
  );
}
