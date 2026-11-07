import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Plus, Save, X } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { adminApi } from "@/api/endpoints";
import { useEnum } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { GPA_SCALES } from "@/lib/constants";

const BLANK = {
  title_ar: "",
  title_en: "",
  provider: "",
  university_name: "",
  country_code: "",
  country_name_ar: "",
  region: "",
  funding_type: "full",
  language_requirement: "required",
  status: "draft",
  description: "",
  apply_url: "",
  open_date: "",
  deadline: "",
  min_gpa: "",
  gpa_scale: 4,
  acceptance_rate: "",
  is_featured: false,
  platform_application_enabled: false,
  platform_application_requests_enabled: false,
  platform_application_price: "",
  platform_application_currency: "USD",
  platform_application_description: "",
  platform_application_documents: [],
  levels: [],
  majors: [],
  eligibility: [],
  documents: [],
  benefits: [],
};

export default function AdminScholarshipFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug || slug === "new";

  const levels = useEnum("degree_levels");
  const fundingTypes = useEnum("funding_types");
  const languages = useEnum("language_requirements");
  const statuses = useEnum("scholarship_statuses");

  const { data: existing, loading } = useApi(
    () => (isNew ? Promise.resolve(null) : adminApi.scholarship(slug)),
    [slug],
  );

  const [values, setValues] = useState(BLANK);

  useEffect(() => {
    if (!existing) return;

    // الخادم يعيد null للحقول الفارغة، والحقول المتحكَّم بها لا تقبل null
    const text = (value) => value ?? "";

    setValues({
      ...BLANK,
      title_ar: text(existing.title_ar),
      title_en: text(existing.title_en),
      provider: text(existing.provider),
      university_name: text(existing.university_name),
      country_code: text(existing.country_code),
      country_name_ar: text(existing.country_name_ar),
      region: text(existing.region),
      funding_type: existing.funding_type ?? BLANK.funding_type,
      language_requirement: existing.language_requirement ?? BLANK.language_requirement,
      status: existing.status ?? BLANK.status,
      description: text(existing.description),
      apply_url: text(existing.apply_url),
      open_date: text(existing.open_date),
      deadline: text(existing.deadline),
      min_gpa: text(existing.min_gpa),
      gpa_scale: existing.gpa_scale ?? BLANK.gpa_scale,
      acceptance_rate: text(existing.acceptance_rate),
      is_featured: Boolean(existing.is_featured),
      platform_application_enabled: Boolean(existing.platform_application_enabled),
      platform_application_requests_enabled: Boolean(existing.platform_application_requests_enabled),
      platform_application_price: text(existing.platform_application_price),
      platform_application_currency: existing.platform_application_currency ?? "USD",
      platform_application_description: text(existing.platform_application_description),
      platform_application_documents: existing.platform_application_documents ?? [],
      levels: (existing.levels ?? []).map((level) => level.value),
      majors: (existing.majors ?? []).map((major) => major.name),
      eligibility: (existing.eligibility ?? []).map((item) => item.text),
      documents: (existing.documents ?? []).map(({ name, note }) => ({ name, note: text(note) })),
      benefits: (existing.benefits ?? []).map(({ title, description }) => ({
        title,
        description: text(description),
      })),
    });
  }, [existing]);

  const save = useSubmit((payload) =>
    isNew ? adminApi.createScholarship(payload) : adminApi.updateScholarship(slug, payload),
  );

  const set = (field) => (event) =>
    setValues((current) => ({
      ...current,
      [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const toggleLevel = (value) =>
    setValues((current) => ({
      ...current,
      levels: current.levels.includes(value)
        ? current.levels.filter((item) => item !== value)
        : [...current.levels, value],
    }));

  const onSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...values,
      min_gpa: values.min_gpa === "" ? null : Number(values.min_gpa),
      acceptance_rate: values.acceptance_rate === "" ? null : Number(values.acceptance_rate),
      platform_application_price: values.platform_application_enabled ? Number(values.platform_application_price || 0) : null,
      open_date: values.open_date || null,
      deadline: values.deadline || null,
      majors: values.majors.filter(Boolean),
      eligibility: values.eligibility.filter(Boolean),
      documents: values.documents.filter((item) => item.name),
      benefits: values.benefits.filter((item) => item.title),
      platform_application_documents: values.platform_application_documents.filter(Boolean),
    };

    const { ok, result } = await save.submit(payload);
    if (ok) navigate(`/admin/scholarships/${result.data?.slug ?? slug}`, { replace: true });
  };

  if (loading) return <LoadingBlock className="py-24" />;

  const errors = save.fieldErrors;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "إضافة منحة جديدة" : "تعديل المنحة"}
        description="املأ بيانات المنحة كاملة — الحقول الناقصة تُضعف دقة المطابقة مع الطلاب."
        actions={
          <ButtonLink to="/admin/scholarships" variant="outline" size="sm">
            <ArrowRight className="size-4" />
            كل المنح
          </ButtonLink>
        }
      />

      {save.error ? <Alert tone="danger">{save.error}</Alert> : null}
      {save.success ? <Alert tone="success">تم حفظ المنحة.</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* البيانات الأساسية */}
        <Card>
          <CardHeader title="البيانات الأساسية" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="اسم المنحة بالعربية" required className="sm:col-span-2" value={values.title_ar} onChange={set("title_ar")} error={errors.title_ar?.[0]} />
            <Input label="الاسم بالإنجليزية" dir="ltr" className="sm:col-span-2" value={values.title_en} onChange={set("title_en")} error={errors.title_en?.[0]} />
            <Input label="الجهة المانحة" required value={values.provider} onChange={set("provider")} error={errors.provider?.[0]} />
            <Input label="الجامعة" value={values.university_name} onChange={set("university_name")} error={errors.university_name?.[0]} />
            <Input
              label="رمز الدولة"
              required
              dir="ltr"
              placeholder="TR"
              hint="رمز ISO من حرفين — يُشتق منه علم الدولة."
              inputClassName="uppercase"
              value={values.country_code}
              onChange={(event) => setValues((current) => ({ ...current, country_code: event.target.value.toUpperCase() }))}
              error={errors.country_code?.[0]}
            />
            <Input label="اسم الدولة بالعربية" required value={values.country_name_ar} onChange={set("country_name_ar")} error={errors.country_name_ar?.[0]} />
            <Input label="المنطقة" placeholder="أوروبا" value={values.region} onChange={set("region")} error={errors.region?.[0]} />
            <Input label="رابط التقديم" dir="ltr" value={values.apply_url} onChange={set("apply_url")} error={errors.apply_url?.[0]} />
            <Textarea
              label="وصف المنحة"
              className="sm:col-span-2"
              rows={6}
              counter={8000}
              value={values.description}
              onChange={set("description")}
              error={errors.description?.[0]}
            />
          </CardBody>
        </Card>

        {/* الشروط والتصنيف */}
        <Card>
          <CardHeader title="التصنيف والشروط" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Select label="نوع التمويل" required value={values.funding_type} onChange={set("funding_type")} error={errors.funding_type?.[0]}>
              {fundingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            <Select label="شهادة اللغة" required value={values.language_requirement} onChange={set("language_requirement")} error={errors.language_requirement?.[0]}>
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </Select>
            <Input label="تاريخ فتح التقديم" type="date" value={values.open_date} onChange={set("open_date")} error={errors.open_date?.[0]} />
            <Input label="آخر موعد للتقديم" type="date" value={values.deadline} onChange={set("deadline")} error={errors.deadline?.[0]} />
            <Input label="الحد الأدنى للمعدل" type="number" step="0.01" value={values.min_gpa} onChange={set("min_gpa")} error={errors.min_gpa?.[0]} />
            <Select label="مقياس المعدل" value={values.gpa_scale} onChange={set("gpa_scale")} error={errors.gpa_scale?.[0]}>
              {GPA_SCALES.map((scale) => (
                <option key={scale.value} value={scale.value}>
                  {scale.label}
                </option>
              ))}
            </Select>
            <Input label="نسبة القبول التقريبية %" type="number" step="0.1" value={values.acceptance_rate} onChange={set("acceptance_rate")} error={errors.acceptance_rate?.[0]} />
            <Select label="حالة النشر" required value={values.status} onChange={set("status")} error={errors.status?.[0]}>
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[13px] font-bold text-ink-700">
                المراحل الدراسية <span className="text-[color:var(--color-danger)]">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <label
                    key={level.value}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                      values.levels.includes(level.value)
                        ? "bg-navy-700 text-white"
                        : "bg-white/55 backdrop-blur-md text-ink-700 hover:bg-white/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={values.levels.includes(level.value)}
                      onChange={() => toggleLevel(level.value)}
                    />
                    {level.label}
                  </label>
                ))}
              </div>
              {errors.levels?.[0] ? (
                <p className="mt-1.5 text-[12px] text-[color:var(--color-danger)]">{errors.levels[0]}</p>
              ) : null}
            </fieldset>

            <div className="sm:col-span-2">
              <Checkbox label="عرض المنحة ضمن المنح المميزة في الصفحة الرئيسية" checked={values.is_featured} onChange={set("is_featured")} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="التقديم من خلال المنصة" subtitle="خدمة مساعدة مدفوعة إضافية لا تستبدل رابط الجهة المانحة ولا تضمن القبول." />
          <CardBody className="space-y-4">
            <Checkbox label="تفعيل مساعدة التقديم لهذه المنحة" checked={values.platform_application_enabled} onChange={set("platform_application_enabled")} />
            {values.platform_application_enabled ? <>
              <Checkbox label="استقبال طلبات جديدة الآن" checked={values.platform_application_requests_enabled} onChange={set("platform_application_requests_enabled")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="سعر خدمة التقديم" type="number" min="0" step="0.01" required value={values.platform_application_price} onChange={set("platform_application_price")} error={errors.platform_application_price?.[0]} />
                <Select label="العملة" value={values.platform_application_currency} onChange={set("platform_application_currency")}><option>USD</option><option>ILS</option><option>JOD</option><option>SAR</option><option>EUR</option></Select>
              </div>
              <Textarea label="وصف الخدمة لهذه المنحة" rows={3} value={values.platform_application_description} onChange={set("platform_application_description")} />
              <StringList label="مستندات إضافية مطلوبة" placeholder="مثال: صورة جواز السفر" items={values.platform_application_documents} onChange={(platform_application_documents) => setValues((current) => ({ ...current, platform_application_documents }))} />
            </> : null}
          </CardBody>
        </Card>

        {/* القوائم */}
        <Card>
          <CardHeader title="التخصصات وشروط الأهلية" />
          <CardBody className="space-y-6">
            <StringList
              label="التخصصات المشمولة"
              placeholder="مثال: علوم الحاسوب"
              items={values.majors}
              onChange={(majors) => setValues((current) => ({ ...current, majors }))}
            />
            <StringList
              label="شروط الأهلية"
              placeholder="مثال: الحصول على البكالوريوس بتقدير جيد جداً"
              items={values.eligibility}
              onChange={(eligibility) => setValues((current) => ({ ...current, eligibility }))}
              multiline
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="المستندات المطلوبة والمزايا" />
          <CardBody className="space-y-6">
            <ObjectList
              label="المستندات المطلوبة"
              items={values.documents}
              onChange={(documents) => setValues((current) => ({ ...current, documents }))}
              blank={{ name: "", note: "" }}
              fields={[
                { key: "name", label: "اسم المستند", placeholder: "السيرة الذاتية" },
                { key: "note", label: "ملاحظة", placeholder: "PDF" },
              ]}
            />
            <ObjectList
              label="مزايا المنحة"
              items={values.benefits}
              onChange={(benefits) => setValues((current) => ({ ...current, benefits }))}
              blank={{ title: "", description: "" }}
              fields={[
                { key: "title", label: "الميزة", placeholder: "تغطية كاملة" },
                { key: "description", label: "الوصف", placeholder: "إعفاء كامل من الرسوم الدراسية" },
              ]}
            />
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={save.submitting}>
            <Save className="size-4" />
            {isNew ? "إنشاء المنحة" : "حفظ التعديلات"}
          </Button>
          <ButtonLink to="/admin/scholarships" variant="ghost" size="lg">
            إلغاء
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}

