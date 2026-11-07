import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/* ============================================================
   مشاهد SVG — بديل الصور الفوتوغرافية في ملف التصميم
   ============================================================ */

/** خلفية سماء وغيوم — لشاشات استعادة كلمة المرور */
export function SkyScene({ className }) {
  return (
    <svg viewBox="0 0 1440 700" className={className} preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="sky-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7f9fdd" />
          <stop offset="55%" stopColor="#4a72c8" />
          <stop offset="100%" stopColor="#14306b" />
        </linearGradient>
      </defs>
      <rect width="1440" height="700" fill="url(#sky-bg)" />
      <g fill="#ffffff" opacity="0.18">
        <ellipse cx="230" cy="180" rx="150" ry="52" />
        <ellipse cx="330" cy="200" rx="110" ry="40" />
        <ellipse cx="1150" cy="130" rx="170" ry="58" />
        <ellipse cx="1030" cy="156" rx="110" ry="38" />
        <ellipse cx="700" cy="560" rx="220" ry="64" />
      </g>
      <g fill="#0b1a3d" opacity="0.25">
        <polygon points="0,700 220,470 430,700" />
        <polygon points="330,700 620,430 900,700" />
        <polygon points="820,700 1120,480 1440,700" />
      </g>
    </svg>
  );
}

/* ============================================================
   الأغلفة
   ============================================================ */

/** عنوان موحّد داخل بطاقة المصادقة */
export function AuthCardHeader({ title, description, icon }) {
  return (
    <div className="mb-6 text-center">
      {icon ? (
        <div className="glass-soft mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-navy-700">
          {icon}
        </div>
      ) : null}
      <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-7 text-ink-500">{description}</p> : null}
    </div>
  );
}

/**
 * شاشة مقسومة: نموذج على جانب ولوحة ترحيب كحلية على الجانب الآخر.
 * تُستخدم في تسجيل الدخول وإنشاء الحساب.
 */
export function AuthSplit({ title, description, badge, children, aside, asideSide = "right" }) {
  const asideOnLeft = asideSide === "left";

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-2" dir="ltr">
      <aside
        dir="rtl"
        className={cn(
          "relative hidden min-h-dvh flex-col items-center justify-center overflow-hidden bg-navy-900 px-8 py-12 text-white lg:flex lg:px-14",
          asideOnLeft ? "lg:order-1" : "lg:order-2",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(246,196,69,0.14),transparent_54%)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
          <Logo tone="white" markClassName="size-36 rounded-3xl bg-white p-2 shadow-xl" />
          <div className="mt-12">
            {badge ? (
              <span className="mb-4 inline-flex rounded-full bg-gold-400/20 px-4 py-1.5 text-sm font-semibold text-gold-200">
                {badge}
              </span>
            ) : null}
            <h2 className="font-display text-3xl leading-snug">{aside?.title}</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-8 text-navy-100">{aside?.description}</p>
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-7 text-center text-xs text-navy-200">
          © <span className="num">{new Date().getFullYear()}</span> بَوْصلة — جميع الحقوق محفوظة
        </p>
      </aside>

      {/* النموذج */}
      <main
        dir="rtl"
        className={cn(
          "order-1 flex min-h-dvh flex-col justify-center px-4 py-8 sm:px-8 lg:px-12",
          asideOnLeft ? "lg:order-2" : "lg:order-1",
        )}
      >
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-5 flex justify-center">
            <Logo markClassName="size-24" />
          </div>
          <div>
            <AuthCardHeader title={title} description={description} />
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-ink-400">
            بمتابعتك أنت توافق على{" "}
            <Link to="/terms" className="font-semibold text-navy-600 hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و
            <Link to="/privacy" className="font-semibold text-navy-600 hover:underline">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * بطاقة في منتصف خلفية سماوية — لشاشات استعادة كلمة المرور.
 */
export function AuthCentered({ title, description, icon, children, className, footer = true }) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(135deg,#f7f9fc_0%,#eaf3fb_100%)]">
      <div className="flex min-h-dvh flex-col px-4 py-8">
        <div className="mb-auto">
          <Logo />
        </div>

        <div className={cn("mx-auto w-full max-w-md", className)}>
          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <AuthCardHeader title={title} description={description} icon={icon} />
            {children}
          </div>
        </div>

        <div className="mt-auto pt-8 text-center text-xs text-ink-500">
          {footer ? (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link to="/privacy" className="hover:text-navy-800 hover:underline">
                سياسة الخصوصية
              </Link>
              <Link to="/terms" className="hover:text-navy-800 hover:underline">
                شروط الاستخدام
              </Link>
              <Link to="/contact" className="hover:text-navy-800 hover:underline">
                تواصل معنا
              </Link>
            </div>
          ) : null}
          <p className="mt-3">
            © <span className="num">{new Date().getFullYear()}</span> بَوْصلة
          </p>
        </div>
      </div>
    </div>
  );
}
