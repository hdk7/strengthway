import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/site/Logo";

export function Footer() {
  return (
    <footer className="border-t border-black bg-black">
      <div className="mx-auto grid max-w-[100rem] gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo
              textClassName="font-display text-lg font-bold text-white"
              accentClassName="text-white/70"
            />
          </div>
          <p className="mt-4 text-sm text-white/60">
            The premium operating system for modern gyms and their members.
          </p>
        </div>
        {[
          { title: "Product", items: ["Memberships", "Trainers", "Programs", "Nutrition"] },
          { title: "Company", items: ["About", "Careers", "Press", "Contact"] },
          { title: "Legal", items: ["Privacy", "Terms", "Cookies", "Security"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              {col.items.map((i) => (
                <li key={i}>
                  <a href="#" className="transition-colors hover:text-white">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[100rem] flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} The Strength Way. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white hover:text-white"
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
