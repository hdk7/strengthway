import { Phone, Mail } from "lucide-react";

export function getTrainerColumns({ onNavigate }) {
  return [
    {
      header: "Trainer",
      accessorKey: "name",
      cell: (trainer) => {
        const initials = (trainer.name || "T")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/trainers/${trainer.id}`)}
              title="View full Trainer profile"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs border border-accent/20 hover:scale-105 hover:ring-2 hover:ring-accent/40 transition-all cursor-pointer focus:outline-none"
            >
              {initials}
            </button>
            <div>
              <button
                type="button"
                onClick={() => onNavigate(`/admin/trainers-members/trainers/${trainer.id}`)}
                className="font-semibold text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
              >
                {trainer.name}
              </button>
              <p className="text-[11px] text-muted-foreground font-mono">{trainer.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Gender",
      accessorKey: "gender",
      cell: (trainer) => (
        <span className="inline-flex items-center rounded-full bg-accent/25 border border-accent/30 px-2.5 py-0.5 text-xs font-semibold text-foreground">
          {trainer.gender || "—"}
        </span>
      ),
    },
    {
      header: "Contact",
      cell: (trainer) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-foreground">
            <Phone size={12} className="text-muted-foreground shrink-0" />
            <span>{trainer.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail size={12} className="text-muted-foreground shrink-0" />
            <span className="truncate max-w-[150px]">{trainer.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (trainer) => {
        const isActive = (trainer.status || "Active") === "Active";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border select-none ${
              isActive
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {trainer.status || "Active"}
          </span>
        );
      },
    },
  ];
}
