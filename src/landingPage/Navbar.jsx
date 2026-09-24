import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/landingPage/Logo";
import { ThemeToggle } from "@/hooks/theme";

// Past this many px of scroll, the header contracts into a floating pill.
const SCROLL_THRESHOLD = 32;

const links = [
  { href: "#about", label: "About" },
  { href: "#programs", label: "Programs" },
  { href: "#plans", label: "Plans" },
  { href: "#trainers", label: "Trainers" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#bmi", label: "BMI" },
  { href: "#inquiries", label: "Inquiries" },
];

export function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const isHome = location.pathname === "/";

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    function onScroll() {
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setScrolled(scrollY > SCROLL_THRESHOLD);

      if (isHome) {
        const sections = ["about", "programs", "plans", "trainers", "portfolio", "bmi", "inquiries", "contact"];
        const scrollPosition = scrollY + 200;

        for (const sectionId of sections) {
          const el = document.getElementById(sectionId);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(`#${sectionId}`);
              break;
            }
          }
        }
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

  function getNavLink(l) {
    if (l.to) return { to: l.to };
    // If not on home page, prefix anchor link with '/' so it navigates to home first
    const href = isHome ? l.href : `/${l.href}`;
    return { href };
  }

  function handleNavClick(e, l) {
    if (l.to) return;
    if (isHome) {
      e.preventDefault();
      const targetId = l.href.replace("#", "");
      const el = document.getElementById(targetId);
      if (el) {
        const elementPosition = el.getBoundingClientRect().top;
        const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const offsetPosition = elementPosition + currentScroll;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
        setActiveSection(l.href);
      }
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
      <header
        className={`w-full pointer-events-auto transition-all duration-300 ease-out ${
          scrolled
            ? "mt-3 mx-3 sm:mx-6 max-w-[calc(100vw-1.5rem)] sm:max-w-5xl rounded-full border border-border/70 bg-surface/90 card-glow backdrop-blur-xl shadow-2xl"
            : "mt-0 max-w-full rounded-none border-b border-border/50 bg-background/95 backdrop-blur-md"
        }`}
      >
        <div
          className={`mx-auto max-w-[100rem] flex items-center justify-between transition-all duration-300 ease-out ${
            scrolled ? "h-14 px-5 sm:px-6" : "h-16 px-4 sm:px-6"
          }`}
        >
          <Link
            to="/"
            onClick={(e) => {
              setOpen(false);
              if (isHome) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                setActiveSection("");
              }
            }}
            className="flex shrink-0 items-center gap-2 cursor-pointer"
          >
            <Logo textClassName="font-display text-lg font-bold tracking-tight" />
          </Link>
          <nav
            className={`hidden shrink items-center lg:flex ${scrolled ? "gap-3" : "gap-4"} transition-all duration-300 ease-out`}
          >
            {links.map((l) => {
              const navProps = getNavLink(l);
              const isActive = l.to
                ? location.pathname === l.to
                : isHome && activeSection === l.href;

              return l.to ? (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`whitespace-nowrap text-sm transition-colors hover:text-foreground ${
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={navProps.href}
                  onClick={(e) => handleNavClick(e, l)}
                  className={`whitespace-nowrap text-sm transition-colors hover:text-foreground ${
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <ThemeToggle className={scrolled ? "rounded-full" : "rounded-xl"} />
            <Link
              to="/admin/login"
              className={`whitespace-nowrap border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent/15 ${
                scrolled ? "rounded-full" : "rounded-lg"
              }`}
            >
              Sign In
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle className={scrolled ? "rounded-full" : "rounded-xl"} />
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-border"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div
            id="mobile-nav"
            className="border-t border-border/40 bg-background/95 lg:hidden lg:rounded-b-2xl"
          >
            <div className="mx-auto flex max-w-[100rem] flex-col gap-3 px-4 py-4">
              {links.map((l) => {
                const navProps = getNavLink(l);
                return l.to ? (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="py-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={navProps.href}
                    onClick={(e) => {
                      setOpen(false);
                      handleNavClick(e, l);
                    }}
                    className="py-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </a>
                );
              })}
              <Link
                to="/admin/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-accent/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
