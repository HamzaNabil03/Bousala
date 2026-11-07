import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpenCheck,
  FileText,
  LifeBuoy,
  Mail,
  Search,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { useMeta } from "@/context/MetaContext";

const GUIDES = [
  {
    icon: UserRoundPlus,
    title: "ابدأ من هنا",
    description: "أنشئ حسابك، ثم أكمل ملفك الأكاديمي: المؤهل الحالي، التخصص، المعدل، واللغات.",
    to: "/register",
    cta: "إنشاء حساب",
  },
  {
    icon: Search,
    title: "ابحث وصفِّ المنح",
    description: "استخدم الفلاتر لتحديد المرحلة والدولة والتخصص ونوع التمويل، ثم رتّب النتائج حسب المطابقة.",
    to: "/scholarships",
    cta: "تصفّح المنح",
  },
  {
    icon: Sparkles,
    title: "جهّز مستنداتك",
    description: "اكتب سيرتك الذاتية وخطاب التحفيز بالأدوات الذكية، أو اطلب صياغة سيرتك بإشراف خبير مجاناً.",
    to: "/tools",
    cta: "افتح الأدوات",
  },
  {
    icon: FileText,
    title: "نظّم ملفاتك",
    description: "ارفع شهاداتك وسجلاتك في قسم المستندات ليكون كل ما تحتاجه جاهزاً وقت التقديم.",
    to: "/dashboard/documents",
    cta: "إدارة المستندات",
  },
];

export default function HelpPage() {
  const { site } = useMeta();

  return (
    <div className="py-12">
      <div className="container-page max-w-5xl">
        <header className="text-center">
          <span className="inline-grid size-14 place-items-center rounded-2xl bg-navy-500/10 text-navy-700">
            <LifeBuoy className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-navy-800">مركز المساعدة</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-8 text-ink-600">
            دليل سريع يشرح كيف تستفيد من بَوْصلة خطوة بخطوة.
          </p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <div key={guide.title} className="glass rounded-2xl p-6">
              <span className="grid size-12 place-items-center rounded-xl bg-navy-500/10 text-navy-700">
                <guide.icon className="size-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-navy-800">{guide.title}</h2>
              <p className="mt-2 text-[14px] leading-7 text-ink-600">{guide.description}</p>
              <Link
                to={guide.to}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-navy-600 hover:underline"
              >
                {guide.cta}
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-4 glass rounded-2xl p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-400/25 text-gold-700">
              <BookOpenCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-navy-800">الأسئلة الشائعة</h2>
              <p className="mt-1.5 text-[13px] leading-7 text-ink-600">
                إجابات جاهزة عن الحساب والمطابقة والأدوات والمواعيد.
              </p>
              <ButtonLink to="/faq" variant="soft" size="sm" className="mt-3">
                اقرأ الأسئلة
              </ButtonLink>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-2xl p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-500/10 text-navy-700">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-navy-800">تحتاج مساعدة شخصية؟</h2>
              <p className="mt-1.5 text-[13px] leading-7 text-ink-600">
                راسلنا على{" "}
                <a href={`mailto:${site.email}`} dir="ltr" className="font-semibold text-navy-700 hover:underline">
                  {site.email}
                </a>{" "}
                أو عبر نموذج التواصل.
              </p>
              <ButtonLink to="/contact" variant="soft" size="sm" className="mt-3">
                تواصل معنا
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
