import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { googleAuthUrl } from "@/api/endpoints";

/**
 * أزرار الدخول عبر مزوّدي الهوية.
 * لا يوجد OAuth مُهيّأ في هذه النسخة، فتُظهر الأزرار تنبيهاً واضحاً
 * بدل أن تقود المستخدم إلى صفحة معطّلة.
 */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function SocialButtons({ label = "أو تابع باستخدام" }) {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const startGoogleAuth = () => {
    if (loading) return;
    setLoading(true);
    const requestedNext = new URLSearchParams(location.search).get("next");
    window.location.assign(googleAuthUrl(requestedNext));
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <button
        type="button"
        onClick={startGoogleAuth}
        disabled={loading}
        aria-busy={loading}
        className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-900/15 bg-white px-4 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-5 animate-spin text-navy-600" /> : <GoogleIcon />}
        <span>{loading ? "جارٍ التحويل إلى Google…" : "المتابعة باستخدام Google"}</span>
      </button>
    </div>
  );
}
