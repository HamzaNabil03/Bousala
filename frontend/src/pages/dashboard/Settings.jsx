import { useState } from "react";
import {
  Bell,
  Globe,
  Laptop,
  LogOut,
  Lock,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, PasswordInput, Select, Switch } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { settingsApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { TIMEZONES } from "@/lib/constants";
import { formatDateAr, timeAgoAr } from "@/lib/utils";
import { mergeSettingsState, normalizeSettings } from "@/lib/settings";

export default function SettingsPage() {
  // الخصوصية إظهار الملف الأكاديمي للجامعات — مفهوم طالبي لا يخصّ حساباً إدارياً أو خبيراً
  const { isAdmin, isExpert } = useAuth();
  const isStaff = isAdmin || isExpert;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description={
          isStaff ? "أمان حسابك وتنبيهاتك وجلساتك النشطة." : "أمان حسابك وخصوصيتك وتنبيهاتك وجلساتك النشطة."
        }
      />

      <PasswordCard />
      {isStaff ? null : <PrivacyCard />}
      <NotificationsCard />
      <LocaleCard />
      <SessionsCard />
      <DangerZoneCard />
    </div>
  );
}

/* ---------------- كلمة المرور ---------------- */

function PasswordCard() {
  const [values, setValues] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const { submit, submitting, error, fieldErrors, success } = useSubmit(settingsApi.updatePassword);

  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await submit(values);
    if (ok) setValues({ current_password: "", new_password: "", new_password_confirmation: "" });
  };

  return (
    <Card>
      <CardHeader title="كلمة المرور" icon={<Lock className="size-4" />} />
      <CardBody>
        {success ? (
          <Alert tone="success" className="mb-4">
            تم تغيير كلمة المرور.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <PasswordInput
            label="كلمة المرور الحالية"
            className="sm:col-span-2"
            required
            autoComplete="current-password"
            value={values.current_password}
            onChange={change("current_password")}
            error={fieldErrors.current_password?.[0]}
          />
          <PasswordInput
            label="كلمة المرور الجديدة"
            required
            autoComplete="new-password"
            hint="٨ أحرف على الأقل مع حرف كبير وصغير ورقم ورمز."
            value={values.new_password}
            onChange={change("new_password")}
            error={fieldErrors.new_password?.[0]}
          />
          <PasswordInput
            label="تأكيد كلمة المرور"
            required
            autoComplete="new-password"
            value={values.new_password_confirmation}
            onChange={change("new_password_confirmation")}
            error={fieldErrors.new_password_confirmation?.[0]}
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>
              تغيير كلمة المرور
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/* ---------------- الخصوصية ---------------- */

function PrivacyCard() {
  const { user, setUser } = useAuth();
  const { submit, error } = useSubmit(settingsApi.updatePrivacy);

  const settings = user?.settings ?? {};

  const toggle = async (field, value) => {
    const next = normalizeSettings({
      ...settings,
      [field]: value,
    });

    setUser((current) => ({
      ...current,
      settings: { ...(current.settings ?? {}), ...next },
    }));
    const { ok, result } = await submit(next);
    if (ok) {
      setUser((current) => ({
        ...current,
        ...result,
        settings: mergeSettingsState(current.settings, result?.settings, next),
      }));
    }
  };

  return (
    <Card>
      <CardHeader title="الخصوصية" icon={<ShieldCheck className="size-4" />} />
      <CardBody className="divide-y divide-ink-900/10 py-1">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Switch
          label="إظهار ملفي للجهات المانحة"
          description="يسمح للجامعات والجهات المانحة بالاطلاع على ملفك الأكاديمي عند البحث عن مرشحين."
          checked={Boolean(settings.profile_visible)}
          onChange={(value) => toggle("profile_visible", value)}
        />
        <Switch
          label="مشاركة بياناتي مع الجامعات الشريكة"
          description="مغلق افتراضياً — لن نشارك بياناتك مع أي جهة إلا بتفعيلك هذا الخيار."
          checked={Boolean(settings.share_data_with_universities)}
          onChange={(value) => toggle("share_data_with_universities", value)}
        />
      </CardBody>
    </Card>
  );
}

/* ---------------- الإشعارات ---------------- */

function NotificationsCard() {
  const { user, setUser, isAdmin, isExpert } = useAuth();
  const { submit, error } = useSubmit(settingsApi.updateNotifications);
  const isStaff = isAdmin || isExpert;

  const settings = user?.settings ?? {};

  const toggle = async (field, value) => {
    const next = normalizeSettings({
      ...settings,
      [field]: value,
    });

    setUser((current) => ({
      ...current,
      settings: { ...(current.settings ?? {}), ...next },
    }));
    const { ok, result } = await submit(next);
    if (ok) {
      setUser((current) => ({
        ...current,
        ...result,
        settings: mergeSettingsState(current.settings, result?.settings, next),
      }));
    }
  };

  return (
    <Card>
      <CardHeader title="التنبيهات" icon={<Bell className="size-4" />} />
      <CardBody className="divide-y divide-ink-900/10 py-1">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {/* منح ومواعيد تقديم — تخصّ طالباً يتابع طلباته، لا حساباً إدارياً أو خبيراً */}
        {isStaff ? null : (
          <>
            <Switch
              label="منح جديدة تطابق ملفي"
              description="تنبيه عند إضافة منحة تتوافق مع مؤهلاتك."
              checked={Boolean(settings.notify_new_matches)}
              onChange={(value) => toggle("notify_new_matches", value)}
            />
            <Switch
              label="تحديثات طلباتي ومواعيد التقديم"
              description="تذكير قبل إغلاق باب التقديم وتحديثات طلب صياغة السيرة الذاتية."
              checked={Boolean(settings.notify_application_status)}
              onChange={(value) => toggle("notify_application_status", value)}
            />
          </>
        )}
        <Switch
          label="أخبار المنصة"
          description="مغلق افتراضياً — رسائل عن المزايا الجديدة في بَوْصلة."
          checked={Boolean(settings.notify_news)}
          onChange={(value) => toggle("notify_news", value)}
        />
      </CardBody>
    </Card>
  );
}

/* ---------------- اللغة والمنطقة ---------------- */

function LocaleCard() {
  const { user, setUser } = useAuth();
  const { submit, submitting, error, success } = useSubmit(settingsApi.updateLocale);

  const [values, setValues] = useState({
    locale: user?.locale ?? "ar",
    timezone: user?.timezone ?? "Asia/Riyadh",
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result } = await submit(values);
    if (ok) setUser((current) => ({ ...current, ...result }));
  };

  return (
    <Card>
      <CardHeader title="اللغة والمنطقة الزمنية" icon={<Globe className="size-4" />} />
      <CardBody>
        {success ? (
          <Alert tone="success" className="mb-4">
            تم حفظ التفضيلات.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Select
            label="لغة الواجهة"
            value={values.locale}
            onChange={(event) => setValues((current) => ({ ...current, locale: event.target.value }))}
            hint="الواجهة عربية بالكامل حالياً."
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </Select>

          <Select
            label="المنطقة الزمنية"
            value={values.timezone}
            onChange={(event) => setValues((current) => ({ ...current, timezone: event.target.value }))}
          >
            {TIMEZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </Select>

          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>
              حفظ
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/* ---------------- الجلسات ---------------- */

function SessionsCard() {
  const { clearSession } = useAuth();
  const { data, loading, error, reload } = useApi(settingsApi.sessions, []);
  const revoke = useSubmit(settingsApi.revokeSession);
  const revokeAll = useSubmit(settingsApi.revokeAllSessions);

  const onRevoke = async (session) => {
    const { ok, result } = await revoke.submit(session.id);
    if (!ok) return;

    if (result?.logged_out) {
      clearSession();
      return;
    }

    reload(true);
  };

  const onRevokeAll = async () => {
    const { ok, result } = await revokeAll.submit();
    if (!ok) return;

    if (result?.logged_out) {
      clearSession();
      return;
    }

    reload(true);
  };

  const others = (data ?? []).filter((session) => !session.is_current);

  return (
    <Card>
      <CardHeader
        title="الأجهزة والجلسات النشطة"
        subtitle="كل جهاز سجّلت الدخول منه يظهر هنا. أنهِ أي جلسة لا تعرفها."
        icon={<Laptop className="size-4" />}
        action={
          others.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onRevokeAll} loading={revokeAll.submitting}>
              <LogOut className="size-4" />
              إنهاء الجلسات الأخرى
            </Button>
          ) : null
        }
      />
      <CardBody className="p-0">
        {error ? (
          <Alert tone="danger" className="m-5">
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <LoadingBlock />
        ) : (
          <ul className="divide-y divide-ink-900/10">
            {(data ?? []).map((session) => (
              <li key={session.id} className="flex items-center gap-4 px-5 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-500/10 text-navy-600">
                  {session.device_type === "mobile" ? (
                    <Smartphone className="size-5" />
                  ) : (
                    <Laptop className="size-5" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-800">
                    {session.browser} — {session.os}
                    {session.is_current ? <Badge tone="success">هذا الجهاز</Badge> : null}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-ink-500">
                    {session.ip_address ? <span className="num">{session.ip_address}</span> : null}
                    <span>آخر نشاط {timeAgoAr(session.last_used_at)}</span>
                    <span>بدأت {formatDateAr(session.created_at)}</span>
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevoke(session)}
                  disabled={revoke.submitting}
                >
                  {session.is_current ? "تسجيل الخروج" : "إنهاء"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/* ---------------- المنطقة الخطرة ---------------- */

function DangerZoneCard() {
  const { clearSession } = useAuth();
  const [confirmText, setConfirmText] = useState("");

  const deactivate = useSubmit(settingsApi.deactivate);
  const destroy = useSubmit(settingsApi.deleteAccount);

  const onDeactivate = async () => {
    const { ok } = await deactivate.submit();
    if (ok) clearSession();
  };

  const onDelete = async (event) => {
    event.preventDefault();
    const { ok } = await destroy.submit(confirmText);
    if (ok) clearSession();
  };

  return (
    <Card>
      <CardHeader
        title="إجراءات الحساب"
        icon={<TriangleAlert className="size-4 text-[color:var(--color-danger)]" />}
      />
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl bg-[color:var(--color-warning)]/16 backdrop-blur-md p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#78350f]">تعطيل الحساب مؤقتاً</p>
            <p className="mt-1 text-[13px] leading-6 text-[#78350f]">
              يختفي ملفك ويتوقف استقبال التنبيهات. يمكنك العودة بتسجيل الدخول مجدداً.
            </p>
          </div>
          <Button variant="outline" onClick={onDeactivate} loading={deactivate.submitting} className="shrink-0">
            تعطيل الحساب
          </Button>
        </div>

        {deactivate.error ? <Alert tone="danger">{deactivate.error}</Alert> : null}

        <form onSubmit={onDelete} className="rounded-xl bg-[color:var(--color-danger)]/12 backdrop-blur-md p-4">
          <p className="font-bold text-[#7f1d1d]">حذف الحساب نهائياً</p>
          <p className="mt-1 text-[13px] leading-6 text-[#7f1d1d]">
            سيُحذف ملفك ومستنداتك وكل بياناتك ولا يمكن التراجع. اكتب{" "}
            <span className="font-extrabold">حذف</span> للتأكيد.
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              aria-label="تأكيد الحذف"
              placeholder="اكتب: حذف"
              className="sm:max-w-xs"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
            />
            <Button type="submit" variant="danger" disabled={confirmText !== "حذف"} loading={destroy.submitting}>
              حذف الحساب
            </Button>
          </div>

          {destroy.error ? (
            <Alert tone="danger" className="mt-3">
              {destroy.error}
            </Alert>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
