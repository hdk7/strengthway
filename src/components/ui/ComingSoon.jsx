import { Clock } from "lucide-react";

// Shared "not built yet" body for every admin module page below — each page
// owns its own file/route, but they all render this until they get real
// content, so the placeholder markup lives in exactly one place.
export function ComingSoon({ title }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and monitor {title.toLowerCase()} operations, data, and settings.
        </p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Clock size={22} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Module Under Development</h2>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          This section is currently being set up. Features and workflows will be available here
          soon.
        </p>
      </div>
    </div>
  );
}
