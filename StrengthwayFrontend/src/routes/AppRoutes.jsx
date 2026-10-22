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
import RoleGuard from "@/auth/RoleGuard";

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
import MemberDiscountsPage from "@/pages/payments/discounts/MemberDiscountsPage";
import TrainersPaymentsPage from "@/pages/payments/TrainersPaymentsPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import MembershipPlanMasterPage from "@/pages/masters/MembershipPlanMasterPage";
import AttendancePolicyMasterPage from "@/pages/masters/AttendancePolicyMasterPage";
import PaymentFeeMasterPage from "@/pages/masters/PaymentFeeMasterPage";
import PortfolioMasterPage from "@/pages/masters/PortfolioMasterPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import UsersAccessPage from "@/pages/users/UsersAccessPage";
import MasterClassSchedulePage from "@/pages/schedule/MasterClassSchedulePage";
import PaymentCheckoutSimulatorPage from "@/pages/payments/PaymentCheckoutSimulatorPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Marketing site & checkout portal */}
      <Route path="/" element={<HomePage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/payment/checkout" element={<PaymentCheckoutSimulatorPage />} />
      <Route path="/trainers" element={<Navigate to="/#trainers" replace />} />
      <Route path="/trainers/:id" element={<PublicTrainerProfilePage />} />

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Standalone error pages */}
      <Route path="/401" element={<UnauthorizedPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* ─────────────────────────────────────────────────────────────
          1. ADMIN PORTAL ROOT (/admin/*)
         ───────────────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RoleGuard requireAuth={true} allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />

        {/* Inquiries */}
        <Route path="inquiries" element={<InquiriesPage />} />
        <Route path="inquiries/:id" element={<InquiryProfilePage />} />

        {/* Trainers & Members */}
        <Route path="trainers-members/trainers" element={<TrainersPage />} />
        <Route path="trainers-members/trainers/:id" element={<TrainerProfilePage />} />
        <Route path="trainers/:id" element={<TrainerProfilePage />} />
        <Route path="trainers-members/members" element={<MembersPage />} />
        <Route path="trainers-members/members/:id" element={<MemberProfilePage />} />
        <Route path="members/:id" element={<MemberProfilePage />} />

        {/* Batches & Schedules */}
        <Route path="schedule" element={<Navigate to="/admin/schedule/batches" replace />} />
        <Route path="schedule/calendar" element={<Navigate to="/admin/schedule/batches" replace />} />
        <Route path="schedule/batches" element={<BatchListPage />} />
        <Route path="schedule/batches/:id" element={<BatchDetailPage />} />
        <Route path="batches" element={<BatchListPage />} />
        <Route path="batches/list" element={<Navigate to="/admin/batches" replace />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />

        <Route path="schedule/master-class" element={<MasterClassSchedulePage />} />
        <Route path="schedule/master-schedule" element={<Navigate to="/admin/schedule/master-class" replace />} />
        <Route path="schedule/classes" element={<Navigate to="/admin/schedule/master-class" replace />} />
        <Route path="schedule/class" element={<Navigate to="/admin/schedule/master-class" replace />} />
        <Route path="schedule/class-schedule" element={<Navigate to="/admin/schedule/master-class" replace />} />
        <Route path="schedule/sessions" element={<Navigate to="/admin/schedule/master-class" replace />} />

        {/* Attendance */}
        <Route path="attendance/members" element={<MembersAttendancePage />} />
        <Route path="attendance/trainers" element={<TrainersAttendancePage />} />

        {/* Payments */}
        <Route path="payments/members" element={<MembersPaymentsPage />} />
        <Route path="payments/discounts" element={<MemberDiscountsPage />} />
        <Route path="payments/trainers" element={<TrainersPaymentsPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Masters & System Config */}
        <Route path="schedule/holidays" element={<Navigate to="/admin/masters/attendance-policy" replace />} />
        <Route path="masters/shift" element={<Navigate to="/admin/masters/membership-plan" replace />} />
        <Route path="masters/batch" element={<Navigate to="/admin/batches" replace />} />
        <Route path="masters/membership-plan" element={<MembershipPlanMasterPage />} />
        <Route path="masters/schedule" element={<Navigate to="/admin/schedule/master-class" replace />} />
        <Route path="masters/attendance-policy" element={<AttendancePolicyMasterPage />} />
        <Route path="masters/holiday" element={<Navigate to="/admin/masters/attendance-policy" replace />} />
        <Route path="masters/payment-fee" element={<PaymentFeeMasterPage />} />
        <Route path="masters/portfolio" element={<PortfolioMasterPage />} />
        <Route path="users" element={<UsersAccessPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<AdminNotFoundPage embedded />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────────
          2. TRAINER PORTAL ROOT (/trainer/*)
         ───────────────────────────────────────────────────────────── */}
      <Route
        path="/trainer"
        element={
          <RoleGuard requireAuth={true} allowedRoles={["trainer"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />

        {/* Assigned Batches */}
        <Route path="schedule" element={<Navigate to="/trainer/schedule/batches" replace />} />
        <Route path="schedule/batches" element={<BatchListPage />} />
        <Route path="schedule/batches/:id" element={<BatchDetailPage />} />
        <Route path="batches" element={<BatchListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />

        {/* Master Class Schedule */}
        <Route path="schedule/master-class" element={<MasterClassSchedulePage />} />
        <Route path="schedule/classes" element={<Navigate to="/trainer/schedule/master-class" replace />} />

        {/* Assigned Members */}
        <Route path="trainers-members/members" element={<MembersPage />} />
        <Route path="trainers-members/members/:id" element={<MemberProfilePage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<MemberProfilePage />} />

        {/* Trainer's Own Profile */}
        <Route path="trainers-members/trainers/:id" element={<TrainerProfilePage />} />
        <Route path="profile" element={<TrainerProfilePage />} />

        {/* Attendance */}
        <Route path="attendance" element={<Navigate to="/trainer/attendance/trainers" replace />} />
        <Route path="attendance/members" element={<MembersAttendancePage />} />
        <Route path="attendance/trainers" element={<TrainersAttendancePage />} />

        {/* Payments / Payouts */}
        <Route path="payments" element={<Navigate to="/trainer/payments/trainers" replace />} />
        <Route path="payments/trainers" element={<TrainersPaymentsPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        <Route path="*" element={<AdminNotFoundPage embedded />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────────
          3. MEMBER PORTAL ROOT (/member/*)
         ───────────────────────────────────────────────────────────── */}
      <Route
        path="/member"
        element={
          <RoleGuard requireAuth={true} allowedRoles={["member"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />

        {/* Member Profile */}
        <Route path="trainers-members/members/:id" element={<MemberProfilePage />} />
        <Route path="profile" element={<MemberProfilePage />} />

        {/* Enrolled Batches */}
        <Route path="schedule" element={<Navigate to="/member/schedule/batches" replace />} />
        <Route path="schedule/batches" element={<BatchListPage />} />
        <Route path="schedule/batches/:id" element={<BatchDetailPage />} />
        <Route path="batches" element={<BatchListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />

        {/* Attendance */}
        <Route path="attendance" element={<Navigate to="/member/attendance/members" replace />} />
        <Route path="attendance/members" element={<MembersAttendancePage />} />

        {/* Payments / Receipts */}
        <Route path="payments" element={<Navigate to="/member/payments/members" replace />} />
        <Route path="payments/members" element={<MembersPaymentsPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        <Route path="*" element={<AdminNotFoundPage embedded />} />
      </Route>

      {/* Unknown top-level URL */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
