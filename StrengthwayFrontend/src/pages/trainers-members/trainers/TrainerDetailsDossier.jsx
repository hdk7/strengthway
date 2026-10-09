import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Phone, Copy, Check } from "lucide-react";

export function TrainerDetailsDossier({
  trainer,
  assignedBatches,
  handleCopy,
  copiedField,
  isInactive,
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
        <ShieldCheck size={18} className="text-emerald-500" />
        <span>Personal Details & Identification</span>
      </h3>

      <dl className="mt-6 divide-y divide-border text-sm">
        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Full Name</dt>
          <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
            {trainer.name}
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Trainer ID</dt>
          <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0">
            {trainer.id}
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Specialization</dt>
          <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
            {trainer.specialization || "Functional Movements & Kettlebell Specialist"}
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Experience</dt>
          <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
            {trainer.experience} Professional Coaching
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Faculty Status</dt>
          <dd className="mt-1 sm:col-span-2 sm:mt-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isInactive
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              {trainer.status || "Active"}
            </span>
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Assigned Batches</dt>
          <dd className="mt-1 sm:col-span-2 sm:mt-0">
            {assignedBatches.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedBatches.map((b) => (
                  <Link
                    key={b.id}
                    to={`/admin/batches/${b.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted border border-border px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-card hover:border-foreground/30 transition-colors"
                  >
                    <span>{b.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({b.daysPattern})
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                No batches currently assigned
              </span>
            )}
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Email</dt>
          <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Mail size={14} className="text-muted-foreground shrink-0" />
              <a
                href={`mailto:${trainer.email}`}
                className="hover:text-primary hover:underline truncate"
              >
                {trainer.email}
              </a>
            </div>
            {trainer.email && (
              <button
                type="button"
                onClick={() => handleCopy(trainer.email, "details-email", "Email address")}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Copy email"
              >
                {copiedField === "details-email" ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </dd>
        </div>

        <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">Phone</dt>
          <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground shrink-0" />
              <span>{trainer.phone}</span>
            </div>
            {trainer.phone && (
              <button
                type="button"
                onClick={() => handleCopy(trainer.phone, "details-phone", "Phone number")}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Copy phone"
              >
                {copiedField === "details-phone" ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </dd>
        </div>

        {trainer.joinedAt && (
          <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-muted-foreground">Faculty Since</dt>
            <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
              {new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
