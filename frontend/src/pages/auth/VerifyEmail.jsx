import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";

import { AuthCentered } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { authApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useSubmit } from "@/hooks/useApi";

const RESEND_SECONDS = 60;

/**
 * تفعيل الحساب.
 *
 * بوجود رمز في الرابط تُنفَّذ العملية تلقائياً فور فتح الصفحة — المستخدم
 * ضغط الزر في بريده وانتهى دوره. وبدونه تُعرَض شاشة انتظار مع إعادة الإرسال.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useLocation();
  const { adoptSession } = useAuth();

  const token = params.get("token");
  const email = params.get("email") ?? "";

  const [notice, setNotice] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const activation = useSubmit(authApi.verifyEmail);
  const resend = useSubmit(authApi.resendVerification);

  // فتح الرابط يفعّل الحساب مرة واحدة، ولا يعيدها مع كل إعادة رسم
  const fired = useRef(false);

  useEffect(() => {
    if (!token || !email || fired.current) return;
    fired.current = true;

    (async () => {
      const { ok, result } = await activation.submit({ email, token });

      if (!ok) return;

      if (result?.already_verified) {
        navigate("/login", { replace: true, state: { notice: result.message } });
        return;
      }

      adoptSession(result.token, result.user);
      navigate(result.user?.is_admin_level ? "/admin" : "/dashboard", { replace: true });
    })();
  }, [token, email, activation, adoptSession, navigate]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const onResend = async () => {
    const { ok, result } = await resend.submit({ email });

    if (ok) {
      setNotice(result?.message ?? "أرسلنا رابط تفعيل جديد إلى بريدك.");
      setSeconds(RESEND_SECONDS);
    }
  };

  /* ---------- جارٍ التفعيل من الرابط ---------- */
  if (token && email && !activation.error) {
    return (
      <AuthCentered
        icon={<ShieldCheck className="size-6" />}
        title="جارٍ تفعيل حسابك…"
        description="لحظات ونحوّلك إلى لوحتك."
        footer={false}
      >
        <Spinner className="mx-auto my-6" />
      </AuthCentered>
    );
  }

  /* ---------- الرابط فشل، أو وصل المستخدم بلا رابط ---------- */
  return (
    <AuthCentered
      icon={<MailCheck className="size-6" />}
      title={activation.error ? "تعذّر تفعيل الحساب" : "فعّل حسابك من بريدك"}
      description={
        email ? (
          <>
            أرسلنا رابط التفعيل إلى
            <br />
            <span className="font-semibold text-navy-700" dir="ltr">
              {email}
            </span>
          </>
        ) : (
          "افتح رسالة التفعيل في بريدك واضغط زر «تفعيل الحساب»."
        )
      }
    >
      {activation.error ? (
        <Alert tone="danger" className="mb-5">
          {activation.fieldErrors.token?.[0] ?? activation.error}
        </Alert>
      ) : null}

      {state?.linkSent === false ? (
        <Alert tone="warning" className="mb-5" title="لم تغادر الرسالة الخادم">
          تعذّر إرسال البريد الآن. اضغط «إرسال رابط تفعيل جديد» بعد قليل.
        </Alert>
      ) : null}

      {notice ?? state?.notice ? (
        <Alert tone="success" className="mb-5">
          {notice ?? state?.notice}
        </Alert>
      ) : null}

      {resend.error ? (
        <Alert tone="danger" className="mb-5">
          {resend.error}
        </Alert>
      ) : null}

      {email ? (
        <Button
          className="w-full"
          onClick={onResend}
          loading={resend.submitting}
          disabled={seconds > 0}
        >
          {seconds > 0 ? (
            <>
              أعد الإرسال بعد <span className="num font-bold">{seconds}</span> ثانية
            </>
          ) : (
            "إرسال رابط تفعيل جديد"
          )}
        </Button>
      ) : null}

      <p className="mt-5 text-center text-xs leading-6 text-ink-500">
        تحقّق من مجلد الرسائل غير المرغوب فيها (Spam) إن لم تجد الرسالة في صندوق الوارد.
      </p>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline"
      >
        <ArrowRight className="size-4" />
        العودة لتسجيل الدخول
      </Link>
    </AuthCentered>
  );
}
