import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  Shield,
  ExternalLink,
} from "lucide-react";

export function MemberContactCard({
  member,
  age,
  emergencyName,
  emergencyRel,
  emergencyPhone,
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Phone size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Contact Channels & Residence
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Communication channels, home address, and emergency contact
            </p>
          </div>
        </div>
      </div>

      {/* 1. Contact Channels */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Contact Channels
        </span>

        <div className="space-y-2">
          {/* Mobile Phone */}
          <div className="group rounded-2xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-accent/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                <Phone size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Mobile Phone
                </span>
                <span className="text-xs font-bold text-foreground font-mono truncate block">
                  {member.mobile || "Not provided"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {member.mobile && (
                <a
                  href={`tel:${member.mobile}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <span>Call</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="group rounded-2xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-accent/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                <Mail size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Email Address
                </span>
                <span className="text-xs font-bold text-foreground truncate block">
                  {member.email || "Not provided"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <span>Mail</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Date of Birth & Age */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-accent">
                <Calendar size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Date of Birth
                </span>
                <span className="text-xs font-bold text-foreground font-mono block">
                  {member.dob
                    ? new Date(member.dob).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
            {age !== null && (
              <span className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                {age} Yrs old
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Residential Address */}
      <div className="space-y-2.5 pt-3.5 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Residential Address
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
          {member.address ? (
            <>
              <p className="font-semibold text-xs leading-relaxed text-foreground">
                {member.address}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {member.city && (
                  <span className="rounded-md bg-card px-2 py-0.5 text-[11px] font-semibold border border-border text-foreground">
                    {member.city}
                  </span>
                )}
                {member.state && (
                  <span className="rounded-md bg-card px-2 py-0.5 text-[11px] font-semibold border border-border text-foreground">
                    {member.state}
                  </span>
                )}
                {member.pincode && (
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-mono font-bold border border-accent/25 text-accent">
                    PIN: {member.pincode}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {member.country || "India"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No residential address recorded on file.</p>
          )}
        </div>
      </div>

      {/* 3. Emergency Contact */}
      <div className="space-y-2.5 pt-3.5 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Emergency Contact
            </span>
          </div>
          {emergencyRel && (
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 border border-rose-500/25">
              {emergencyRel}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
          {emergencyName ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-foreground">{emergencyName}</p>
                <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                  {emergencyPhone || "No phone listed"}
                </p>
              </div>

              {emergencyPhone && (
                <a
                  href={`tel:${emergencyPhone}`}
                  className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-rose-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-rose-600 transition-colors"
                >
                  <Phone size={12} />
                  <span>Emergency Call</span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No emergency contact recorded on profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
