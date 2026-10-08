import { Phone, Mail } from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";

export function getTrainerColumns({ onNavigate }) {
  return [
    {
      header: "Trainer ID",
      accessorKey: "id",
      cell: (trainer) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/70 text-foreground/85 font-mono text-xs font-semibold tracking-tight shadow-2xs">
          #{trainer.id}
        </span>
      ),
    },
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
        const photo = getTrainerPhoto(trainer);

        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(`/admin/trainers-members/trainers/${trainer.id}`)}
              title="View full Trainer profile"
              className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-accent/15 text-accent font-bold text-xs sm:text-sm border border-accent/20 hover:scale-105 hover:ring-2 hover:ring-accent/40 transition-all cursor-pointer focus:outline-none grid place-items-center"
            >
              {photo ? (
                <img
                  src={photo}
                  alt={trainer.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </button>
            <div>
              <button
                type="button"
                onClick={() => onNavigate(`/admin/trainers-members/trainers/${trainer.id}`)}
                className="font-bold text-xs sm:text-sm text-foreground hover:text-accent hover:underline text-left cursor-pointer transition-colors"
              >
                {trainer.name}
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: "Gender",
      accessorKey: "gender",
      cell: (trainer) => (
        <span className="inline-flex items-center rounded-full bg-accent/20 border border-accent/30 px-2.5 py-0.5 text-xs font-medium text-foreground">
          {trainer.gender || "—"}
        </span>
      ),
    },
    {
      header: "Contact",
      cell: (trainer) => (
        <div className="text-xs sm:text-sm space-y-0.5">
          <div className="flex items-center gap-1.5 text-foreground">
            <Phone size={13} className="text-muted-foreground shrink-0" />
            <span className="font-medium">{trainer.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail size={13} className="text-muted-foreground shrink-0" />
            <span className="truncate max-w-45">{trainer.email}</span>
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
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border select-none ${
              isActive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            <span>{trainer.status || "Active"}</span>
          </span>
        );
      },
    },
  ];
}
