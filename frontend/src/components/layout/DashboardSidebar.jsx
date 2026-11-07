import { NavLink, useNavigate } from "react-router-dom";
import { CircleHelp, LogOut } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_NAV, STAFF_DASHBOARD_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINK_BASE =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors";

/**
 * قائمة لوحة الطالب.
 *
 * على الشاشات الكبيرة عمود ملتصق إلى جانب المحتوى. وعلى الهاتف تُطوى إلى
 * صفّ مدمج: بطاقة المستخدم أفقية، والأقسام شريط أزرار يُمرَّر جانبياً —
 * وإلا سبق المحتوى عمودٌ بطول الشاشة في كل صفحة.
 *
 * هذه اللوحة تصل إليها الآن حسابات إدارية وخبراء أيضاً — للإعدادات
 * والإشعارات وحدها، فباقي الصفحات مقصورة على الطلاب (RequireStudent).
 * نسبة الاكتمال وزرّ تحديث الملف مفهومان طالبيّان بحتان فلا يظهران
 * لغيرهم، والأقسام المعروضة تقتصر على ما يصلونه فعلاً.
 */
export function DashboardSidebar({ completionPercent }) {
  const { user, logout, isAdmin, isExpert } = useAuth();
  const navigate = useNavigate();
  const isStaff = isAdmin || isExpert;
  const navItems = isStaff ? STAFF_DASHBOARD_NAV : DASHBOARD_NAV;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
      <div className="glass min-w-0 rounded-2xl p-4 lg:p-5">
        {/* بطاقة المستخدم: أفقية على الهاتف، عمودية على الشاشات الكبيرة */}
        <div className="flex items-center gap-3 border-b border-ink-900/8 pb-4 lg:flex-col lg:gap-0 lg:pb-5 lg:text-center">
          <span className="shrink-0 lg:hidden">
            <Avatar name={user?.name} src={user?.avatar_url} size={48} />
          </span>
          <span className="hidden lg:block">
            <Avatar name={user?.name} src={user?.avatar_url} size={72} />
          </span>

          <div className="min-w-0 flex-1 lg:mt-3 lg:flex-none">
            <p className="truncate text-[15px] font-bold text-ink-900">{user?.name}</p>
            <p className="mt-0.5 text-[12px] text-ink-500">
              {isStaff ? (
                user?.role_label
              ) : (
                <>
                  مكتمل بنسبة <span className="num font-semibold">{completionPercent ?? 0}%</span>
                </>
              )}
            </p>
          </div>

          {isStaff ? null : (
            <NavLink
              to="/dashboard/profile"
              className="flex min-h-10 shrink-0 items-center rounded-lg bg-navy-700 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 lg:mt-3 lg:w-full lg:justify-center"
            >
              تحديث الملف
            </NavLink>
          )}
        </div>

        {/*
         * شريط الأقسام على الهاتف: تمرير جانبي داخل حدود البطاقة.
         * الهوامش السالبة تمدّ منطقة التمرير إلى حافة البطاقة فلا يبدو
         * الزرّ الأخير مقصوصاً في المنتصف.
         */}
        <nav className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-slim lg:mx-0 lg:mt-4 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  LINK_BASE,
                  "shrink-0 whitespace-nowrap lg:shrink lg:whitespace-normal",
                  isActive ? "glass-gold text-navy-900" : "text-ink-600 hover:bg-white/60 hover:text-ink-900",
                )
              }
            >
              <Icon name={item.icon} className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* المساعدة والخروج متاحان من قائمة المستخدم في الترويسة على الهاتف */}
        <div className="mt-5 hidden flex-col gap-0.5 border-t border-ink-900/8 pt-4 lg:flex">
          <NavLink
            to="/help"
            className={cn(LINK_BASE, "font-medium text-ink-500 hover:bg-white/60 hover:text-ink-800")}
          >
            <CircleHelp className="size-4" />
            مركز المساعدة
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              LINK_BASE,
              "w-full text-start font-medium text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/12",
            )}
          >
            <LogOut className="size-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </aside>
  );
}
