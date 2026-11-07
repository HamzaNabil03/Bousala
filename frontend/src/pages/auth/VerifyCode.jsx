import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, MailCheck } from "lucide-react";

import { AuthCentered } from "@/components/auth/AuthShell";
import { CODE_LENGTH, CodeInput, emptyCode } from "@/components/auth/CodeInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/api/endpoints";
import { useSubmit } from "@/hooks/useApi";

const RESEND_SECONDS = 60;

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [digits, setDigits] = useState(emptyCode);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(null);
  const codeInput = useRef(null);

  const { submit, submitting, error, fieldErrors } = useSubmit(authApi.verifyCode);
  const resend = useSubmit(authApi.resendCode);

  // بلا بريد لا معنى للشاشة — نعيد المستخدم لبداية المسار
  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const code = digits.join("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await submit({ email, code });

    if (ok) navigate("/reset-password", { state: { email, code } });
  };

  const onResend = async () => {
    const { ok } = await resend.submit({ email });

    if (ok) {
      setResent("تم إرسال رمز جديد إلى بريدك الإلكتروني.");
      setSeconds(RESEND_SECONDS);
      setDigits(emptyCode());
      codeInput.current?.focusFirst();
    }
  };

  return (
    <AuthCentered
      icon={<MailCheck className="size-6" />}
      title="تحقّق من بريدك"
      description={
        <>
          أرسلنا رمزاً من ستة أرقام إلى
          <br />
          <span className="font-semibold text-navy-700" dir="ltr">
            {email}
          </span>
        </>
      }
    >
      {resent ? (
        <Alert tone="success" className="mb-5">
          {resent}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" className="mb-5">
          {fieldErrors.code?.[0] ?? error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <CodeInput ref={codeInput} digits={digits} onChange={setDigits} disabled={submitting} />

        <Button type="submit" className="w-full" loading={submitting} disabled={code.length < CODE_LENGTH}>
          تأكيد الرمز
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-ink-500">
        لم يصلك الرمز؟{" "}
        {seconds > 0 ? (
          <span>
            أعد الإرسال بعد <span className="num font-semibold text-navy-700">{seconds}</span> ثانية
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resend.submitting}
            className="font-semibold text-navy-600 hover:underline disabled:opacity-60"
          >
            {resend.submitting ? "جارٍ الإرسال…" : "إعادة الإرسال"}
          </button>
        )}
      </div>

      <Link
        to="/forgot-password"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline"
      >
        <ArrowRight className="size-4" />
        تغيير البريد الإلكتروني
      </Link>
    </AuthCentered>
  );
}
