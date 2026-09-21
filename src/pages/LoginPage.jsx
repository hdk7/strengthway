import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/admin/logo.png";
import LoginForm from "@/auth/LoginForm";
import { ThemeToggle } from "@/hooks/theme";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = (session) => {
    if (session?.token) {
      localStorage.setItem("tsw-token", session.token);
      localStorage.setItem("tsw-user", JSON.stringify(session.user));
    }
    navigate("/admin/dashboard");
  };

  return (
    <main className="min-h-svh flex flex-col justify-between p-4 sm:p-6 bg-background">
      <div className="w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-95 p-6 px-5 sm:p-10 sm:px-8 border border-border rounded-xl sm:rounded-2xl bg-card shadow-lg dark:shadow-black/40 text-center">
          <div className="flex flex-col items-center gap-2 mb-6">
            <Link
              to="/"
              className="inline-flex flex-col items-center gap-2 no-underline hover:opacity-85 transition-opacity"
              title="Back to website"
            >
              <img src={logo} alt="TheStrengthWay" className="w-12 h-12 object-contain" />
              <span className="text-[15px] font-semibold tracking-[0.2px] text-foreground">
                TheStrengthWay
              </span>
            </Link>
          </div>

          <h1 className="text-[26px] mb-1.5 text-foreground font-bold">Admin sign in</h1>
          <p className="text-muted-foreground text-sm mb-7">
            Enter your credentials to access the admin dashboard.
          </p>

          <LoginForm onSuccess={handleSuccess} />

          <p className="mt-4 text-[12.5px] text-muted-foreground">
            Restricted area. Access is limited to authorized administrators.
          </p>
        </div>
      </div>

      <div className="w-full" />
    </main>
  );
}
