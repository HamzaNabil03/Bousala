import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { notificationApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { isAuthenticated, isAdmin, isExpert } = useAuth();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigation = isAuthenticated && !isAdmin && !isExpert
    ? [...PUBLIC_NAV, { to: "/dashboard/requests", label: "طلباتي" }]
    : PUBLIC_NAV;

  // إغلاق قائمة الجوال عند تغيّر المسار
  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return undefined;
    }

    let cancelled = false;

    notificationApi
      .unreadCount()
      .then((count) => {
        if (!cancelled) setUnread(count);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur-xl">
        <div className="container-page flex h-[78px] items-center justify-between gap-4">
          <div className="flex items-center gap-10">
            <Logo />

            <nav className="hidden items-center gap-2 md:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "relative rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                      isActive ? "text-navy-900" : "text-ink-800 hover:text-navy-900",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-navy-900" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard/notifications"
                  aria-label={`الإشعارات${unread ? ` (${unread} غير مقروء)` : ""}`}
                  className="relative rounded-full p-2 text-ink-700 transition-colors hover:bg-white/60 hover:text-navy-900"
                >
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-[color:var(--color-danger)] ring-2 ring-white" />
                  )}
                </Link>
                <span className="hidden h-7 w-px bg-ink-900/20 sm:block" />
                <UserMenu />
              </>
            ) : (
              <>
                <ButtonLink
                  to="/login"
                  variant="primary"
                  size="sm"
                  className="hidden min-w-28 sm:inline-flex"
                >
                  تسجيل الدخول
                </ButtonLink>
                <ButtonLink to="/register" variant="outline" size="sm" className="border-navy-700/25 bg-white text-navy-800">
                  إنشاء حساب جديد
                </ButtonLink>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة"
              className="rounded-lg p-2 text-ink-800 transition-colors hover:bg-white/60 md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/*
       * الدرج خارج الترويسة عمداً: عنصر فيه backdrop-filter يصير المرجع
       * لكل fixed بداخله، فلو بقي الدرج داخلها انحصر في شريطها بدل الشاشة.
       */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="glass-strong absolute inset-y-0 end-0 flex w-72 max-w-[85vw] flex-col rounded-none border-y-0 border-e-0 p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display font-bold text-navy-800">القائمة</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="إغلاق القائمة"
                className="rounded-lg p-1.5 text-ink-500 hover:bg-white/60"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                      isActive ? "bg-navy-500/12 text-navy-700" : "text-ink-600 hover:bg-white/60",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {!isAuthenticated && (
              <div className="mt-auto flex flex-col gap-2 border-t border-ink-900/10 pt-4">
                <ButtonLink to="/login" variant="outline" fullWidth>
                  تسجيل الدخول
                </ButtonLink>
                <ButtonLink to="/register" fullWidth>
                  إنشاء حساب
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
