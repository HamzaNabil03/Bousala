import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutGrid, LogOut, Settings, UserRound } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, isAdmin, isExpert, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  /*
   * القائمة تُعرَض في body لا داخل الترويسة: الترويسة تحمل backdrop-filter،
   * وهو يصنع «جذر خلفية» يحرم ما بداخله من تمويه ما وراءه — فتظهر القائمة
   * طبقة مسطّحة فوق نصّ حادّ بدل زجاج.
   */
  const panelStyle = useAnchoredPanel(open, anchorRef, { width: 224 });

  useEffect(() => {
    if (!open) return undefined;

    function onClick(event) {
      const inAnchor = anchorRef.current?.contains(event.target);
      const inPanel = panelRef.current?.contains(event.target);

      if (!inAnchor && !inPanel) setOpen(false);
    }

    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login");
  }

  const panel = (
    <div
      role="menu"
      ref={panelRef}
      style={panelStyle ?? undefined}
      className="glass-strong fixed z-50 overflow-hidden rounded-xl py-1.5"
    >
      <div className="border-b border-ink-900/8 px-3.5 pb-2.5 pt-1">
        <p className="truncate text-[13px] font-bold text-ink-900">{user.name}</p>
      </div>

      {/*
       * حساب إداري أو خبير ليس طالباً: وجهته مساحته الخاصة لا لوحة
       * الطالب ولا ملفها الأكاديمي — فلا تظهر له روابطهما أصلاً.
       */}
      {isAdmin ? (
        <MenuLink to="/admin" onClick={() => setOpen(false)} icon={<LayoutGrid className="size-4" />}>
          لوحة التحكم الإدارية
        </MenuLink>
      ) : isExpert ? (
        <MenuLink to="/expert" onClick={() => setOpen(false)} icon={<LayoutGrid className="size-4" />}>
          مساحة عمل الخبير
        </MenuLink>
      ) : (
        <>
          <MenuLink to="/dashboard" onClick={() => setOpen(false)} icon={<LayoutGrid className="size-4" />}>
            لوحتي
          </MenuLink>
          <MenuLink to="/dashboard/profile" onClick={() => setOpen(false)} icon={<UserRound className="size-4" />}>
            الملف الأكاديمي
          </MenuLink>
        </>
      )}
      <MenuLink to="/dashboard/settings" onClick={() => setOpen(false)} icon={<Settings className="size-4" />}>
        الإعدادات
      </MenuLink>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-1 flex w-full items-center gap-2.5 border-t border-ink-900/8 px-3.5 py-2 pt-2.5 text-start text-[13px] font-semibold text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/12"
      >
        <LogOut className="size-4" />
        تسجيل الخروج
      </button>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        ref={anchorRef}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 ps-1 pe-2 transition-colors hover:bg-white/60"
      >
        <Avatar name={user.name} src={user.avatar_url} size={34} />
        <span className="hidden text-[13px] font-semibold text-ink-800 sm:inline">{user.first_name}</span>
        <ChevronDown className={cn("size-3.5 text-ink-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && panelStyle ? createPortal(panel, document.body) : null}
    </div>
  );
}

function MenuLink({ to, icon, onClick, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-ink-800 transition-colors hover:bg-white/60"
    >
      <span className="text-ink-500">{icon}</span>
      {children}
    </Link>
  );
}
