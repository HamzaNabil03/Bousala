import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";

import { AuthSplit } from "@/components/auth/AuthShell";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, PasswordInput } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useSubmit } from "@/hooks/useApi";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", remember: true });

  const { submit, submitting, error, fieldErrors } = useSubmit(login);

  const next = new URLSearchParams(location.search).get("next");
  const notice = location.state?.notice;

  const change = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result, error: failure } = await submit(form);

    // حساب غير مفعَّل: الخادم أرسل رابطاً جديداً وننقله لشاشة التفعيل
    if (!ok && failure?.status === 409) {
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        state: { notice: failure.message, linkSent: failure.data?.link_sent },
      });
      return;
    }

    if (ok) {
      const home = result?.is_admin_level ? "/admin" : result?.role === "expert" ? "/expert" : "/dashboard";
      navigate(next || home, { replace: true });
    }
  };

  return (
    <AuthSplit
      asideSide="left"
      title="تسجيل الدخول"
      description="أهلاً بعودتك — تابع رحلتك نحو المنحة المناسبة."
      badge="منصة بَوْصلة"
      aside={{
        title: "منحتك القادمة على بُعد خطوة واحدة",
        description:
          "سجّل دخولك لمتابعة المنح المطابقة لملفك، ومواعيد التقديم، وحالة طلب صياغة سيرتك الذاتية.",
      }}
    >
      {notice ? (
        <Alert tone="success" className="mb-5">
          {notice}
        </Alert>
      ) : null}

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
          icon={<Mail className="size-4" />}
          required
          value={form.email}
          onChange={change("email")}
          error={fieldErrors.email?.[0]}
        />

        <PasswordInput
          label="كلمة المرور"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<LockKeyhole className="size-4" />}
          required
          value={form.password}
          onChange={change("password")}
          error={fieldErrors.password?.[0]}
        />

        <div className="flex items-center justify-between gap-4">
          <Checkbox label="تذكّرني" checked={form.remember} onChange={change("remember")} />
          <Link to="/forgot-password" className="text-sm font-semibold text-navy-600 hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          تسجيل الدخول
        </Button>
      </form>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-ink-500">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="font-semibold text-navy-700 hover:underline">
          أنشئ حساباً جديداً
        </Link>
      </p>
    </AuthSplit>
  );
}
