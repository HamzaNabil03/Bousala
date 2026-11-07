import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import {
  AdminLayout,
  DashboardLayout,
  ExpertLayout,
  GuestOnly,
  PublicLayout,
  RequireAdmin,
  RequireAuth,
  RequireExpert,
  RequireStudent,
} from "@/components/layout/Layouts";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { FullPageLoader } from "@/components/ui/Spinner";

import LandingPage from "@/pages/public/Landing";

// Keep the landing page eager; all other screens load only when visited.
const ScholarshipsPage = lazy(() => import("@/pages/public/Scholarships"));
const ScholarshipDetailPage = lazy(() => import("@/pages/public/ScholarshipDetail"));
const AboutPage = lazy(() => import("@/pages/public/About"));
const ContactPage = lazy(() => import("@/pages/public/Contact"));
const FaqPage = lazy(() => import("@/pages/public/Faq"));
const HelpPage = lazy(() => import("@/pages/public/Help"));
const ServicesPage = lazy(() => import("@/pages/public/Services"));
const UnifiedServiceRequestPage = lazy(() => import("@/pages/services/ServiceRequest"));
const PrivacyPage = lazy(() =>
  import("@/pages/public/LegalPage").then((module) => ({ default: module.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import("@/pages/public/LegalPage").then((module) => ({ default: module.TermsPage })),
);
const NotFoundPage = lazy(() => import("@/pages/public/NotFound"));

const LoginPage = lazy(() => import("@/pages/auth/Login"));
const GoogleCallbackPage = lazy(() => import("@/pages/auth/GoogleCallback"));
const RegisterPage = lazy(() => import("@/pages/auth/Register"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPassword"));
const VerifyCodePage = lazy(() => import("@/pages/auth/VerifyCode"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmail"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPassword"));
const ResetSuccessPage = lazy(() => import("@/pages/auth/ResetSuccess"));

const DashboardOverviewPage = lazy(() => import("@/pages/dashboard/Overview"));
const ProfilePage = lazy(() => import("@/pages/dashboard/Profile"));
const SavedPage = lazy(() => import("@/pages/dashboard/Saved"));
const DocumentsPage = lazy(() => import("@/pages/dashboard/Documents"));
const NotificationsPage = lazy(() => import("@/pages/dashboard/Notifications"));
const SettingsPage = lazy(() => import("@/pages/dashboard/Settings"));
const MyServiceRequestsPage = lazy(() => import("@/pages/dashboard/Requests"));

const ToolsHubPage = lazy(() => import("@/pages/tools/ToolsHub"));
const CvWizardPage = lazy(() => import("@/pages/tools/CvWizard"));
const DocumentImprovementPage = lazy(() => import("@/pages/tools/DocumentImprovement"));
const ServiceRequestPage = lazy(() => import("@/pages/tools/ServiceRequest"));
const CvOrderTrackingPage = lazy(() => import("@/pages/tools/CvOrderTracking"));

/* لوحة الإدارة تُحمَّل عند الطلب — لا يحتاجها الطالب ولا الزائر */
const AdminDashboardPage = lazy(() => import("@/pages/admin/Dashboard"));
const AdminScholarshipsPage = lazy(() => import("@/pages/admin/Scholarships"));
const AdminScholarshipFormPage = lazy(
  () => import("@/pages/admin/ScholarshipForm"),
);
const AdminUsersPage = lazy(() => import("@/pages/admin/Users"));
const AdminAiToolsPage = lazy(() => import("@/pages/admin/AiTools"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/Orders"));
const AdminNotificationsPage = lazy(
  () => import("@/pages/admin/Notifications"),
);
const AdminContactMessagesPage = lazy(
  () => import("@/pages/admin/ContactMessages"),
);
const AdminReportsPage = lazy(() => import("@/pages/admin/Reports"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/Settings"));
const AdminSiteSettingsPage = lazy(() => import("@/pages/admin/SiteSettings"));
const AdminServicesPage = lazy(() => import("@/pages/admin/Services"));
const AdminServiceRequestsPage = lazy(() => import("@/pages/admin/ServiceRequests"));
const AdminTeamMembersPage = lazy(() => import("@/pages/admin/TeamMembers"));
const AdminTestimonialsPage = lazy(() => import("@/pages/admin/Testimonials"));
/* مساحة الخبير مستقلّة أيضاً — لا يحتاجها الطالب ولا الزائر */
const ExpertOrdersPage = lazy(() => import("@/pages/expert/Orders"));

/**
 * إشعارات أُنشئت قبل تصحيح الرابط تحمل مساراً بقطعة «orders/» زائدة لا
 * تطابق أي مسار مسجَّل، فتصل 404. الرابط الصحيح بلا هذه القطعة، فنحوّل
 * إليه بدل أن يُطبع الخطأ إلى الأبد في كل إشعار قديم مخزَّن.
 */
function RedirectToOrder() {
  const { id } = useParams();
  return <Navigate to={`/tools/cv-builder/${id}`} replace />;
}

export function App() {
  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {/* ---------- شاشات المصادقة: بلا هيدر أو فوتر ---------- */}
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-code" element={<VerifyCodePage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-success" element={<ResetSuccessPage />} />
          </Route>

          {/* ---------- لوحة الطالب ---------- */}
          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              {/* مبنية على بيانات طالب — لا يصلها أدمن ولا خبير */}
              <Route element={<RequireStudent />}>
                <Route path="/dashboard" element={<DashboardOverviewPage />} />
                <Route path="/dashboard/profile" element={<ProfilePage />} />
                <Route path="/dashboard/saved" element={<SavedPage />} />
                <Route path="/dashboard/documents" element={<DocumentsPage />} />
                <Route path="/dashboard/requests" element={<MyServiceRequestsPage />} />
              </Route>

              {/* عامّة لكل حساب: إشعاراته وإعداداته الشخصية */}
              <Route
                path="/dashboard/notifications"
                element={<NotificationsPage />}
              />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>

            {/* أدوات تتطلّب تسجيل دخول — بعرض الصفحة كاملاً */}
            <Route element={<PublicLayout />}>
              <Route path="/tools/cv-builder" element={<CvWizardPage />} />
              <Route
                path="/tools/cv-builder/:id"
                element={<CvOrderTrackingPage />}
              />
              {/* رابط قديم في إشعارات سابقة — عوّجناه، فنعيد توجيهه بدل 404 */}
              <Route
                path="/tools/cv-builder/orders/:id"
                element={<RedirectToOrder />}
              />
              <Route path="/tools/improve" element={<DocumentImprovementPage />} />
              <Route path="/tools/request" element={<ServiceRequestPage />} />
              <Route path="/services/:slug/request" element={<UnifiedServiceRequestPage />} />
            </Route>
          </Route>

          {/* ---------- لوحة الإدارة ---------- */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route
                path="/admin/scholarships"
                element={<AdminScholarshipsPage />}
              />
              <Route
                path="/admin/scholarships/new"
                element={<AdminScholarshipFormPage />}
              />
              <Route
                path="/admin/scholarships/:slug"
                element={<AdminScholarshipFormPage />}
              />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/ai-tools" element={<AdminAiToolsPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/services" element={<AdminServicesPage />} />
              <Route path="/admin/service-requests" element={<AdminServiceRequestsPage />} />
              <Route path="/admin/team-members" element={<AdminTeamMembersPage />} />
              <Route path="/admin/testimonials" element={<AdminTestimonialsPage />} />
              <Route
                path="/admin/notifications"
                element={<AdminNotificationsPage />}
              />
              <Route
                path="/admin/contact-messages"
                element={<AdminContactMessagesPage />}
              />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/site-settings" element={<AdminSiteSettingsPage />} />
            </Route>
          </Route>

          {/* ---------- مساحة عمل الخبير ---------- */}
          <Route element={<RequireExpert />}>
            <Route element={<ExpertLayout />}>
              <Route path="/expert" element={<ExpertOrdersPage />} />
            </Route>
          </Route>

          {/* ---------- الصفحات العامة ---------- */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
            <Route path="/tools" element={<ToolsHubPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route
              path="/scholarships/:slug"
              element={<ScholarshipDetailPage />}
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
