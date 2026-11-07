import { useNavigate } from "react-router-dom";
import { LogOut, UserRoundCheck } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

/**
 * شريط مساحة عمل الخبير.
 *
 * صفحة واحدة (طلباتي)، فلا حاجة لقائمة جانبية أو بحث كلوحة الإدارة —
 * شريطٌ علوي يعرّف المكان ويتيح الخروج يكفي.
 */
export function ExpertTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="glass-header sticky top-0 z-30 rounded-none border-x-0 border-t-0">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo to="/expert" />
          <span className="hidden items-center gap-1.5 rounded-md bg-navy-500/10 px-2 py-1 text-[11px] font-bold text-navy-700 sm:inline-flex">
            <UserRoundCheck className="size-3" />
            مساحة عمل الخبير
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-end sm:block">
            <p className="truncate text-[13px] font-bold text-ink-900">{user?.name}</p>
            <p className="truncate text-[11px] text-ink-500">{user?.role_label}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 text-[12.5px] font-semibold text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/12"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
