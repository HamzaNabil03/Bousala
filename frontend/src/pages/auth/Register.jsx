import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, LockKeyhole, Mail, UserRound, X } from "lucide-react";

import { AuthSplit } from "@/components/auth/AuthShell";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, PasswordInput } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useSubmit } from "@/hooks/useApi";

/** نفس قواعد Password::min(8)->mixedCase()->numbers()->symbols() في الخادم */
const RULES = [
  { key: "length", label: "٨ أحرف على الأقل", test: (v) => v.length >= 8 },
  { key: "mixed", label: "حرف كبير وحرف صغير", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: "number", label: "رقم واحد على الأقل", test: (v) => /\d/.test(v) },
  { key: "symbol", label: "رمز مثل ! أو @ أو #", test: (v) => /[^\w\s]/.test(v) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    accept_terms: false,
  });

  const { submit, submitting, error, fieldErrors } = useSubmit(register);

  const checks = useMemo(() => RULES.map((rule) => ({ ...rule, passed: rule.test(form.password) })), [form.password]);
  const strength = checks.filter((rule) => rule.passed).length;
  const mismatch =
    form.password_confirmation.length > 0 && form.password !== form.password_confirmation;

  const change = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result } = await submit(form);

    // الجلسة تبدأ بعد ضغط رابط التفعيل، لا بعد إنشاء الحساب.
    // البريد يُحمل في الرابط لا في حالة التوجيه، فتعمل الصفحة عند فتحها من جهاز آخر.
    if (ok) {
      const email = result?.email ?? form.email;
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        replace: true,
        state: { notice: result?.message, linkSent: result?.link_sent },
      });
    }
  };

  const strengthTone = ["bg-ink-200", "bg-[color:var(--color-danger)]", "bg-gold-400", "bg-gold-400/400", "bg-[color:var(--color-success)]"][strength];

  return (
    <AuthSplit
      asideSide="right"
      title="إنشاء حساب جديد"
      description="أنشئ ملفك الأكاديمي مرة واحدة، ودع بَوْصلة تبحث عن المنح المناسبة لك."
      badge="مجاناً بالكامل"
      aside={{
        title: "ابدأ رحلتك الدراسية مع بَوْصلة",
        description:
          "ملف أكاديمي واحد يكفي للتقديم على عشرات المنح — ونحن نرشّح لك الأنسب ونجهّز سيرتك الذاتية مجاناً.",
      }}
    >
      {error ? (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="الاسم الكامل"
          name="name"
          autoComplete="name"
          placeholder="مثال: سارة أحمد"
          icon={<UserRound className="size-4" />}
          required
          value={form.name}
          onChange={change("name")}
          error={fieldErrors.name?.[0]}
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          icon={<Mail className="size-4" />}
          required
          value={form.email}
          onChange={change("email")}
          error={fieldErrors.email?.[0]}
        />

        <div>
          <PasswordInput
            label="كلمة المرور"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<LockKeyhole className="size-4" />}
            required
            value={form.password}
            onChange={change("password")}
            error={fieldErrors.password?.[0]}
          />

          {form.password ? (
            <div className="mt-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${index < strength ? strengthTone : "bg-ink-200"}`}
                  />
                ))}
              </div>
              <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
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
            </div>
          ) : null}
        </div>

        <PasswordInput
          label="تأكيد كلمة المرور"
          name="password_confirmation"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<LockKeyhole className="size-4" />}
          required
          value={form.password_confirmation}
          onChange={change("password_confirmation")}
          error={mismatch ? "كلمتا المرور غير متطابقتين." : fieldErrors.password_confirmation?.[0]}
        />

        <Checkbox
          label={
            <span>
              أوافق على{" "}
              <Link to="/terms" className="font-semibold text-navy-600 hover:underline">
                شروط الاستخدام
              </Link>{" "}
              و
              <Link to="/privacy" className="font-semibold text-navy-600 hover:underline">
                سياسة الخصوصية
              </Link>
            </span>
          }
          checked={form.accept_terms}
          onChange={change("accept_terms")}
          error={fieldErrors.accept_terms?.[0]}
        />

        <Button type="submit" className="w-full" loading={submitting} disabled={mismatch}>
          إنشاء الحساب
        </Button>
      </form>

      <SocialButtons label="أو سجّل باستخدام" />

      <p className="mt-6 text-center text-sm text-ink-500">
        لديك حساب بالفعل؟{" "}
        <Link to="/login" className="font-semibold text-navy-700 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </AuthSplit>
  );
}
