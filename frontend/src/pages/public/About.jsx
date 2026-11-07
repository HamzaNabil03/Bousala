import { BookOpenCheck, Eye, HeartHandshake, ShieldCheck, Sparkles, Target } from "lucide-react";

import { TeamScene } from "@/components/public/HeroScene";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Section";
import { useMeta } from "@/context/MetaContext";

const VALUES = [
  {
    icon: HeartHandshake,
    title: "مجانية بالكامل",
    description: "كل خدمات بَوْصلة — من البحث إلى صياغة السيرة الذاتية — متاحة دون أي رسوم.",
  },
  {
    icon: ShieldCheck,
    title: "خصوصية أولاً",
    description: "بياناتك الأكاديمية لك وحدك، ولا تُشارك مع أي جهة إلا بموافقتك الصريحة.",
  },
  {
    icon: BookOpenCheck,
    title: "معلومات موثوقة",
    description: "كل منحة تُراجَع يدوياً قبل نشرها، وتُحدَّث مواعيدها أولاً بأول.",
  },
  {
    icon: Sparkles,
    title: "تقنية في خدمة الطالب",
    description: "نستخدم الذكاء الاصطناعي لتبسيط التقديم لا لتعقيده، بلغة عربية واضحة.",
  },
];

export default function AboutPage() {
  const { site } = useMeta();

  return (
    <div>
      <section className="bg-navy-700 py-14 text-white">
        <div className="container-page text-center">
          <h1 className="font-display text-3xl sm:text-4xl">من نحن</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-navy-100">{site.description}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-navy-500/10 px-4 py-1.5 text-sm font-semibold text-navy-700">
              <Target className="size-4" />
              رسالتنا
            </span>
            <h2 className="mt-4 font-display text-2xl text-navy-800">أن لا يضيع طالب فرصته بسبب المعلومة</h2>
            <p className="mt-4 text-[15px] leading-8 text-ink-600">
              وُلدت فكرة «بَوْصلة» من مشكلة يعرفها كل طالب عربي: المنح موجودة، لكنها متناثرة بين مئات المواقع
              بلغات مختلفة وشروط معقّدة. جمعناها في مكان واحد، وترجمناها إلى لغة مفهومة، وأضفنا إليها أدوات
              تجهّز ملفك للتقديم.
            </p>

            <div className="mt-6 flex items-start gap-3 glass-soft rounded-2xl p-5">
              <Eye className="mt-0.5 size-5 shrink-0 text-gold-700" />
              <div>
                <p className="font-bold text-navy-800">رؤيتنا</p>
                <p className="mt-1 text-[13px] leading-7 text-ink-600">
                  أن تكون بَوْصلة المرجع العربي الأول للمنح الدراسية، وأن يصل كل طالب إلى الفرصة التي تناسب
                  قدراته، لا التي يصادفها بالمصادفة.
                </p>
              </div>
            </div>
          </div>

          <TeamScene className="w-full" />
        </div>
      </section>

      <section className="py-14">
        <div className="container-page">
          <SectionHeading eyebrow="قيمنا" title="على ماذا نبني بَوْصلة" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div key={value.title} className="glass rounded-2xl p-6">
                <span className="grid size-12 place-items-center rounded-xl bg-navy-500/10 text-navy-700">
                  <value.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-800">{value.title}</h3>
                <p className="mt-2 text-[13px] leading-7 text-ink-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page rounded-3xl bg-navy-700 px-6 py-12 text-center text-white">
          <h2 className="font-display text-2xl">لديك سؤال أو اقتراح؟</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-8 text-navy-100">
            فريق بَوْصلة يقرأ كل رسالة. تواصل معنا وسنرد عليك في أقرب وقت.
          </p>
          <ButtonLink to="/contact" variant="gold" size="lg" className="mt-6">
            تواصل معنا
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
