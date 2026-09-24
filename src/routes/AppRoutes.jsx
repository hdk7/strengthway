import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "@/landingPage/HomePage";
import PortfolioPage from "@/landingPage/PortfolioPage";
import PublicTrainerProfilePage from "@/landingPage/portfolio/PublicTrainerProfilePage";
import NotFoundPage, {
  UnauthorizedPage,
  ForbiddenPage,
  AdminNotFoundPage,
  ServerErrorPage,
} from "@/components/ui/NotFoundPage";

import AdminLayout from "@/layout/AdminLayout";
import LoginPage from "@/auth/LoginPage";

import DashboardHome from "@/pages/dashboard/DashboardHome";
import InquiriesPage from "@/pages/inquiries/InquiriesPage";
import InquiryProfilePage from "@/pages/inquiries/InquiryProfilePage";
import TrainersPage from "@/pages/trainers-members/trainers/TrainersPage";
import TrainerProfilePage from "@/pages/trainers-members/trainers/TrainerProfilePage";
import MembersPage from "@/pages/trainers-members/members/MembersPage";
import MemberProfilePage from "@/pages/trainers-members/members/MemberProfilePage";
import BatchListPage from "@/pages/batches/BatchListPage";
import BatchDetailPage from "@/pages/batches/BatchDetailPage";
import MembersAttendancePage from "@/pages/attendance/MembersAttendancePage";
import TrainersAttendancePage from "@/pages/attendance/TrainersAttendancePage";
import MembersPaymentsPage from "@/pages/payments/MembersPaymentsPage";
import TrainersPaymentsPage from "@/pages/payments/TrainersPaymentsPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import ShiftMasterPage from "@/pages/masters/ShiftMasterPage";
import MembershipPlanMasterPage from "@/pages/masters/MembershipPlanMasterPage";
import ScheduleMasterPage from "@/pages/masters/ScheduleMasterPage";
import AttendancePolicyMasterPage from "@/pages/masters/AttendancePolicyMasterPage";
import HolidayMasterPage from "@/pages/masters/HolidayMasterPage";
import PaymentFeeMasterPage from "@/pages/masters/PaymentFeeMasterPage";
import SettingsPage from "@/pages/settings/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Marketing site */}
      <Route path="/" element={<HomePage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/trainers" element={<Navigate to="/#trainers" replace />} />
      <Route path="/trainers/:id" element={<PublicTrainerProfilePage />} />

      {/* Admin auth */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Standalone admin error pages */}
      <Route path="/401" element={<UnauthorizedPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* Admin shell */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="inquiries" element={<InquiriesPage />} />
        <Route path="inquiries/:id" element={<InquiryProfilePage />} />

        <Route path="trainers-members/trainers" element={<TrainersPage />} />
        <Route path="trainers-members/trainers/:id" element={<TrainerProfilePage />} />
        <Route path="trainers-members/members" element={<MembersPage />} />
        <Route path="trainers-members/members/:id" element={<MemberProfilePage />} />

        <Route path="batches" element={<BatchListPage />} />
        <Route path="batches/list" element={<Navigate to="/admin/batches" replace />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />

        <Route path="attendance/members" element={<MembersAttendancePage />} />
        <Route path="attendance/trainers" element={<TrainersAttendancePage />} />

        <Route path="payments/members" element={<MembersPaymentsPage />} />
        <Route path="payments/trainers" element={<TrainersPaymentsPage />} />

        <Route path="reports" element={<ReportsPage />} />

        <Route path="masters/shift" element={<ShiftMasterPage />} />
        <Route path="masters/batch" element={<Navigate to="/admin/batches" replace />} />
        <Route path="masters/membership-plan" element={<MembershipPlanMasterPage />} />
        <Route path="masters/schedule" element={<ScheduleMasterPage />} />
        <Route path="masters/attendance-policy" element={<AttendancePolicyMasterPage />} />
        <Route path="masters/holiday" element={<HolidayMasterPage />} />
        <Route path="masters/payment-fee" element={<PaymentFeeMasterPage />} />

        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<AdminNotFoundPage embedded />} />
      </Route>

      {/* Unknown top-level URL */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
