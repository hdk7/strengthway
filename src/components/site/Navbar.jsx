import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/hooks/theme";
import { MemberRegistrationModal } from "@/components/site/MemberRegistration";

// Past this many px of scroll, the header contracts into a floating pill.
const SCROLL_THRESHOLD = 32;

const links = [
  { href: "#about", label: "About" },
  { href: "#programs", label: "Programs" },
  { href: "#plans", label: "Plans" },
  { href: "#trainers", label: "Trainers" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#bmi", label: "BMI" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsRegisterOpen(true);
    window.addEventListener("open-member-registration", handleOpen);
    return () => window.removeEventListener("open-member-registration", handleOpen);
  }, []);

  const isHome = location.pathname === "/";

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);

      if (isHome) {
        const sections = ["about", "programs", "plans", "trainers", "portfolio", "bmi", "contact"];
        const scrollPosition = window.scrollY + 200;

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
    return () => window.removeEventListener("scroll", onScroll);
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
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setActiveSection(l.href);
      }
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
        <header
          className={`w-full transition-all duration-300 ease-out ${
            scrolled
              ? "mt-3 max-w-5xl rounded-2xl border border-border/60 bg-surface/90 card-glow backdrop-blur-xl"
              : isHome
                ? "mt-0 max-w-[100rem] rounded-none border-b border-transparent bg-transparent"
                : "mt-0 max-w-[100rem] rounded-none border-b border-border/40 glass"
          }`}
        >
          <div
            className={`mx-auto flex items-center justify-between transition-all duration-300 ease-out ${
              scrolled ? "h-14 px-4 sm:px-5" : "h-16 px-4 sm:px-6"
            }`}
          >
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex shrink-0 items-center gap-2"
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
              <ThemeToggle />
              <Link
                to="/admin/login"
                className="whitespace-nowrap rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-transform hover:scale-105 shadow-sm cursor-pointer"
              >
                Join Now
              </button>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
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
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="rounded-full bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background shadow-sm cursor-pointer"
                >
                  Join Now
                </button>
              </div>
            </div>
          )}
        </header>
      </div>
      <MemberRegistrationModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </>
  );
}
