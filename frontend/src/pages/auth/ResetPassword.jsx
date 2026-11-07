import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, LockKeyhole, X } from "lucide-react";

import { AuthCentered } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Field";
import { authApi } from "@/api/endpoints";
import { useSubmit } from "@/hooks/useApi";

const RULES = [
  { key: "length", label: "٨ أحرف على الأقل", test: (v) => v.length >= 8 },
  { key: "mixed", label: "حرف كبير وحرف صغير", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: "number", label: "رقم واحد على الأقل", test: (v) => /\d/.test(v) },
  { key: "symbol", label: "رمز مثل ! أو @ أو #", test: (v) => /[^\w\s]/.test(v) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, code } = location.state ?? {};

  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const { submit, submitting, error, fieldErrors } = useSubmit(authApi.resetPassword);

  useEffect(() => {
    if (!email || !code) navigate("/forgot-password", { replace: true });
  }, [email, code, navigate]);

  const checks = useMemo(() => RULES.map((rule) => ({ ...rule, passed: rule.test(form.password) })), [form.password]);
  const mismatch =
    form.password_confirmation.length > 0 && form.password !== form.password_confirmation;

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await submit({ email, code, ...form });

    if (ok) navigate("/reset-success", { replace: true });
  };

  return (
    <AuthCentered
      icon={<LockKeyhole className="size-6" />}
      title="كلمة مرور جديدة"
      description="اختر كلمة مرور قوية. سيتم إنهاء جلساتك على جميع الأجهزة بعد التغيير."
    >
      {error ? (
        <Alert tone="danger" className="mb-5">
          {fieldErrors.code?.[0] ?? error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordInput
          label="كلمة المرور الجديدة"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={form.password}
          onChange={change("password")}
          error={fieldErrors.password?.[0]}
        />

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {checks.map((rule) => (
            <li
              key={rule.key}
              className={`flex items-center gap-1.5 text-xs ${rule.passed ? "text-[color:var(--color-success)]" : "text-ink-400"}`}
            >
              {rule.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {rule.label}
            </li>
          ))}
        </ul>

        <PasswordInput
          label="تأكيد كلمة المرور"
          name="password_confirmation"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={form.password_confirmation}
          onChange={change("password_confirmation")}
          error={mismatch ? "كلمتا المرور غير متطابقتين." : undefined}
        />

        <Button type="submit" className="w-full" loading={submitting} disabled={mismatch}>
          حفظ كلمة المرور
        </Button>
      </form>
    </AuthCentered>
  );
}
