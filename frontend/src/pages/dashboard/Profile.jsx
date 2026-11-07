import { useState } from "react";
import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Heart,
  Languages,
  Lightbulb,
  UserRound,
} from "lucide-react";

import { ProfileSection, TagSection } from "@/components/dashboard/ProfileSection";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { Progress } from "@/components/ui/Progress";
import { LoadingBlock } from "@/components/ui/Spinner";
import { profileApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useEnum } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { GPA_SCALES, LANGUAGE_PROFICIENCY, SKILL_SUGGESTIONS } from "@/lib/constants";
import { formatMonthYearAr } from "@/lib/utils";

const GENDERS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

export default function ProfilePage() {
  const { refresh } = useAuth();
  const { data: profile, loading, error, setData } = useApi(profileApi.show, []);

  if (loading) return <LoadingBlock className="py-24" />;

  if (error || !profile) {
    return <Alert tone="danger">{error ?? "تعذّر تحميل الملف الأكاديمي."}</Alert>;
  }

  /** كل عملية كتابة تُعيد الملف كاملاً من الخادم */
  const apply = (updated) => {
    setData(updated);
    refresh().catch(() => undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الأكاديمي"
        description="بياناتك هنا هي المصدر الوحيد للمطابقة مع المنح ولصياغة سيرتك الذاتية وخطاب دافعك — أكملها مرة واحدة."
      />

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-bold text-navy-800">نسبة اكتمال الملف</span>
          <span className="num font-extrabold text-navy-700">{profile.completion_percent}%</span>
        </div>
        <Progress className="mt-2.5" value={profile.completion_percent} tone="success" />
      </div>

      <PersonalSection profile={profile} onSaved={apply} />

      <ProfileSection
        type="educations"
        title="المؤهلات الدراسية"
        description="ابدأ بالمؤهل الحالي أو الأحدث."
        icon={<GraduationCap className="size-4" />}
        items={profile.educations}
        onChange={apply}
        addLabel="إضافة مؤهل"
        emptyLabel="لم تُضف أي مؤهل دراسي بعد."
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
            <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-ink-500">
              {item.graduation_year ? (
                <span className="num">
                  {item.is_current ? "متوقّع " : ""}
                  {item.graduation_year}
                </span>
              ) : null}
              {item.gpa_formatted ? <span className="num">المعدل {item.gpa_formatted}</span> : null}
              {item.honors ? <span>{item.honors}</span> : null}
            </p>
          </>
        )}
        renderForm={EducationForm}
      />

      <ProfileSection
        type="experiences"
        title="الخبرات"
        description="الخبرات العملية والتطوعية والبحثية."
        icon={<Briefcase className="size-4" />}
        items={profile.experiences}
        onChange={apply}
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
              {formatMonthYearAr(item.start_date)} —{" "}
              {item.is_current ? "حتى الآن" : formatMonthYearAr(item.end_date)}
            </p>
          </>
        )}
        renderForm={ExperienceForm}
      />

      <ProfileSection
        type="languages"
        title="اللغات"
        description="اللغات التي تتقنها وشهاداتها إن وُجدت."
        icon={<Languages className="size-4" />}
        items={profile.languages}
        onChange={apply}
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
        renderForm={LanguageForm}
      />

      <ProfileSection
        type="certifications"
        title="الشهادات والدورات"
        icon={<Award className="size-4" />}
        items={profile.certifications}
        onChange={apply}
        addLabel="إضافة شهادة"
        emptyLabel="لم تُضف أي شهادة بعد."
        blankValues={{ title: "", issuer: "", credential_id: "", issue_date: "", url: "" }}
        renderItem={(item) => (
          <>
            <p className="font-bold text-navy-800">{item.title}</p>
            <p className="mt-0.5 text-[13px] text-ink-600">
              {item.issuer}
              {item.issue_date ? ` · ${formatMonthYearAr(item.issue_date)}` : ""}
            </p>
          </>
        )}
        renderForm={CertificationForm}
      />

      <ProfileSection
        type="projects"
        title="المشاريع"
        description="مشاريع التخرج والمشاركات البحثية والتطبيقية."
        icon={<FolderGit2 className="size-4" />}
        items={profile.projects}
        onChange={apply}
        addLabel="إضافة مشروع"
        emptyLabel="لم تُضف أي مشروع بعد."
        blankValues={{ title: "", description: "", year: "", url: "" }}
        renderItem={(item) => (
          <>
            <p className="font-bold text-navy-800">
              {item.title}
              {item.year ? <span className="num text-ink-400"> · {item.year}</span> : null}
            </p>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-ink-600">{item.description}</p>
            ) : null}
          </>
        )}
        renderForm={ProjectForm}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TagSection
          type="skills"
          title="المهارات"
          description="أضف 3 مهارات على الأقل."
          icon={<Lightbulb className="size-4" />}
          items={profile.skills}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="مثال: تحليل البيانات"
          onChange={apply}
        />

        <TagSection
          type="interests"
          title="الاهتمامات"
          description="مجالات تهمّك — تساعدنا في ترشيح منح أنسب."
          icon={<Heart className="size-4" />}
          items={profile.interests}
          suggestions={["الذكاء الاصطناعي", "الطاقة المتجددة", "الصحة العامة", "ريادة الأعمال", "التعليم", "الاستدامة"]}
          placeholder="مثال: الطاقة المتجددة"
          onChange={apply}
        />
      </div>
    </div>
  );
}

