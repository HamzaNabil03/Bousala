import { useEffect, useState } from "react";
import { Globe2, Image as ImageIcon, Phone, RotateCcw, Save, Share2, Upload } from "lucide-react";

import { adminApi } from "@/api/endpoints";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi, useSubmit } from "@/hooks/useApi";

const SITE_FIELDS = [
  ["name", "اسم الموقع", true],
  ["name_en", "اسم الموقع بالإنجليزية"],
  ["tagline", "الوصف المختصر"],
  ["contact_email", "بريد التواصل الرئيسي", true, "email"],
  ["secondary_email", "البريد الثانوي", false, "email"],
  ["phone", "رقم الهاتف", false, "tel"],
  ["whatsapp", "رقم واتساب", false, "tel"],
  ["address", "العنوان"],
  ["working_hours", "ساعات العمل"],
  ["copyright_text", "نص حقوق النشر"],
];

const SOCIAL_FIELDS = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["telegram", "Telegram"],
  ["x", "X / Twitter"],
];

const MEDIA = [
  ["hero", "صورة الواجهة الرئيسية", "يفضل 1400×768 أو أكبر، بنسبة عريضة."],
  ["cta", "صورة دعوة بدء الرحلة", "يفضل 1200×670 أو أكبر، بنسبة عريضة."],
  ["logo", "شعار الموقع", "PNG أو WebP بخلفية شفافة إن أمكن."],
  ["favicon", "أيقونة المتصفح", "صورة مربعة لا تقل عن 32×32."],
];

export default function AdminSiteSettingsPage() {
  const { data, loading, error: loadError } = useApi(adminApi.siteSettings, []);

  if (loading) return <LoadingBlock className="py-24" />;
  if (loadError) return <Alert tone="danger">{loadError}</Alert>;

  return <SiteSettingsForm data={data} />;
}

