import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/theme";

import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { CustomCursor } from "@/landingPage/CustomCursor";
import { BackToTop } from "@/landingPage/BackToTop";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Site Sections - Home
import { HeroSection } from "@/landingPage/home/HeroSection";
import { AboutSection } from "@/landingPage/home/AboutSection";
import { ProgramsSection } from "@/landingPage/home/ProgramsSection";
import { PlansSection } from "@/landingPage/home/PlansSection";
import { TrainersSection } from "@/landingPage/home/TrainersSection";
import { PortfolioPreviewSection } from "@/landingPage/home/PortfolioPreviewSection";
import { BmiSection } from "@/landingPage/home/BmiSection";
import { ContactSection } from "@/landingPage/home/ContactSection";

// Site Sections - Portfolio
import { PortfolioHeroSection } from "@/landingPage/portfolio/PortfolioHeroSection";
import { PhotosSection } from "@/landingPage/portfolio/PhotosSection";
import { VideosSection } from "@/landingPage/portfolio/VideosSection";
import { SessionsSection } from "@/landingPage/portfolio/SessionsSection";
import { FeedbackSection } from "@/landingPage/portfolio/FeedbackSection";

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
import BatchMasterPage from "@/pages/masters/BatchMasterPage";
import MembershipPlanMasterPage from "@/pages/masters/MembershipPlanMasterPage";
import ScheduleMasterPage from "@/pages/masters/ScheduleMasterPage";
import AttendancePolicyMasterPage from "@/pages/masters/AttendancePolicyMasterPage";
import HolidayMasterPage from "@/pages/masters/HolidayMasterPage";
import PaymentFeeMasterPage from "@/pages/masters/PaymentFeeMasterPage";
import SettingsPage from "@/pages/settings/SettingsPage";

function HomePage() {
  useDocumentTitle("The Strength Way");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const scrollToSection = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const elementPosition = el.getBoundingClientRect().top;
          const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const offsetPosition = elementPosition + currentScroll;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
          return true;
        }
        return false;
      };

      if (!scrollToSection()) {
        const timer1 = setTimeout(scrollToSection, 120);
        const timer2 = setTimeout(scrollToSection, 300);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [location.hash]);

  return (
    <div className="custom-cursor-scope min-h-screen min-h-[100dvh] flex flex-col bg-background w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="pt-16 w-full max-w-full overflow-x-clip flex-1">
        <HeroSection />
        <AboutSection />
        <ProgramsSection />
        <PlansSection />
        <TrainersSection />
        <PortfolioPreviewSection />
        <BmiSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <CustomCursor />
    </div>
  );
}

function PortfolioPage() {
  useDocumentTitle("Portfolio — The Strength Way");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="pt-16 w-full max-w-full overflow-x-clip flex-1">
        <PortfolioHeroSection />
        <PhotosSection onSelectPhoto={setSelectedPhoto} />
        <VideosSection />
        <SessionsSection />
        <FeedbackSection />
      </main>
      <Footer />

      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl overflow-hidden border-none bg-black/90 p-2 sm:p-4 text-white">
          <DialogTitle className="sr-only">{selectedPhoto?.alt || "Photo Preview"}</DialogTitle>
          {selectedPhoto && (
            <div className="relative flex flex-col items-center">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

        <Route path="trainers-members/trainers" element={<TrainersPage />} />
        <Route path="trainers-members/trainers/:id" element={<TrainerProfilePage />} />
        <Route path="trainers-members/members" element={<MembersPage />} />
        <Route path="trainers-members/members/:id" element={<MemberProfilePage />} />

        <Route path="batches/list" element={<BatchListPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />

        <Route path="attendance/members" element={<MembersAttendancePage />} />
        <Route path="attendance/trainers" element={<TrainersAttendancePage />} />

        <Route path="payments/members" element={<MembersPaymentsPage />} />
        <Route path="payments/trainers" element={<TrainersPaymentsPage />} />

        <Route path="reports" element={<ReportsPage />} />

        <Route path="masters/shift" element={<ShiftMasterPage />} />
        <Route path="masters/batch" element={<BatchMasterPage />} />
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