/* ============================================================
   المعلومات الشخصية
   ============================================================ */

function PersonalSection({ profile, onSaved }) {
  const [values, setValues] = useState({
    full_name_ar: profile.full_name_ar ?? "",
    full_name_en: profile.full_name_en ?? "",
    headline: profile.headline ?? "",
    academic_email: profile.academic_email ?? "",
    phone: profile.phone ?? "",
    birth_date: profile.birth_date ?? "",
    nationality: profile.nationality ?? "",
    gender: profile.gender ?? "",
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
    <Card as="section">
      <CardHeader title="المعلومات الشخصية" icon={<UserRound className="size-4" />} />

      <CardBody>
        {success ? (
          <Alert tone="success" className="mb-4">
            تم حفظ معلوماتك الشخصية.
          </Alert>
        ) : null}

        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input
            label="الاسم الكامل بالعربية"
            required
            value={values.full_name_ar}
            onChange={change("full_name_ar")}
            error={fieldErrors.full_name_ar?.[0]}
          />
          <Input
            label="الاسم الكامل بالإنجليزية"
            dir="ltr"
            placeholder="Ahmed Mohamed"
            value={values.full_name_en}
            onChange={change("full_name_en")}
            error={fieldErrors.full_name_en?.[0]}
          />
          <Input
            label="المسمّى المختصر"
            placeholder="مثال: طالب هندسة برمجيات"
            className="sm:col-span-2"
            value={values.headline}
            onChange={change("headline")}
            error={fieldErrors.headline?.[0]}
          />
          <Input
            label="البريد الأكاديمي"
            type="email"
            value={values.academic_email}
            onChange={change("academic_email")}
            error={fieldErrors.academic_email?.[0]}
          />
          <Input
            label="رقم الهاتف"
            type="tel"
            value={values.phone}
            onChange={change("phone")}
            error={fieldErrors.phone?.[0]}
          />
          <Input
            label="تاريخ الميلاد"
            type="date"
            value={values.birth_date}
            onChange={change("birth_date")}
            error={fieldErrors.birth_date?.[0]}
          />
          <Select label="الجنس" value={values.gender} onChange={change("gender")} error={fieldErrors.gender?.[0]}>
            <option value="">غير محدد</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.label}
              </option>
            ))}
          </Select>
          <Input
            label="الجنسية"
            value={values.nationality}
            onChange={change("nationality")}
            error={fieldErrors.nationality?.[0]}
          />
          <Input label="بلد الإقامة" value={values.country} onChange={change("country")} error={fieldErrors.country?.[0]} />
          <Input label="المدينة" value={values.city} onChange={change("city")} error={fieldErrors.city?.[0]} />
          <Input
            label="حساب لينكدإن"
            dir="ltr"
            placeholder="https://linkedin.com/in/…"
            value={values.linkedin_url}
            onChange={change("linkedin_url")}
            error={fieldErrors.linkedin_url?.[0]}
          />
          <Input
            label="الموقع الشخصي"
            dir="ltr"
            placeholder="https://…"
            className="sm:col-span-2"
            value={values.portfolio_url}
            onChange={change("portfolio_url")}
            error={fieldErrors.portfolio_url?.[0]}
          />
          <Textarea
            label="نبذة عنك"
            hint="٣ إلى ٥ أسطر تلخّص مسارك الأكاديمي وطموحك. تُستخدم في السيرة الذاتية وخطاب التحفيز."
            rows={5}
            counter={2000}
            className="sm:col-span-2"
            value={values.bio}
            onChange={change("bio")}
            error={fieldErrors.bio?.[0]}
          />

          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>
              حفظ المعلومات
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/* ============================================================
   نماذج الأقسام المتكرّرة
   ============================================================ */

