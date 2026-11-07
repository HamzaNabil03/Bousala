import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  CircleCheck,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  Share2,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Spinner";
import { scholarshipApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { useSaved } from "@/hooks/useSaved";
import { deadlineLabel, formatDateAr, formatGpa, formatNumber, formatServiceMoney } from "@/lib/utils";

const URGENCY_TONE = { closed: "danger", urgent: "danger", soon: "warning", open: "success" };

export default function ScholarshipDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { isSaved, toggle } = useSaved();

  const { data: scholarship, loading, error } = useApi(() => scholarshipApi.show(slug), [slug]);

  if (loading) return <LoadingBlock className="py-24" />;

  if (error || !scholarship) {
    return (
      <div className="container-page py-16">
        <Alert tone="danger" title="تعذّر عرض المنحة">
          {error ?? "المنحة غير موجودة أو لم تعد متاحة."}
        </Alert>
        <ButtonLink to="/scholarships" variant="outline" className="mt-6">
          <ArrowRight className="size-4" />
          العودة لقائمة المنح
        </ButtonLink>
      </div>
    );
  }

  const saved = isSaved(scholarship.slug);
  const platformApplicationAvailable = scholarship.platform_application_enabled && scholarship.platform_application_requests_enabled;

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: scholarship.title_ar, url }).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  const facts = [
    { icon: MapPin, label: "الدولة", value: scholarship.country_name_ar },
    { icon: Building2, label: "الجهة المانحة", value: scholarship.provider },
    { icon: Wallet, label: "نوع التمويل", value: scholarship.funding_label },
    { icon: Languages, label: "شهادة اللغة", value: scholarship.language_label },
    {
      icon: GraduationCap,
      label: "المرحلة",
      value: scholarship.levels?.map((level) => level.label).join("، ") || "—",
    },
    {
      icon: CalendarDays,
      label: "آخر موعد للتقديم",
      value: formatDateAr(scholarship.deadline),
    },
  ];

  return (
    <div className="pb-12">
      {/* الترويسة */}
      <div className="bg-navy-700 text-white">
        <div className="container-page py-8">
          <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-navy-100">
            <Link to="/" className="hover:text-white">
              الرئيسية
            </Link>
            <span>/</span>
            <Link to="/scholarships" className="hover:text-white">
              اكتشف المنح
            </Link>
            <span>/</span>
            <span className="truncate text-white">{scholarship.title_ar}</span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
                  <CountryFlag code={scholarship.country_code} className="text-lg" />
                  {scholarship.country_name_ar}
                </span>
                <Badge tone={URGENCY_TONE[scholarship.deadline_urgency] ?? "neutral"} onDark dot>
                  {deadlineLabel(scholarship.days_until_deadline)}
                </Badge>
                {scholarship.is_featured ? <Badge tone="gold" onDark>منحة مميزة</Badge> : null}
              </div>

              <h1 className="font-display text-2xl leading-relaxed sm:text-3xl">{scholarship.title_ar}</h1>
              {scholarship.title_en ? (
                <p className="mt-1.5 text-sm text-navy-200" dir="ltr">
                  {scholarship.title_en}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-navy-100">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" />
                  {scholarship.provider}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" />
                  <span className="num">{formatNumber(scholarship.views_count)}</span> مشاهدة
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              {scholarship.apply_url ? (
                <ButtonLink to={scholarship.apply_url} external variant="gold" size="lg">
                  التقديم مباشرة لدى الجهة
                  <ExternalLink className="size-4" />
                </ButtonLink>
              ) : null}

              {platformApplicationAvailable ? (
                <ButtonLink
                  to={isAuthenticated ? `/services/scholarship-application-assistance/request?scholarship=${scholarship.slug}` : `/login?next=${encodeURIComponent(`/services/scholarship-application-assistance/request?scholarship=${scholarship.slug}`)}`}
                  variant="onDark"
                  size="lg"
                >
                  قدّم من خلالنا · {formatServiceMoney(scholarship.platform_application_price, scholarship.platform_application_currency)}
                </ButtonLink>
              ) : null}

              <Button variant="onDark" size="lg" onClick={() => toggle(scholarship)}>
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? "محفوظة" : "حفظ"}
              </Button>

              <Button variant="onDark" size="lg" onClick={share} aria-label="مشاركة المنحة">
                <Share2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="عن المنحة" icon={<FileText className="size-4" />} />
            <CardBody>
              <p className="text-[15px] leading-8 whitespace-pre-line text-ink-700">
                {scholarship.description}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="التقديم على المنحة" icon={<GraduationCap className="size-4" />} />
            <CardBody className="space-y-5">
              {platformApplicationAvailable ? (
                <>
                  <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-bold text-emerald-800">
                        <CircleCheck className="size-5" />
                        التقديم من خلال منصتنا متاح
                      </p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        {scholarship.platform_application_description || "يساعدك فريق بَوْصلة في تجهيز طلب المنحة ومراجعته قبل التقديم."}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-4 py-2 font-bold text-navy-900 shadow-sm">
                      {formatServiceMoney(scholarship.platform_application_price, scholarship.platform_application_currency)}
                    </span>
                  </div>

                  {scholarship.platform_application_documents?.length ? (
                    <div>
                      <p className="text-sm font-bold text-navy-900">المستندات الإضافية المطلوبة</p>
                      <ul className="mt-2 grid gap-2 text-sm text-ink-600 sm:grid-cols-2">
                        {scholarship.platform_application_documents.map((document) => (
                          <li key={document} className="flex items-center gap-2">
                            <FileText className="size-4 text-navy-500" />
                            {document}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <ButtonLink
                      to={isAuthenticated ? `/services/scholarship-application-assistance/request?scholarship=${scholarship.slug}` : `/login?next=${encodeURIComponent(`/services/scholarship-application-assistance/request?scholarship=${scholarship.slug}`)}`}
                    >
                      قدّم من خلالنا
                    </ButtonLink>
                    {scholarship.apply_url ? (
                      <ButtonLink to={scholarship.apply_url} external variant="outline">
                        التقديم المباشر لدى الجهة
                        <ExternalLink className="size-4" />
                      </ButtonLink>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Alert tone="warning">التقديم من خلال منصتنا غير متاح حاليًا لهذه المنحة.</Alert>
                  {scholarship.apply_url ? (
                    <ButtonLink to={scholarship.apply_url} external variant="outline">
                      التقديم المباشر لدى الجهة
                      <ExternalLink className="size-4" />
                    </ButtonLink>
                  ) : null}
                </>
              )}

              <p className="text-xs leading-6 text-ink-500">
                التقديم المباشر ينقلك إلى موقع الجهة المانحة، أما «قدّم من خلالنا» فهو طلب خدمة مساعدة مدفوعة من فريق بَوْصلة ولا يضمن القبول.
              </p>
            </CardBody>
          </Card>

          {scholarship.benefits?.length ? (
            <Card>
              <CardHeader title="مزايا المنحة" icon={<Sparkles className="size-4" />} />
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
                  {scholarship.benefits.map((benefit) => (
                    <div key={benefit.id} className="flex gap-3 glass-soft rounded-xl p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700">
                        <Icon name={benefit.icon} className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-navy-800">{benefit.title}</p>
                        <p className="mt-1 text-[13px] leading-6 text-ink-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {scholarship.eligibility?.length ? (
            <Card>
              <CardHeader title="شروط الأهلية" icon={<CircleCheck className="size-4" />} />
              <CardBody>
                <ul className="space-y-3">
                  {scholarship.eligibility.map((item) => (
                    <li key={item.id} className="flex gap-2.5 text-[15px] leading-7 text-ink-700">
                      <CircleCheck className="mt-1 size-4 shrink-0 text-[color:var(--color-success)]" />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {scholarship.documents?.length ? (
            <Card>
              <CardHeader title="المستندات المطلوبة" icon={<FileText className="size-4" />} />
              <CardBody>
                <ul className="divide-y divide-ink-900/10">
                  {scholarship.documents.map((document) => (
                    <li key={document.id} className="flex items-center justify-between gap-4 py-3">
                      <span className="flex items-center gap-2.5 text-[15px] text-ink-700">
                        <FileText className="size-4 shrink-0 text-navy-500" />
                        {document.name}
                      </span>
                      {document.note ? <Badge tone="outline">{document.note}</Badge> : null}
                    </li>
                  ))}
                </ul>

                <Alert tone="info" className="mt-4">
                  يجهّز فريق بَوْصلة سيرتك الذاتية وخطاب دافعك بإشراف خبير أكاديمي — تصفّح{" "}
                  <Link to="/tools" className="font-bold underline">
                    خدمة صياغة السيرة الذاتية وخطاب الدافع
                  </Link>
                  .
                </Alert>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* العمود الجانبي */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="معلومات سريعة" />
            <CardBody className="space-y-3.5">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-500">
                    <fact.icon className="size-4" />
                    {fact.label}
                  </span>
                  <span className="text-end font-semibold text-navy-800">{fact.value}</span>
                </div>
              ))}

              {scholarship.min_gpa ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-500">
                    <GraduationCap className="size-4" />
                    الحد الأدنى للمعدل
                  </span>
                  <span className="num font-semibold text-navy-800">
                    {formatGpa(scholarship.min_gpa, scholarship.gpa_scale)}
                  </span>
                </div>
              ) : null}

              {scholarship.acceptance_rate ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-500">
                    <CircleCheck className="size-4" />
                    نسبة القبول التقريبية
                  </span>
                  <span className="num font-semibold text-navy-800">{scholarship.acceptance_rate}%</span>
                </div>
              ) : null}

              {scholarship.open_date ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-500">
                    <CalendarDays className="size-4" />
                    فتح باب التقديم
                  </span>
                  <span className="font-semibold text-navy-800">{formatDateAr(scholarship.open_date)}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {scholarship.majors?.length ? (
            <Card>
              <CardHeader title="التخصصات المشمولة" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {scholarship.majors.map((major) => (
                    <Link key={major.id} to={`/scholarships?major=${encodeURIComponent(major.name)}`}>
                      <Badge tone="navy">{major.name}</Badge>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {!isAuthenticated ? (
            <div className="glass-dark rounded-2xl p-5 text-white">
              <p className="font-display text-lg font-bold">هل هذه المنحة مناسبة لك؟</p>
              <p className="mt-2 text-[13px] leading-7 text-navy-100">
                أنشئ ملفك الأكاديمي مجاناً لتعرف نسبة مطابقتك مع هذه المنحة وتصلك تنبيهات قبل إغلاق التقديم.
              </p>
              <ButtonLink to="/register" variant="gold" className="mt-4 w-full">
                أنشئ حسابك مجاناً
              </ButtonLink>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