/** قائمة نصوص بسيطة قابلة للإضافة والحذف */
function StringList({ label, items, onChange, placeholder, multiline }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };

  return (
    <div>
      <p className="mb-2 text-[13px] font-bold text-ink-700">{label}</p>

      {items.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2 glass-soft rounded-lg px-3 py-2">
              <span className="min-w-0 flex-1 text-[13px] leading-6 text-ink-700">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, position) => position !== index))}
                aria-label={`حذف ${item}`}
                className="text-ink-400 hover:text-[color:var(--color-danger)]"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={draft}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
            className="min-w-0 flex-1 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-3 py-2 text-[13px] focus:border-navy-500 focus:outline-none"
          />
        ) : (
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
            className="h-10 min-w-0 flex-1 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-3 text-[13px] focus:border-navy-500 focus:outline-none"
          />
        )}
        <Button type="button" variant="soft" size="sm" onClick={add}>
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>
    </div>
  );
}

/** قائمة عناصر بحقلين */
function ObjectList({ label, items, onChange, blank, fields }) {
  const update = (index, key, value) =>
    onChange(items.map((item, position) => (position === index ? { ...item, [key]: value } : item)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink-700">{label}</p>
        <Button type="button" variant="soft" size="sm" onClick={() => onChange([...items, { ...blank }])}>
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="glass-soft rounded-lg px-3 py-3 text-[12.5px] text-ink-500">لم تُضف أي عنصر بعد.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-end gap-2 glass-soft rounded-lg p-3">
              {fields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={item[field.key] ?? ""}
                  onChange={(event) => update(index, field.key, event.target.value)}
                />
              ))}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, position) => position !== index))}
                aria-label="حذف العنصر"
                className="mb-1 grid size-10 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-[color:var(--color-danger)]/12 hover:text-[color:var(--color-danger)]"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
