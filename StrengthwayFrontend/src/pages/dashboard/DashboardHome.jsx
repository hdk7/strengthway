import {
  isAdmin,
  isTrainer,
} from "@/auth/currentUser";
import AdminDashboard from "./AdminDashboard";
import TrainerDashboard from "./TrainerDashboard";
import MemberDashboard from "./MemberDashboard";

export default function DashboardHome() {
  const userIsAdmin = isAdmin();
  const userIsTrainer = isTrainer();

  // Determine which dashboard to show
  const activeRole = userIsAdmin ? "admin" : userIsTrainer ? "trainer" : "member";

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Render Role Dashboard */}
      {activeRole === "admin" && <AdminDashboard />}
      {activeRole === "trainer" && <TrainerDashboard />}
      {activeRole === "member" && <MemberDashboard />}
    </div>
  );
}
