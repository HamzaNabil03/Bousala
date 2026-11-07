import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BellRing,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Clock3,
  FileCheck2,
  Mail,
  SearchCheck,
  Sparkles,
  Star,
  Target,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import { metaApi, scholarshipApi, serviceApi, showcaseApi } from "@/api/endpoints";
import { FacebookIcon, GithubIcon, LinkedinIcon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useMeta } from "@/context/MetaContext";
import { useApi } from "@/hooks/useApi";
import { useSaved } from "@/hooks/useSaved";
import { deadlineLabel, formatNumber, formatServiceMoney } from "@/lib/utils";

const STAT_LABELS = [
  { key: "scholarships", label: "منحة متاحة حالياً" },
  { key: "countries", label: "دولة حول العالم" },
  { key: "majors", label: "تخصصاً أكاديمياً" },
  { key: "students", label: "طالباً وطالبة" },
];

const FEATURES = [
  { icon: BadgeCheck, title: "منح تناسبك بدقة", description: "نرشح لك الفرص الأقرب إلى مؤهلاتك وطموحك الأكاديمي." },
  { icon: SearchCheck, title: "بحث شامل ومرن", description: "فلترة متقدمة حسب الدولة والتخصص والمرحلة ونوع التمويل." },
  { icon: Clock3, title: "لن تفوّت المواعيد", description: "تنبيهات واضحة تساعدك على متابعة مواعيد التقديم المهمة." },
  { icon: Sparkles, title: "أدوات ذكية مساعدة", description: "مراجعة ذكية للسيرة الذاتية وخطاب الدافع والمستندات." },
];

const STEPS = [
  {
    icon: UserRoundPlus,
    title: "أنشئ ملفك",
    description: "سجّل بياناتك الأكاديمية ومؤهلاتك واهتماماتك لتحديد الفرص المناسبة.",
    image: "/images/landing/journey/academic-profile.png",
    imageAlt: "صفحة الملف الأكاديمي وتحديث بيانات الطالب في منصة بوصلة",
  },
  {
    icon: Target,
    title: "اكتشف المنح",
    description: "يعرض لك بوصلة المنح الأقرب إلى ملفك الأكاديمي وطموحك.",
    image: "/images/landing/journey/scholarship-discovery.png",
    imageAlt: "صفحة اكتشاف المنح الدراسية والبحث والتصفية",
  },
  {
    icon: FileCheck2,
    title: "جهّز طلبك",
    description: "استخدم خدماتنا وأدواتنا الذكية لمراجعة مستنداتك وتجهيز طلب قوي.",
    image: "/images/landing/journey/student-services.png",
    imageAlt: "صفحة خدمات الطلاب لتجهيز مستندات التقديم",
  },
  {
    icon: BellRing,
    title: "تابع فرصتك",
    description: "احفظ المنح وتابع الطلبات والمواعيد والتحديثات من مكان واحد.",
    image: "/images/landing/journey/profile-and-tracking.png",
    imageAlt: "صفحة طلبات الطالب ومتابعة حالة الطلب",
  },
];

const COUNTRY_IMAGES = {
  GB: "/images/landing/uk-flag.png",
  TR: "/images/landing/turkey-flag.png",
  DE: "/images/germany-campus.png",
  SA: "/images/student-success.jpg",
};

