import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle, useDocumentTitle } from "@/hooks/theme";

export default function NotFoundPage() {
  useDocumentTitle("Page not found — The Strength Way");
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 radial-brand" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <Link
          to="/"
          className="absolute left-6 top-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <Link to="/" className="mb-10 flex items-center gap-2">
          <Logo />
        </Link>
        <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 font-display text-7xl font-bold text-gradient sm:text-8xl">
          404
        </h1>
        <h2 className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100 mt-4 text-xl font-semibold sm:text-2xl">
          Page not found
        </h2>
        <p className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150 mt-3 max-w-md text-sm text-muted-foreground">
          This route doesn't exist in The Strength Way system. It may have been moved, renamed, or
          never existed.
        </p>
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200 mt-8">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
