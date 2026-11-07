import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CircleCheck,
  CircleX,
  GraduationCap,
  Languages,
  Lightbulb,
  Send,
  UserRound,
  Wallet,
} from "lucide-react";

import { ProfileSection, TagSection } from "@/components/dashboard/ProfileSection";
import { PaymentDetails } from "@/components/tools/PaymentDetails";
import { WizardSteps } from "@/components/tools/WizardSteps";
import { Alert, TipBox } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { cvOrderApi, profileApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useEnum } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { CV_STEPS, CV_TIPS, GPA_SCALES, LANGUAGE_PROFICIENCY, SKILL_SUGGESTIONS } from "@/lib/constants";
import { formatMonthYearAr } from "@/lib/utils";

/**
 * ويزرد صياغة السيرة الذاتية.
 * الخطوات 1–4 تقرأ وتكتب في الملف الأكاديمي مباشرة (مصدر واحد للبيانات)،
 * والخطوة 5 مراجعة وإرسال الطلب للخبير.
 */
export default function CvWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const { data: profile, loading, error, setData } = useApi(profileApi.show, []);
  const { refresh } = useAuth();

  /** كل كتابة هنا تمسّ الملف الأكاديمي، فتُحدَّث نسبة الاكتمال في السياق */
  const applyProfile = (updated) => {
    setData(updated);
    refresh().catch(() => undefined);
  };
  const { data: active, loading: loadingOrder } = useApi(cvOrderApi.active, []);

  if (loading || loadingOrder) return <LoadingBlock className="py-24" />;

  if (error || !profile) {
    return (
      <div className="container-page py-16">
        <Alert tone="danger">{error ?? "تعذّر تحميل بياناتك."}</Alert>
      </div>
    );
  }

  // طلب قائم بالفعل: تُعرض صفحة المتابعة بدل بدء طلب جديد
  if (active) {
    return (
      <div className="container-page max-w-3xl py-12">
        <Alert tone="info" title="لديك طلب قائم">
          طلبك رقم <span className="num font-bold">{active.order_number}</span> {active.status_label} — تابع مراحله من
          صفحة المتابعة.
        </Alert>
        <ButtonLink to={`/tools/cv-builder/${active.id}`} className="mt-6">
          متابعة الطلب
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container-page max-w-4xl">
        <PageHeader
          title="صياغة السيرة الذاتية"
          description="أكمل الخطوات الخمس، ثم يتولّى خبير القبولات صياغة سيرتك وفق معايير لجان المنح."
          actions={
            <ButtonLink to="/tools" variant="outline" size="sm">
              <ArrowRight className="size-4" />
              كل الأدوات
            </ButtonLink>
          }
        />

        <div className="glass rounded-2xl p-5">
          <WizardSteps steps={CV_STEPS} current={step} onSelect={setStep} />
        </div>

        <div className="mt-6 space-y-6">
          {step === 1 ? <StepPersonal profile={profile} onSaved={applyProfile} /> : null}
          {step === 2 ? <StepEducation profile={profile} onChange={applyProfile} /> : null}
          {step === 3 ? <StepExperience profile={profile} onChange={applyProfile} /> : null}
          {step === 4 ? <StepSkills profile={profile} onChange={applyProfile} /> : null}
          {step === 5 ? <StepReview profile={profile} onSubmitted={(order) => navigate(`/tools/cv-builder/${order.id}`)} /> : null}

          <TipBox>{CV_TIPS[step]}</TipBox>

          {/* التنقّل */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setStep((value) => value - 1)} disabled={step === 1}>
              <ArrowRight className="size-4" />
              السابق
            </Button>

            <span className="num text-[13px] text-ink-500">
              الخطوة {step} من {CV_STEPS.length}
            </span>

            <Button onClick={() => setStep((value) => value + 1)} disabled={step === CV_STEPS.length}>
              التالي
              <ArrowLeft className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   الخطوة 1 — المعلومات الشخصية والنبذة
   ============================================================ */

function StepPersonal({ profile, onSaved }) {
  const [values, setValues] = useState({
    full_name_ar: profile.full_name_ar ?? "",
    full_name_en: profile.full_name_en ?? "",
    headline: profile.headline ?? "",
    academic_email: profile.academic_email ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    city: profile.city ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    bio: profile.bio ?? "",
  });

  const { submit, submitting, error, fieldErrors, success } = useSubmit(profileApi.updatePersonal);

  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result } = await submit(values);
    if (ok) onSaved(result);
  };

  return (
    <Card>
      <CardHeader
        title="المعلومات الشخصية"
        subtitle="تُستخدم في ترويسة سيرتك الذاتية، وتُحفظ في ملفك الأكاديمي."
        icon={<UserRound className="size-4" />}
      />
      <CardBody>
        {success ? (
          <Alert tone="success" className="mb-4">
            تم الحفظ.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input label="الاسم بالعربية" required value={values.full_name_ar} onChange={change("full_name_ar")} error={fieldErrors.full_name_ar?.[0]} />
          <Input label="الاسم بالإنجليزية" dir="ltr" value={values.full_name_en} onChange={change("full_name_en")} error={fieldErrors.full_name_en?.[0]} />
          <Input label="المسمّى المختصر" className="sm:col-span-2" placeholder="طالب هندسة برمجيات" value={values.headline} onChange={change("headline")} error={fieldErrors.headline?.[0]} />
          <Input label="البريد الأكاديمي" type="email" value={values.academic_email} onChange={change("academic_email")} error={fieldErrors.academic_email?.[0]} />
          <Input label="رقم الهاتف" type="tel" value={values.phone} onChange={change("phone")} error={fieldErrors.phone?.[0]} />
          <Input label="الدولة" value={values.country} onChange={change("country")} error={fieldErrors.country?.[0]} />
          <Input label="المدينة" value={values.city} onChange={change("city")} error={fieldErrors.city?.[0]} />
          <Input label="لينكدإن" dir="ltr" value={values.linkedin_url} onChange={change("linkedin_url")} error={fieldErrors.linkedin_url?.[0]} />
          <Input label="الموقع الشخصي" dir="ltr" value={values.portfolio_url} onChange={change("portfolio_url")} error={fieldErrors.portfolio_url?.[0]} />
          <Textarea
            label="النبذة الشخصية"
            className="sm:col-span-2"
            rows={5}
            counter={2000}
            hint="٣ إلى ٥ أسطر: من أنت، وما تخصصك، وما هدفك الأكاديمي."
            value={values.bio}
            onChange={change("bio")}
            error={fieldErrors.bio?.[0]}
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>
              حفظ والمتابعة
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/* ============================================================
   الخطوة 2 — التعليم
   ============================================================ */

function StepEducation({ profile, onChange }) {
  const levels = useEnum("degree_levels");

  return (
    <ProfileSection
      type="educations"
      title="التعليم والمؤهلات"
      description="ابدأ بالمؤهل الحالي أو الأحدث."
      icon={<GraduationCap className="size-4" />}
      items={profile.educations}
      onChange={onChange}
      addLabel="إضافة مؤهل"
      emptyLabel="أضف مؤهلاً دراسياً واحداً على الأقل للمتابعة."
      blankValues={{
        degree: "bachelor",
        major: "",
        institution: "",
        country: "",
        graduation_year: "",
        is_current: false,
        gpa_value: "",
        gpa_scale: 4,
        honors: "",
        thesis_title: "",
      }}
      renderItem={(item) => (
        <>
          <p className="font-bold text-navy-800">
            {item.degree_label}
            {item.major ? ` — ${item.major}` : ""}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-600">{item.institution}</p>
          <p className="num mt-1 text-[12px] text-ink-500">
            {item.graduation_year ?? "—"}
            {item.gpa_formatted ? ` · المعدل ${item.gpa_formatted}` : ""}
          </p>
        </>
      )}
      renderForm={({ values, setValues, errors }) => {
        const set = (field) => (event) =>
          setValues((current) => ({
            ...current,
            [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
          }));

        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="الدرجة" required value={values.degree} onChange={set("degree")} error={errors.degree?.[0]}>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </Select>
            <Input label="التخصص" value={values.major} onChange={set("major")} error={errors.major?.[0]} />
            <Input label="الجامعة" required className="sm:col-span-2" value={values.institution} onChange={set("institution")} error={errors.institution?.[0]} />
            <Input label="الدولة" value={values.country} onChange={set("country")} error={errors.country?.[0]} />
            <Input label="سنة التخرّج" type="number" value={values.graduation_year} onChange={set("graduation_year")} error={errors.graduation_year?.[0]} />
            <Input label="المعدل" type="number" step="0.01" value={values.gpa_value} onChange={set("gpa_value")} error={errors.gpa_value?.[0]} />
            <Select label="مقياس المعدل" value={values.gpa_scale} onChange={set("gpa_scale")} error={errors.gpa_scale?.[0]}>
              {GPA_SCALES.map((scale) => (
                <option key={scale.value} value={scale.value}>
                  {scale.label}
                </option>
              ))}
            </Select>
            <Input label="التقدير" value={values.honors} onChange={set("honors")} error={errors.honors?.[0]} />
            <Input label="عنوان مشروع التخرّج" className="sm:col-span-2" value={values.thesis_title} onChange={set("thesis_title")} error={errors.thesis_title?.[0]} />
            <div className="sm:col-span-2">
              <Checkbox label="ما زلت أدرس في هذا البرنامج" checked={Boolean(values.is_current)} onChange={set("is_current")} />
            </div>
          </div>
        );
      }}
    />
  );
}

/* ============================================================
   الخطوة 3 — الخبرات
   ============================================================ */

function StepExperience({ profile, onChange }) {
  const types = useEnum("experience_types");

  return (
    <ProfileSection
      type="experiences"
      title="الخبرات والأنشطة"
      description="العمل والتدريب والتطوع والبحث — كل ما يعزّز ملفك."
      icon={<Briefcase className="size-4" />}
      items={profile.experiences}
      onChange={onChange}
      addLabel="إضافة خبرة"
      emptyLabel="لم تُضف أي خبرة بعد."
      blankValues={{
        title: "",
        type: "work",
        organization: "",
        country: "",
        city: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: "",
      }}
      renderItem={(item) => (
        <>
          <p className="font-bold text-navy-800">{item.title}</p>
          <p className="mt-0.5 text-[13px] text-ink-600">
            {item.organization} · {item.type_label}
          </p>
          <p className="mt-1 text-[12px] text-ink-500">
            {formatMonthYearAr(item.start_date)} — {item.is_current ? "حتى الآن" : formatMonthYearAr(item.end_date)}
          </p>
        </>
      )}
      renderForm={({ values, setValues, errors }) => {
        const set = (field) => (event) =>
          setValues((current) => ({
            ...current,
            [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
          }));

        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="المسمى" required value={values.title} onChange={set("title")} error={errors.title?.[0]} />
            <Select label="النوع" required value={values.type} onChange={set("type")} error={errors.type?.[0]}>
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            <Input label="الجهة" required className="sm:col-span-2" value={values.organization} onChange={set("organization")} error={errors.organization?.[0]} />
            <Input label="تاريخ البداية" type="date" value={values.start_date} onChange={set("start_date")} error={errors.start_date?.[0]} />
            <Input label="تاريخ النهاية" type="date" disabled={Boolean(values.is_current)} value={values.is_current ? "" : values.end_date} onChange={set("end_date")} error={errors.end_date?.[0]} />
            <div className="sm:col-span-2">
              <Checkbox label="ما زلت هنا" checked={Boolean(values.is_current)} onChange={set("is_current")} />
            </div>
            <Textarea
              label="الوصف"
              className="sm:col-span-2"
              rows={4}
              counter={3000}
              hint="ابدأ بفعل قوي واذكر نتائج بالأرقام."
              value={values.description}
              onChange={set("description")}
              error={errors.description?.[0]}
            />
          </div>
        );
      }}
    />
  );
}

/* ============================================================
   الخطوة 4 — المهارات واللغات
   ============================================================ */

function StepSkills({ profile, onChange }) {
  return (
    <div className="space-y-6">
      <TagSection
        type="skills"
        title="المهارات"
        description="أضف 3 مهارات على الأقل — تقنية وشخصية."
        icon={<Lightbulb className="size-4" />}
        items={profile.skills}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="مثال: تحليل البيانات"
        onChange={onChange}
      />

      <ProfileSection
        type="languages"
        title="اللغات"
        description="اذكر شهادة اللغة إن وُجدت — تزيد فرص القبول."
        icon={<Languages className="size-4" />}
        items={profile.languages}
        onChange={onChange}
        addLabel="إضافة لغة"
        emptyLabel="لم تُضف أي لغة بعد."
        blankValues={{ name: "", proficiency: LANGUAGE_PROFICIENCY[2], certificate: "" }}
        renderItem={(item) => (
          <>
            <p className="font-bold text-navy-800">{item.name}</p>
            <p className="mt-0.5 text-[13px] text-ink-600">
              {item.proficiency}
              {item.certificate ? ` · ${item.certificate}` : ""}
            </p>
          </>
        )}
        renderForm={({ values, setValues, errors }) => {
          const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="اللغة" required value={values.name} onChange={set("name")} error={errors.name?.[0]} />
              <Select label="المستوى" required value={values.proficiency} onChange={set("proficiency")} error={errors.proficiency?.[0]}>
                {LANGUAGE_PROFICIENCY.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
              <Input label="الشهادة" className="sm:col-span-2" placeholder="IELTS 7.5" value={values.certificate} onChange={set("certificate")} error={errors.certificate?.[0]} />
            </div>
          );
        }}
      />
    </div>
  );
}

/* ============================================================
   الخطوة 5 — المراجعة والإرسال
   ============================================================ */

function StepReview({ profile, onSubmitted }) {
  const { data: readiness, loading } = useApi(cvOrderApi.readiness, []);
  const { data: payment } = useApi(cvOrderApi.paymentInfo, []);
  const { submit, submitting, error, fieldErrors } = useSubmit(cvOrderApi.submit);
  const [receipt, setReceipt] = useState(null);

  const blocking = (readiness ?? []).filter((item) => item.required && !item.done);

  const price = payment?.services?.find((service) => service.kind === "cv_build")?.price ?? 0;
  const isPaid = price > 0;
  const blocked = isPaid && !payment?.configured;
  const missingReceipt = isPaid && !receipt;

  const onSubmit = async () => {
    const { ok, result } = await submit({ kind: "cv_build", receipt });
    if (ok) onSubmitted(result.data ?? result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="جاهزية الطلب" subtitle="تأكد من اكتمال المتطلبات قبل الإرسال." />
        <CardBody>
          {loading ? (
            <LoadingBlock />
          ) : (
            <ul className="space-y-3">
              {(readiness ?? []).map((item) => (
                <li key={item.label} className="flex items-start gap-2.5 text-[14px]">
                  {item.done ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-[color:var(--color-success)]" />
                  ) : (
                    <CircleX
                      className={`mt-0.5 size-4 shrink-0 ${item.required ? "text-[color:var(--color-danger)]" : "text-ink-300"}`}
                    />
                  )}
                  <span className={item.done ? "text-ink-700" : "text-ink-500"}>
                    {item.label}
                    {!item.required ? <span className="text-[12px] text-ink-400"> (اختياري)</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="ملخّص بياناتك" subtitle="هذه البيانات هي ما سيعتمد عليه الخبير في الصياغة." />
        <CardBody className="space-y-4 text-[14px]">
          <SummaryRow label="الاسم" value={profile.full_name_ar} />
          <SummaryRow label="المسمّى" value={profile.headline} />
          <SummaryRow label="النبذة" value={profile.bio} multiline />
          <SummaryRow label="المؤهلات" value={`${profile.educations.length} مؤهل`} />
          <SummaryRow label="الخبرات" value={`${profile.experiences.length} خبرة`} />
          <SummaryRow label="المهارات" value={profile.skills.map((skill) => skill.name).join("، ")} />
          <SummaryRow
            label="اللغات"
            value={profile.languages.map((language) => `${language.name} (${language.proficiency})`).join("، ")}
          />

          <p className="text-[13px] text-ink-500">
            تحتاج تعديلاً؟ ارجع للخطوات السابقة أو عدّل من{" "}
            <Link to="/dashboard/profile" className="font-bold text-navy-700 hover:underline">
              الملف الأكاديمي
            </Link>
            .
          </p>
        </CardBody>
      </Card>

      {isPaid && !blocked ? (
        <Card>
          <CardHeader
            title="حوّل المبلغ ثم أرفق الإشعار"
            subtitle="يبدأ الفريق العمل فور تأكيد التحويل."
            icon={<Wallet className="size-4" />}
          />
          <CardBody className="space-y-4">
            <PaymentDetails account={payment.account} price={price} currency={payment.currency} />

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-ink-900/20 p-4 transition hover:bg-white/60">
              <span className="text-[13px] font-semibold text-navy-800">
                {receipt ? receipt.name : "أرفق إشعار التحويل"}
              </span>
              <span className="text-[12px] text-ink-500">PNG · JPG · PDF</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
              />
            </label>
          </CardBody>
        </Card>
      ) : null}

      {blocked ? (
        <Alert tone="warning">خدمة الدفع غير مهيّأة بعد. تواصل معنا لإتمام طلبك.</Alert>
      ) : null}

      {error ? <Alert tone="danger">{fieldErrors.receipt?.[0] ?? error}</Alert> : null}

      {blocking.length > 0 ? (
        <Alert tone="warning" title="أكمل المتطلبات التالية قبل الإرسال">
          <ul className="mt-1 space-y-1">
            {blocking.map((item) => (
              <li key={item.label}>• {item.label}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
        loading={submitting}
        disabled={blocking.length > 0 || missingReceipt || blocked}
      >
        <Send className="size-4" />
        إرسال الطلب للخبير
      </Button>

      {missingReceipt && !blocked ? (
        <p className="text-center text-[12.5px] text-ink-500">أرفق إشعار التحويل لإتمام الطلب.</p>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value, multiline }) {
  return (
    <div className={multiline ? "" : "flex items-start justify-between gap-4"}>
      <span className="shrink-0 font-semibold text-ink-500">{label}</span>
      <span className={`text-navy-800 ${multiline ? "mt-1 block leading-8" : "text-end"}`}>{value || "—"}</span>
    </div>
  );
}
