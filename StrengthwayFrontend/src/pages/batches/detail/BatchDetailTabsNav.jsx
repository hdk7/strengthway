import {
  Sparkles,
  UserCheck,
  Users,
  Calendar,
  Search,
  ArrowRightLeft,
  Plus,
  Layers,
} from "lucide-react";

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
  onOpenAssignProgram,
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
          <span>Overview</span>
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
          <span>Trainers</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            {trainers.length}
          </span>
        </button>

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

        <button
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
      </div>

      {/* Action Controls on Active Subtab */}
      {activeTab === "trainers" && (
        <div className="flex items-center gap-2.5 sm:pr-1 sm:pb-1">
          <div className="relative w-full sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search trainer..."
              value={trainerSearch}
              onChange={(e) => setTrainerSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenAddTrainer}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Trainer</span>
          </button>
        </div>
      )}

      {activeTab === "members" && (
        <div className="flex items-center gap-2 sm:pr-1 sm:pb-1 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

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
        </div>
      )}

      {activeTab === "classes" && (
        <div className="flex items-center gap-2 sm:pr-1 sm:pb-1">
          <button
            onClick={onOpenAssignProgram}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Layers size={14} />
            <span>Assign Program</span>
          </button>
        </div>
      )}
    </div>
  );
}
