import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";

import { AuthCentered } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { authApi } from "@/api/endpoints";
import { useSubmit } from "@/hooks/useApi";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { submit, submitting, error, fieldErrors } = useSubmit(authApi.forgotPassword);

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await submit({ email });

    if (ok) navigate("/verify-code", { state: { email } });
  };

  return (
    <AuthCentered
      icon={<KeyRound className="size-6" />}
      title="نسيت كلمة المرور؟"
      description="أدخل بريدك الإلكتروني وسنرسل لك رمزاً من ستة أرقام لإعادة تعيين كلمة المرور."
    >
      {error ? (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email?.[0]}
        />

        <Button type="submit" className="w-full" loading={submitting}>
          إرسال رمز الاستعادة
        </Button>
      </form>

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
