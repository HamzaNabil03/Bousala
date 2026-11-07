import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { authApi } from "@/api/endpoints";
import { parseApiError } from "@/api/client";
import { AuthCentered } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

const ERROR_MESSAGES = {
  not_configured: "تسجيل Google غير مهيّأ على الخادم بعد. أضف بيانات Google Cloud ثم حاول مجدداً.",
  invalid_state: "انتهت صلاحية محاولة الدخول أو تعذّر التحقق منها. ابدأ المحاولة من جديد.",
  cancelled: "ألغيت تسجيل الدخول عبر Google. يمكنك المحاولة مرة أخرى.",
  provider_error: "تعذّر إكمال الطلب لدى Google. حاول مرة أخرى.",
  missing_code: "لم يصل رمز المصادقة من Google. ابدأ المحاولة من جديد.",
  token_exchange_failed: "رفض Google إكمال تسجيل الدخول. تحقق من إعدادات عنوان إعادة التوجيه.",
  unverified_email: "يتطلب التسجيل بريداً إلكترونياً مؤكداً لدى Google.",
  account_exists: "يوجد حساب بهذا البريد بالفعل. سجّل دخوله بالبريد وكلمة المرور؛ لن نربطه تلقائياً حفاظاً على أمانه.",
  account_suspended: "هذا الحساب موقوف حالياً. تواصل مع الدعم لمزيد من التفاصيل.",
  provider_unavailable: "تعذّر الاتصال بخدمة Google حالياً. حاول لاحقاً.",
};

function safeNext(value) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function GoogleCallbackPage() {
  const { adoptSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const started = useRef(false);

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const providerError = params.get("error");
  const next = safeNext(params.get("next"));
  const initialError = providerError
    ? (ERROR_MESSAGES[providerError] ?? "تعذّر إكمال تسجيل الدخول عبر Google.")
    : !code
      ? "لم تكتمل محاولة تسجيل الدخول. ابدأ المحاولة من جديد."
      : null;

  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (providerError || !code) return;

    authApi
      .exchangeGoogle(code)
      .then(({ token, user }) => {
        adoptSession(token, user);
        const home = user?.is_admin_level ? "/admin" : user?.role === "expert" ? "/expert" : "/dashboard";
        navigate(next ?? home, { replace: true });
      })
      .catch((failure) => setError(parseApiError(failure).message));
  }, [adoptSession, code, navigate, next, providerError]);

  return (
    <AuthCentered
      title={error ? "تعذّر تسجيل الدخول" : "جارٍ تسجيل الدخول عبر Google"}
      description={error ? "لم تتغيّر بيانات حسابك، ويمكنك المحاولة مرة أخرى بأمان." : "نراجع بيانات الحساب وننشئ جلستك الآمنة…"}
      footer={false}
    >
      {error ? (
        <div className="space-y-4">
          <Alert tone="danger">{error}</Alert>
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-navy-800 px-4 text-sm font-semibold text-white transition hover:bg-navy-700"
          >
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center gap-3 py-5 text-sm text-ink-500">
          <Spinner className="size-8" />
          يرجى عدم إغلاق هذه الصفحة
        </div>
      )}
    </AuthCentered>
  );
}