export default function LandingPage() {
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const { site } = useMeta();
  const { isSaved, toggle } = useSaved();
  const { data: stats } = useApi(metaApi.stats, []);
  const { data: featured, loading: featuredLoading } = useApi(scholarshipApi.featured, []);
  const { data: services } = useApi(serviceApi.list, []);
  const { data: team } = useApi(showcaseApi.team, []);
  const { data: testimonials } = useApi(showcaseApi.testimonials, []);

  return (
    <main className="overflow-hidden bg-white">
      <section className="relative isolate min-h-[590px] bg-[#f5f8fc] lg:min-h-[700px]">
        <img
          src={site.media?.hero?.url || "/images/landing/hero-1397.jpg"}
          srcSet={site.media?.hero?.srcset || undefined}
          sizes="100vw"
          alt="طلاب وطالبات يحتفلون بالتخرج في حرم جامعي"
          width={site.media?.hero?.width || 1397}
          height={site.media?.hero?.height || 768}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-[38%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-white/75 sm:bg-transparent" />

        <div className="container-page relative flex min-h-[590px] items-center pb-28 pt-14 lg:min-h-[700px] lg:pb-36">
          <div className="w-full max-w-[590px] animate-fade-up text-right">
            <h1 className="font-display text-[2rem] leading-[1.45] font-bold text-[#17347a] sm:text-[2.75rem] lg:text-[3.2rem]">
              كانت المنحة مجرد حلم... مع بوصلة أصبحت واقعاً أفضل
            </h1>
            <p className="mt-6 max-w-[570px] text-sm leading-7 text-ink-600 sm:text-base sm:leading-8">
              كل يوم يبحث آلاف الطلبة عن فرص للدراسة بالخارج. بوصلة تحول هذا البحث إلى مسار أكاديمي موثوق، يرافقك خطوة بخطوة ويزوّدك بأدوات تساعدك على الوصول لفرصتك القادمة.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink to="/scholarships" size="lg" className="min-w-48 rounded-lg bg-[#142e70]">
                اكتشف المنح الآن
                <ArrowLeft className="size-4" />
              </ButtonLink>
              <ButtonLink to="/about" size="lg" variant="outline" className="min-w-44 rounded-lg border-ink-200 bg-white/90 text-navy-800">
                تعرف على بوصلة
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-1/2">
          <div className="container-page">
            <div className="grid overflow-hidden rounded-lg bg-[#162e71] text-white shadow-[0_18px_38px_-18px_rgba(17,37,85,.75)] sm:grid-cols-2 lg:grid-cols-4">
              {STAT_LABELS.map((stat) => (
                <div key={stat.key} className="relative px-5 py-5 text-center after:absolute after:inset-y-5 after:end-0 after:hidden after:w-px after:bg-white/15 after:content-[''] sm:after:block lg:py-7">
                  <p className="num text-[1.6rem] font-medium tracking-wide text-white sm:text-3xl">+{formatNumber(stats?.[stat.key] ?? 0)}</p>
                  <p className="mt-1 text-xs leading-5 text-white/80 sm:text-[13px]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white pb-20 pt-28 sm:pt-32 lg:pb-24">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-24 opacity-60" aria-hidden="true">
          <span className="absolute -left-24 top-16 h-44 w-80 rounded-[50%] border-[22px] border-[#edf5ff]" />
          <span className="absolute left-[31%] top-32 h-52 w-72 rounded-[45%] border-[18px] border-[#f1f6fd]" />
          <span className="absolute right-[-5rem] top-5 h-48 w-96 rounded-[48%] border-[24px] border-[#eff6ff]" />
        </div>
        <div className="container-page relative">
          <LandingHeading title="كل ما تحتاجه لتصل إلى فرصتك القادمة" description="اكتشف المنح المناسبة لك، تابع مواعيد التقديم، واستفد من أدواتنا الذكية لتجهيز ملفك الأكاديمي بأفضل صورة." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="min-h-52 rounded-md bg-[#eaf4ff] px-6 py-7 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="mx-auto grid size-11 place-items-center rounded-md bg-white text-[#17347a] shadow-sm"><feature.icon className="size-5" strokeWidth={2} /></span>
                <h3 className="mt-5 font-display text-lg font-bold text-[#17347a]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7faff] py-16 lg:py-20">
        <div className="container-page">
          <LandingHeading title="خدمات تساعدك على تقديم أقوى" description="اطلب خدمات الكتابة والتجهيز بأسعار وحقول محدثة مباشرة من لوحة الإدارة." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(services ?? []).slice(0, 4).map((service) => (
              <article key={service.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-900/5">
                {service.has_image ? <img src={`/api/v1/services/${service.slug}/icon?v=${encodeURIComponent(service.updated_at ?? "")}`} alt="" className="h-36 w-full object-cover" /> : null}
                <div className="flex flex-1 flex-col p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-gold-400/25 text-navy-800"><Icon name={service.icon} className="size-5" /></span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{service.name}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-ink-600">{service.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-2"><span className="font-bold text-navy-800" dir="ltr">{service.price > 0 ? formatServiceMoney(service.price, service.currency) : "مجانًا"}</span><Link to={isAuthenticated ? `/services/${service.slug}/request` : `/login?next=${encodeURIComponent(`/services/${service.slug}/request`)}`} className="text-sm font-bold text-navy-700">اطلب الخدمة</Link></div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center"><ButtonLink to="/services" variant="outline">عرض جميع الخدمات</ButtonLink></div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <LandingHeading title="اكتشف فرصتك القادمة" description="استكشف مجموعة من المنح الدراسية المميزة واكتشف الفرص التي قد تكون مناسبة لطموحك الأكاديمي." />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, index) => <FeaturedSkeleton key={index} />)
              : (featured ?? []).slice(0, 4).map((scholarship) => (
                  <FeaturedScholarship key={scholarship.id} scholarship={scholarship} saved={isSaved(scholarship.slug)} onToggleSave={toggle} />
                ))}
          </div>
          <div className="mt-9 text-center">
            <Link to="/scholarships" className="inline-flex items-center gap-2 text-sm font-bold text-[#17347a] hover:text-navy-500">عرض جميع المنح<ArrowLeft className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="container-page">
          <LandingHeading title="كيف تعمل منصة بوصلة؟" description="نساعدك على الانتقال من مجرد البحث العشوائي إلى الاستعداد الفعلي للتقديم بخطوات واضحة وبسيطة." />
          <div className="mt-14 grid items-center gap-x-8 gap-y-8 lg:grid-cols-[1fr_1.35fr_1fr]" role="tablist" aria-label="مراحل استخدام منصة بوصلة">
            <div className="space-y-4 lg:space-y-10">
              <JourneyStep step={STEPS[0]} number={1} active={activeJourneyStep === 0} onSelect={() => setActiveJourneyStep(0)} />
              <JourneyStep step={STEPS[1]} number={2} active={activeJourneyStep === 1} onSelect={() => setActiveJourneyStep(1)} />
            </div>
            <div className="order-first mx-auto w-full max-w-[620px] lg:order-none">
              <LaptopPreview activeStep={activeJourneyStep} />
            </div>
            <div className="space-y-4 lg:space-y-10">
              <JourneyStep step={STEPS[2]} number={3} active={activeJourneyStep === 2} onSelect={() => setActiveJourneyStep(2)} />
              <JourneyStep step={STEPS[3]} number={4} active={activeJourneyStep === 3} onSelect={() => setActiveJourneyStep(3)} />
            </div>
          </div>
        </div>
      </section>

      {team?.length ? <TeamSection members={team} /> : null}
      {testimonials?.length ? <TestimonialsSection items={testimonials} /> : null}

      <section className="bg-white pb-28 pt-20 lg:pb-32 lg:pt-28">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <img src={site.media?.cta?.url || "/images/landing/cta-1376.jpg"} srcSet={site.media?.cta?.srcset || undefined} sizes="(min-width: 1024px) 50vw, 100vw" width={site.media?.cta?.width || 1376} height={site.media?.cta?.height || 768} alt="طالب يحتفل بإنجاز تخرجه عبر الدراسة الرقمية" loading="lazy" decoding="async" className="aspect-[16/9] w-full rounded-sm object-cover object-center" />
          </div>
          <div className="order-1 text-right lg:order-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#2b52ab]"><span className="grid size-5 place-items-center rounded-full border border-navy-200 text-[10px]">◎</span>بوصلة رحلتك</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.5] text-[#17347a] sm:text-4xl">مستعد تبدأ رحلتك الأكاديمية؟</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">انضم إلى آلاف الطلاب والباحثين، واكتشف المنح الدراسية المتاحة الآن واستفد من حلولنا الذكية لتجهيز طلبك.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink to="/scholarships" size="lg" className="rounded-lg bg-[#142e70]">اكتشف فرصتك الآن<ArrowLeft className="size-4" /></ButtonLink>
              <ButtonLink to={isAuthenticated ? "/tools" : "/register"} variant="outline" size="lg" className="rounded-lg border-ink-200 bg-[#f7f9fc] text-navy-700">
                {isAuthenticated ? "استكشف الأدوات الذكية" : "أنشئ حساباً مجاناً"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingHeading({ title, description }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-display text-2xl font-bold text-[#17347a] sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-ink-600">{description}</p>
    </div>
  );
}

function TeamSection({ members }) {
  return (
    <section className="bg-[#f7faff] py-16 lg:py-24" aria-labelledby="team-title">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center"><h2 id="team-title" className="font-display text-2xl font-bold text-[#17347a] sm:text-3xl">تعرف على فريقنا</h2><p className="mt-3 text-sm leading-7 text-ink-600">الأشخاص الذين يعملون على جعل رحلة البحث عن المنح أكثر وضوحًا وسهولة.</p></div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => <article key={member.id} className="group overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 ring-navy-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            {member.photo_url ? <img src={member.photo_url} alt={`صورة ${member.name}`} loading="lazy" decoding="async" className="aspect-square w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid aspect-square w-full place-items-center bg-gradient-to-br from-[#e7efff] to-[#f8fbff] text-[#17347a]"><UserRound className="size-20 stroke-[1.25]" aria-hidden="true" /></div>}
            <div className="p-5"><h3 className="font-display text-lg font-bold text-navy-900">{member.name}</h3><p className="mt-1 text-sm font-semibold text-[#b17a12]">{member.role}</p>{member.biography ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-600">{member.biography}</p> : null}<TeamSocials member={member} /></div>
          </article>)}
        </div>
      </div>
    </section>
  );
}

function TeamSocials({ member }) {
  const links = [
    { url: member.linkedin_url, label: "LinkedIn", Icon: LinkedinIcon },
    { url: member.github_url, label: "GitHub", Icon: GithubIcon },
    { url: member.facebook_url, label: "Facebook", Icon: FacebookIcon },
    { url: member.email ? `mailto:${member.email}` : null, label: "البريد الإلكتروني", Icon: Mail },
  ].filter((item) => item.url);
  if (!links.length) return null;
  return <div className="mt-4 flex justify-center gap-2">{links.map(({ url, label, Icon: SocialIcon }) => <a key={label} href={url} target={url.startsWith("http") ? "_blank" : undefined} rel={url.startsWith("http") ? "noopener noreferrer" : undefined} aria-label={`${label} — ${member.name}`} className="grid size-9 place-items-center rounded-full bg-navy-50 text-navy-600 transition hover:bg-navy-700 hover:text-white"><SocialIcon className="size-4" /></a>)}</div>;
}

function TestimonialsSection({ items }) {
  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="testimonials-title">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center"><h2 id="testimonials-title" className="font-display text-2xl font-bold text-[#17347a] sm:text-3xl">ماذا يقول طلابنا؟</h2><p className="mt-3 text-sm leading-7 text-ink-600">تجارب حقيقية شاركها طلاب استخدموا خدمات بوصلة.</p></div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <article key={item.id} className="relative flex min-h-64 flex-col rounded-2xl bg-[#f8faff] p-6 shadow-sm ring-1 ring-navy-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <span className="absolute end-5 top-3 font-serif text-6xl leading-none text-gold-400/30" aria-hidden="true">“</span>
            {item.rating ? <div className="flex gap-1 text-gold-500" aria-label={`التقييم ${item.rating} من 5`}>{Array.from({ length: item.rating }).map((_, index) => <Star key={index} className="size-4 fill-current" />)}</div> : null}
            <blockquote className="mt-4 flex-1 text-sm leading-8 text-ink-700">{item.feedback_text}</blockquote>
            {item.related_service ? <p className="mt-4 text-xs font-semibold text-navy-500">الخدمة: {item.related_service.name}</p> : null}
            <footer className="mt-5 flex items-center gap-3 border-t border-navy-900/8 pt-4">{item.photo_url ? <img src={item.photo_url} alt={`صورة ${item.student_name}`} loading="lazy" decoding="async" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-[#dfe9fb] font-display text-lg font-bold text-[#17347a]">{item.student_name.trim().charAt(0)}</span>}<div><cite className="not-italic font-bold text-navy-900">{item.student_name}</cite>{item.student_description ? <p className="mt-0.5 text-xs text-ink-500">{item.student_description}</p> : null}</div></footer>
          </article>)}
        </div>
      </div>
    </section>
  );
}

function FeaturedScholarship({ scholarship, saved, onToggleSave }) {
  const image = COUNTRY_IMAGES[String(scholarship.country_code ?? "").toUpperCase()];

  return (
    <article className="group relative isolate min-h-[350px] overflow-hidden rounded-[18px] bg-navy-800 shadow-[0_14px_25px_-13px_rgba(11,26,61,.7)]">
      {image ? (
        <img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
      ) : (
        <CountryFlag code={scholarship.country_code} className="absolute inset-0 !h-full !w-full !rounded-none transition duration-500 group-hover:scale-105" style={{ backgroundSize: "cover", backgroundPosition: "center" }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07122f] via-[#07122f]/30 to-transparent" />
      <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-navy-800 shadow-sm">{scholarship.funding_label ?? "منحة دراسية"}</span>
        <button type="button" onClick={() => onToggleSave(scholarship)} aria-label={saved ? "إزالة من المحفوظات" : "حفظ المنحة"} aria-pressed={Boolean(saved)} className="relative z-20 grid size-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-white hover:text-navy-800">
          {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
        <p className="text-[11px] font-semibold text-white/75">{scholarship.country_name_ar ?? "فرصة دولية"}</p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-xl leading-8 font-bold"><Link to={`/scholarships/${scholarship.slug}`} className="after:absolute after:inset-0 after:z-0">{scholarship.title_ar}</Link></h3>
        <p className="mt-1 truncate text-xs text-white/70">{scholarship.provider}</p>
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px] text-white/85">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-gold-300" />{deadlineLabel(scholarship.days_until_deadline)}</span>
          <span className="inline-flex items-center gap-1 text-gold-300">اعرف التفاصيل<ArrowLeft className="size-3" /></span>
        </div>
      </div>
    </article>
  );
}

function FeaturedSkeleton() {
  return <div className="min-h-[350px] animate-pulse rounded-[18px] bg-navy-100" />;
}

function JourneyStep({ step, number, active, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls="journey-preview"
      onClick={onSelect}
      className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-right transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17347a] focus-visible:ring-offset-2 ${active ? "border-[#17347a]/20 bg-[#f1f6ff] shadow-[0_12px_28px_-20px_rgba(23,52,122,.75)]" : "border-transparent bg-transparent hover:border-navy-100 hover:bg-[#f8faff]"}`}
    >
      <span className={`num grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition ${active ? "bg-[#17347a] text-white ring-4 ring-[#dfe9ff]" : "bg-[#f3f6fb] text-[#17347a] ring-1 ring-navy-100 group-hover:bg-[#e9f1ff]"}`}>{number}</span>
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[#17347a]"><step.icon className={`size-4 ${active ? "text-[#17347a]" : "text-navy-400"}`} />{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink-600">{step.description}</p>
      </div>
    </button>
  );
}

function LaptopPreview({ activeStep }) {
  const step = STEPS[activeStep];

  return (
    <div id="journey-preview" role="tabpanel" aria-live="polite" className="relative mx-auto pb-12 pt-2">
      <div className="relative mx-auto w-[88%] overflow-hidden rounded-t-[12px] border-[8px] border-[#25303f] bg-white shadow-xl">
        <span className="absolute left-1/2 top-[-5px] z-20 size-1 -translate-x-1/2 rounded-full bg-ink-500" />
        <div className="flex h-4 items-center justify-between border-b border-ink-100 bg-white px-2"><span className="h-1.5 w-8 rounded bg-navy-700" /><span className="h-1 w-20 rounded bg-ink-100" /></div>
        <div className="relative aspect-[16/9] overflow-hidden bg-[#f3f6fb]">
          {STEPS.map((journeyStep, index) => (
            <img
              key={`${journeyStep.image}-${index}`}
              src={journeyStep.image}
              alt={index === activeStep ? journeyStep.imageAlt : ""}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 size-full object-contain object-top transition-all duration-500 ${index === activeStep ? "scale-100 opacity-100" : "pointer-events-none scale-[1.015] opacity-0"}`}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 mx-auto h-4 w-full rounded-b-[60%] bg-gradient-to-b from-[#d7dce3] to-[#8e99a7] shadow-md" />
      <div className="absolute bottom-0 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[50%] bg-black/10 blur-md" />
      <p className="absolute inset-x-0 bottom-5 z-10 mx-auto w-max max-w-[85%] -translate-y-1 rounded-full bg-[#17347a] px-4 py-1.5 text-center text-xs font-bold text-white shadow-lg sm:text-sm">{numberToArabic(activeStep + 1)}. {step.title}</p>
    </div>
  );
}

function numberToArabic(number) {
  return new Intl.NumberFormat("ar", { useGrouping: false }).format(number);
}
