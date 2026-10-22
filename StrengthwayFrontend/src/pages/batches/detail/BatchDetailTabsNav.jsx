import {
  Sparkles,
  UserCheck,
  Users,
  Calendar,
  ArrowRightLeft,
  Plus,
  History,
} from "lucide-react";
import { SearchInput } from "@/components/ui";
import { isMember, isAdmin } from "@/auth/currentUser";

export default function BatchDetailTabsNav({
  activeTab,
  setActiveTab,
  trainers = [],
  members = [],
  filteredFlexInMembers = [],
  currentBatchSessions = [],
  trainerSearch,
  setTrainerSearch,
  onOpenAddTrainer,
  memberSearch,
  setMemberSearch,
  onOpenTransferModal,
  onOpenAddMember,
  onOpenAddClasses,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2 sm:pb-0">
      <div className="flex overflow-x-auto no-scrollbar gap-1">

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles size={16} className={activeTab === "overview" ? "text-primary" : ""} />
          <span>{isMember() ? "Batch Info" : "Overview"}</span>
        </button>

        <button
          onClick={() => setActiveTab("trainers")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === "trainers"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck size={16} className={activeTab === "trainers" ? "text-primary" : ""} />
          <span>{isMember() ? "Faculty Coaches" : "Coaches"}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            {trainers.length}
          </span>
        </button>

        {!isMember() && (
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "members"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={16} className={activeTab === "members" ? "text-primary" : ""} />
            <span>Members</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {members.length}
              {filteredFlexInMembers.length > 0 ? ` + ${filteredFlexInMembers.length} Flex` : ""}
            </span>
          </button>
        )}

        {!isMember() && (
          <button
            id="tab-scheduled-classes"
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "classes"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar size={16} className={activeTab === "classes" ? "text-primary" : ""} />
            <span>Scheduled Classes</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {currentBatchSessions.length}
            </span>
          </button>
        )}

        {!isMember() && (
          <button
            id="tab-audit-logs"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "audit"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={16} className={activeTab === "audit" ? "text-primary" : ""} />
            <span>Audit History</span>
          </button>
        )}
      </div>

      {/* Action Controls on Active Subtab */}
      {activeTab === "trainers" && (
        <div className="flex items-center gap-2.5 sm:pr-1 sm:pb-1">
          <SearchInput
            placeholder="Search coach..."
            value={trainerSearch}
            onChange={(e) => setTrainerSearch(e.target.value)}
            className="w-full sm:w-56"
          />

          {isAdmin() && (
            <button
              onClick={onOpenAddTrainer}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Coach</span>
            </button>
          )}
        </div>
      )}

      {activeTab === "members" && !isMember() && (
        <div className="flex items-center gap-2 sm:pr-1 sm:pb-1 flex-wrap sm:flex-nowrap">
          <SearchInput
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full sm:w-48"
          />

          {isAdmin() && (
            <>
              <button
                onClick={onOpenTransferModal}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-border bg-card hover:bg-muted/80 px-3 py-2 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
                title="Transfer a member to another batch or assign a flexible pass"
              >
                <ArrowRightLeft size={14} className="text-primary" />
                <span>Batch Transfer</span>
              </button>

              <button
                onClick={onOpenAddMember}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Member</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