function SiteSettingsForm({ data }) {
  const [form, setForm] = useState(() => ({ site: data?.site ?? {}, social: data?.social ?? {} }));
  const [media, setMedia] = useState(() => data?.media ?? {});
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [dirty, setDirty] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [restoreMessage, setRestoreMessage] = useState(null);
  const { submit, submitting, error, fieldErrors, success, reset } = useSubmit(adminApi.updateSiteSettings);

  useEffect(() => {
    const prevent = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  const set = (section, key) => (event) => {
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [key]: event.target.value },
    }));
    setDirty(true);
    reset();
  };

  const chooseFile = (slot) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previews[slot]?.startsWith("blob:")) URL.revokeObjectURL(previews[slot]);
    setFiles((current) => ({ ...current, [slot]: file }));
    setPreviews((current) => ({ ...current, [slot]: URL.createObjectURL(file) }));
    setDirty(true);
    reset();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form.site).forEach(([key, value]) => payload.append(`site[${key}]`, value ?? ""));
    Object.entries(form.social).forEach(([key, value]) => payload.append(`social[${key}]`, value ?? ""));
    Object.entries(files).forEach(([slot, file]) => file && payload.append(slot, file));

    const { ok, result } = await submit(payload);
    if (!ok) return;

    setDirty(false);
    setFiles({});
    setPreviews({});
    if (result?.data?.media) setMedia(result.data.media);
    window.dispatchEvent(new Event("site-settings-updated"));
    localStorage.setItem("bousla_site_settings_updated", JSON.stringify(result?.data?.public ?? {}));
  };

  const restore = async (slot) => {
    setRestoring(slot);
    setRestoreMessage(null);
    try {
      const result = await adminApi.restoreSiteMedia(slot);
      setMedia(result.data.media);
      setFiles((current) => ({ ...current, [slot]: null }));
      if (previews[slot]?.startsWith("blob:")) URL.revokeObjectURL(previews[slot]);
      setPreviews((current) => ({ ...current, [slot]: null }));
      setRestoreMessage(result.message);
      window.dispatchEvent(new Event("site-settings-updated"));
      localStorage.setItem("bousla_site_settings_updated", JSON.stringify(result?.data?.public ?? {}));
    } catch {
      setRestoreMessage("تعذرت استعادة الصورة السابقة.");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <PageHeader title="إعدادات الموقع" description="إدارة هوية الموقع وبيانات التواصل وروابط الشبكات وصور الصفحة الرئيسية من مكان واحد." />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {success ? <Alert tone="success">تم حفظ إعدادات الموقع ونشرها في الواجهة العامة.</Alert> : null}
      {restoreMessage ? <Alert tone="info">{restoreMessage}</Alert> : null}
      {dirty ? <Alert tone="warning">لديك تغييرات غير محفوظة.</Alert> : null}

      <Card>
        <CardHeader title="معلومات الموقع" subtitle="تظهر في العنوان والفوتر وصفحة التواصل." icon={<Globe2 className="size-4" />} />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {SITE_FIELDS.map(([key, label, required, type]) => (
              <Input key={key} label={label} required={required} type={type ?? "text"} value={form.site[key] ?? ""} onChange={set("site", key)} error={fieldErrors[`site.${key}`]?.[0]} />
            ))}
          </div>
          <Textarea label="وصف الموقع" rows={4} value={form.site.description ?? ""} onChange={set("site", "description")} error={fieldErrors["site.description"]?.[0]} />
          <Textarea label="وصف الفوتر" rows={3} value={form.site.footer_description ?? ""} onChange={set("site", "footer_description")} error={fieldErrors["site.footer_description"]?.[0]} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="التواصل" subtitle="تُستخدم القيم تلقائياً في روابط الهاتف والبريد وواتساب." icon={<Phone className="size-4" />} />
        <CardBody>
          <p className="text-sm leading-7 text-ink-600">اكتب رقم واتساب بصيغة دولية، مثال: <span dir="ltr" className="num">+970599000000</span>. تُزال المسافات والرموز تلقائياً عند إنشاء رابط المحادثة.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="روابط الشبكات الاجتماعية" subtitle="الأيقونة لا تظهر في الموقع إن تُرك الرابط فارغاً." icon={<Share2 className="size-4" />} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map(([key, label]) => (
              <Input key={key} label={label} type="url" dir="ltr" placeholder="https://" value={form.social[key] ?? ""} onChange={set("social", key)} error={fieldErrors[`social.${key}`]?.[0]} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="صور الموقع والصفحة الرئيسية" subtitle="يمكن رفع بديل، معاينته، ثم نشره مع بقية الإعدادات." icon={<ImageIcon className="size-4" />} />
        <CardBody>
          <div className="grid gap-5 md:grid-cols-2">
            {MEDIA.map(([slot, label, hint]) => {
              const item = media[slot] ?? {};
              const preview = previews[slot] || item.url;
              return (
                <section key={slot} className="rounded-2xl border border-ink-900/10 bg-white/60 p-4">
                  <div className="aspect-[16/9] overflow-hidden rounded-xl bg-ink-100">
                    {preview ? <img src={preview} alt={`معاينة ${label}`} className="size-full object-contain" /> : null}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-navy-800">{label}</h3>
                  <p className="mt-1 text-xs leading-6 text-ink-500">{hint}</p>
                  {item.width && item.height ? <p className="num mt-1 text-[11px] text-ink-400" dir="ltr">{item.width} × {item.height}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-navy-800 px-3 text-xs font-bold text-white hover:bg-navy-700">
                      <Upload className="size-4" /> اختيار صورة
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile(slot)} />
                    </label>
                    <Button type="button" size="sm" variant="outline" loading={restoring === slot} onClick={() => restore(slot)}>
                      <RotateCcw className="size-4" /> استعادة السابقة
                    </Button>
                  </div>
                  {fieldErrors[slot]?.[0] ? <p className="mt-2 text-xs text-[color:var(--color-danger)]">{fieldErrors[slot][0]}</p> : null}
                </section>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <Button type="submit" size="lg" loading={submitting} disabled={!dirty} className="shadow-xl">
          <Save className="size-4" /> حفظ ونشر التغييرات
        </Button>
      </div>
    </form>
  );
}
