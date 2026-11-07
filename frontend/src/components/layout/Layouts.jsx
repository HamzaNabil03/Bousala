import { Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { ExpertTopbar } from "@/components/layout/ExpertTopbar";
import { FullPageLoader, LoadingBlock } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

/* ============================================================
   حرّاس المسارات
   ============================================================ */

/** يشترط تسجيل الدخول */
export function RequireAuth() {
  const { isAuthenticated, loading, signedOut } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthenticated) {
    /*
     * الوجهة المحفوظة تخدم من فُصل عن صفحة أرادها فعلاً. أما بعد خروج
     * صريح فهي تخصّ الجلسة المنتهية، وحملُها يهبط بالداخل بعده — وقد
     * يكون حساباً آخر — على صفحة سابقه.
     */
    const target = signedOut
      ? "/login"
      : `/login?next=${encodeURIComponent(location.pathname)}`;

    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

/** يشترط صلاحية إدارية */
export function RequireAdmin() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** يشترط حساب خبير — مساحة عمل مستقلّة عن لوحة الطالب ولوحة الإدارة */
export function RequireExpert() {
  const { isAuthenticated, isExpert, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isExpert) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/**
 * يقصر صفحات لوحة الطالب على الطلاب وحدهم.
 *
 * نظرة عامة، الملف الأكاديمي، المحفوظات، والمستندات كلها مبنية على
 * بيانات طالب (ملف أكاديمي، مطابقة منح، مستندات مرفوعة) — لا معنى لها
 * لحساب إداري أو خبير، وقد لا يملك أصلاً السجلّ الذي تعتمد عليه هذه
 * الشاشات. الإعدادات والإشعارات عامّة لكل حساب فلا تمرّ بهذا الحارس.
 */
export function RequireStudent() {
  const { isAuthenticated, isAdmin, isExpert, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isExpert) return <Navigate to="/expert" replace />;

  return <Outlet />;
}

/**
 * يمنع المستخدم المسجّل من فتح صفحات الدخول والتسجيل.
 *
 * هذا الحارس هو مرجع الوجهة بعد نجاح المصادقة: يُعاد تقييمه فور ضبط
 * المستخدم بينما الصفحة ما زالت صفحة مصادقة، فيسبق أي توجيه داخلها.
 * لذا يحترم next ويميّز المشرف — وإلا هبط المشرف على لوحة الطالب.
 */
export function GuestOnly() {
  const { isAuthenticated, isAdmin, isExpert, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (isAuthenticated) {
    const next = new URLSearchParams(location.search).get("next");
    const home = isAdmin ? "/admin" : isExpert ? "/expert" : "/dashboard";

    /*
     * حصانة ثانية: الوجهة تُحترم فقط إن ناسبت دور الداخل. مسار إداري أو
     * مساحة الخبير لا يفتحهما من ليس صاحبهما، ومسارات الطلاب ليست وجهة
     * المشرف أو الخبير الطبيعية.
     */
    const suitable =
      next?.startsWith("/") &&
      !next.startsWith("//") &&
      (isAdmin
        ? next.startsWith("/admin")
        : isExpert
          ? next.startsWith("/expert")
          : !next.startsWith("/admin") && !next.startsWith("/expert"));

    return <Navigate to={suitable ? next : home} replace />;
  }

  return <Outlet />;
}

/* ============================================================
   التخطيطات
   ============================================================ */

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<LoadingBlock />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

export function DashboardLayout() {
  /*
   * النسبة تأتي من سياق المصادقة لا من جلبٍ خاص: هذا التخطيط أب للمسارات
   * فلا يُفكّ تركيبه عند التنقّل بينها، وجلبٌ بلا تبعيات كان ينفّذ مرة
   * واحدة فتتجمّد النسبة حتى إعادة تحميل الصفحة كاملة.
   */
  const { user } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container-page flex-1 py-8">
        <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
          <DashboardSidebar completionPercent={user?.completion_percent ?? 0} />
          <div className="min-w-0">
            <Suspense fallback={<LoadingBlock />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function AdminLayout() {
  // القائمة درجٌ على الهاتف، وعمود ثابت من lg فصاعداً
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenNav={() => setNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        </main>

        <footer className="glass-soft rounded-none border-x-0 border-b-0 px-4 py-4 sm:px-6">
          <p className="text-[11.5px] text-ink-400">
            منصة بَوْصلة — لوحة الإدارة الأكاديمية
          </p>
        </footer>
      </div>
    </div>
  );
}

/**
 * مساحة عمل الخبير — قسم مستقلّ عن لوحة الطالب ولوحة الإدارة، بصفحة
 * واحدة (طلباتي)، فلا يحتاج قائمة جانبية كالإدارة، شريطاً علوياً يكفي.
 */
export function ExpertLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ExpertTopbar />

      <main className="container-page flex-1 py-8">
        <Suspense fallback={<LoadingBlock />}>
          <Outlet />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
