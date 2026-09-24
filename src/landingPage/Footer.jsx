import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/landingPage/Logo";

export function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-border bg-card">
      <div className="mx-auto grid max-w-[100rem] gap-8 lg:gap-10 px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo
              textClassName="font-display text-lg font-bold text-foreground"
              accentClassName="text-muted-foreground"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The premium operating system for modern gyms and their members.
          </p>
        </div>
        {[
          { title: "Product", items: ["Memberships", "Trainers", "Programs", "Nutrition"] },
          { title: "Company", items: ["About", "Careers", "Press", "Inquiries"] },
          { title: "Legal", items: ["Privacy", "Terms", "Cookies", "Security"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {col.items.map((i) => (
                <li key={i}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/80">
        <div className="mx-auto flex max-w-[100rem] flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-5 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} The Strength Way. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground hover:bg-accent/15"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