function EducationForm({ values, setValues, errors }) {
  const levels = useEnum("degree_levels");
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
      <Input
        label="الجامعة أو المؤسسة"
        required
        className="sm:col-span-2"
        value={values.institution}
        onChange={set("institution")}
        error={errors.institution?.[0]}
      />
      <Input label="الدولة" value={values.country} onChange={set("country")} error={errors.country?.[0]} />
      <Input
        label="سنة التخرّج"
        type="number"
        min="1950"
        max="2100"
        value={values.graduation_year}
        onChange={set("graduation_year")}
        error={errors.graduation_year?.[0]}
      />
      <Input
        label="المعدل"
        type="number"
        step="0.01"
        value={values.gpa_value}
        onChange={set("gpa_value")}
        error={errors.gpa_value?.[0]}
      />
      <Select label="مقياس المعدل" value={values.gpa_scale} onChange={set("gpa_scale")} error={errors.gpa_scale?.[0]}>
        {GPA_SCALES.map((scale) => (
          <option key={scale.value} value={scale.value}>
            {scale.label}
          </option>
        ))}
      </Select>
      <Input label="التقدير" placeholder="امتياز مع مرتبة الشرف" value={values.honors} onChange={set("honors")} error={errors.honors?.[0]} />
      <Input
        label="عنوان الرسالة أو مشروع التخرّج"
        className="sm:col-span-2"
        value={values.thesis_title}
        onChange={set("thesis_title")}
        error={errors.thesis_title?.[0]}
      />
      <div className="sm:col-span-2">
        <Checkbox label="ما زلت أدرس في هذا البرنامج" checked={Boolean(values.is_current)} onChange={set("is_current")} />
      </div>
    </div>
  );
}

function ExperienceForm({ values, setValues, errors }) {
  const types = useEnum("experience_types");
  const set = (field) => (event) =>
    setValues((current) => ({
      ...current,
      [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="المسمى الوظيفي" required value={values.title} onChange={set("title")} error={errors.title?.[0]} />
      <Select label="نوع الخبرة" required value={values.type} onChange={set("type")} error={errors.type?.[0]}>
        {types.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>
      <Input
        label="الجهة"
        required
        className="sm:col-span-2"
        value={values.organization}
        onChange={set("organization")}
        error={errors.organization?.[0]}
      />
      <Input label="الدولة" value={values.country} onChange={set("country")} error={errors.country?.[0]} />
      <Input label="المدينة" value={values.city} onChange={set("city")} error={errors.city?.[0]} />
      <Input
        label="تاريخ البداية"
        type="date"
        value={values.start_date}
        onChange={set("start_date")}
        error={errors.start_date?.[0]}
      />
      <Input
        label="تاريخ النهاية"
        type="date"
        disabled={Boolean(values.is_current)}
        value={values.is_current ? "" : values.end_date}
        onChange={set("end_date")}
        error={errors.end_date?.[0]}
      />
      <div className="sm:col-span-2">
        <Checkbox label="ما زلت أعمل هنا" checked={Boolean(values.is_current)} onChange={set("is_current")} />
      </div>
      <Textarea
        label="الوصف"
        hint="اذكر إنجازات بأرقام حين أمكن."
        rows={4}
        counter={3000}
        className="sm:col-span-2"
        value={values.description}
        onChange={set("description")}
        error={errors.description?.[0]}
      />
    </div>
  );
}

function LanguageForm({ values, setValues, errors }) {
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="اللغة" required value={values.name} onChange={set("name")} error={errors.name?.[0]} />
      <Select label="مستوى الإتقان" required value={values.proficiency} onChange={set("proficiency")} error={errors.proficiency?.[0]}>
        {LANGUAGE_PROFICIENCY.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </Select>
      <Input
        label="الشهادة"
        placeholder="IELTS 7.5"
        className="sm:col-span-2"
        value={values.certificate}
        onChange={set("certificate")}
        error={errors.certificate?.[0]}
      />
    </div>
  );
}

function CertificationForm({ values, setValues, errors }) {
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="اسم الشهادة"
        required
        className="sm:col-span-2"
        value={values.title}
        onChange={set("title")}
        error={errors.title?.[0]}
      />
      <Input label="الجهة المانحة" value={values.issuer} onChange={set("issuer")} error={errors.issuer?.[0]} />
      <Input
        label="رقم الاعتماد"
        dir="ltr"
        value={values.credential_id}
        onChange={set("credential_id")}
        error={errors.credential_id?.[0]}
      />
      <Input
        label="تاريخ الإصدار"
        type="date"
        value={values.issue_date}
        onChange={set("issue_date")}
        error={errors.issue_date?.[0]}
      />
      <Input label="رابط التحقق" dir="ltr" value={values.url} onChange={set("url")} error={errors.url?.[0]} />
    </div>
  );
}

function ProjectForm({ values, setValues, errors }) {
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="اسم المشروع" required value={values.title} onChange={set("title")} error={errors.title?.[0]} />
      <Input label="السنة" type="number" min="1950" max="2100" value={values.year} onChange={set("year")} error={errors.year?.[0]} />
      <Input label="الرابط" dir="ltr" className="sm:col-span-2" value={values.url} onChange={set("url")} error={errors.url?.[0]} />
      <Textarea
        label="الوصف"
        rows={4}
        counter={3000}
        className="sm:col-span-2"
        value={values.description}
        onChange={set("description")}
        error={errors.description?.[0]}
      />
    </div>
  );
}
