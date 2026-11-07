import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CalendarDays,
  CircleCheck,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

import { ScholarshipCard, ScholarshipCardSkeleton } from "@/components/scholarships/ScholarshipCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress, ProgressRing } from "@/components/ui/Progress";
import { StatCard } from "@/components/ui/StatCard";
import { dashboardApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { useSaved } from "@/hooks/useSaved";
import { deadlineLabel, formatFileSize } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { isSaved, toggle } = useSaved();
  const { data, loading, error } = useApi(dashboardApi.overview, []);

  const completion = data?.completion;
  const missing = (completion?.sections ?? []).filter((section) => !section.done);

  return (
    <div className="space-y-6">
      {/* ترحيب */}
      <div className="glass-dark rounded-2xl p-6 text-white sm:p-7">
        <h1 className="font-display text-xl sm:text-2xl">
          أهلاً {user?.first_name ?? user?.name} 👋
        </h1>
        <p className="mt-2 text-sm leading-7 text-navy-100">
          {completion?.percent === 100
            ? "ملفك مكتمل — راجع المنح المطابقة أدناه وابدأ التقديم."
            : "أكمل ملفك الأكاديمي لترتفع دقة المنح المرشّحة لك."}
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* الأرقام */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="منح محفوظة"
          value={data?.stats?.saved ?? 0}
          icon={<Bookmark className="size-5" />}
          tone="navy"
        />
        <StatCard
          label="مستندات مرفوعة"
          value={data?.stats?.documents ?? 0}
          icon={<FileText className="size-5" />}
          tone="gold"
        />
        <StatCard
          label="إشعارات غير مقروءة"
          value={data?.stats?.unread_notifications ?? 0}
          icon={<Bell className="size-5" />}
          tone="success"
        />
      </div>

      {/* اكتمال الملف */}
      <Card>
        <CardHeader
          title="اكتمال الملف الأكاديمي"
          icon={<Target className="size-4" />}
          action={
            <Link to="/dashboard/profile" className="text-[13px] font-bold text-navy-600 hover:underline">
              تعديل الملف
            </Link>
          }
        />
        <CardBody>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center">
              <ProgressRing value={completion?.percent ?? 0} size={96} />
              <p className="mt-2 text-[12px] font-semibold text-ink-500">اكتمال الملف</p>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {(completion?.sections ?? []).map((section) => (
                <div key={section.key}>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-1.5 font-semibold text-ink-700">
                      {section.done ? (
                        <CircleCheck className="size-3.5 text-[color:var(--color-success)]" />
                      ) : (
                        <span className="size-3.5 rounded-full border-2 border-ink-300" />
                      )}
                      {section.label}
                    </span>
                    <span className="num text-ink-400">{section.weight}%</span>
                  </div>
                  <Progress
                    className="mt-1.5"
                    value={section.done ? 100 : 0}
                    tone={section.done ? "success" : "navy"}
                    height={5}
                  />
                </div>
              ))}
            </div>
          </div>

          {missing.length > 0 ? (
            <Alert tone="warning" className="mt-5" title="أكمل هذه الأقسام لرفع دقة المطابقة">
              <ul className="mt-1 space-y-1">
                {missing.map((section) => (
                  <li key={section.key}>• {section.hint}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
        </CardBody>
      </Card>

      {/* المنح المطابقة */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-navy-800">منح تطابق ملفك</h2>
          <Link
            to="/scholarships?sort=match"
            className="flex items-center gap-1.5 text-[13px] font-bold text-navy-600 hover:underline"
          >
            عرض الكل
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ScholarshipCardSkeleton key={index} />
            ))}
          </div>
        ) : (data?.matches ?? []).length === 0 ? (
          <EmptyState
            title="لا توجد منح مطابقة بعد"
            description="أكمل ملفك الأكاديمي لنتمكن من ترشيح المنح المناسبة لك."
            action={<ButtonLink to="/dashboard/profile">أكمل ملفك</ButtonLink>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.matches.map((item) => (
              <ScholarshipCard
                key={item.id}
                scholarship={item}
                saved={item.is_saved || isSaved(item.slug)}
                onToggleSave={toggle}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* المواعيد القادمة */}
        <Card>
          <CardHeader title="مواعيد قريبة" icon={<CalendarDays className="size-4" />} />
          <CardBody>
            {(data?.upcoming_deadlines ?? []).length === 0 ? (
              <p className="py-4 text-center text-[13px] text-ink-500">لا توجد مواعيد قريبة.</p>
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {data.upcoming_deadlines.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <Link to={`/scholarships/${item.slug}`} className="flex min-w-0 items-center gap-2.5">
                      <CountryFlag code={item.country_code} className="text-lg" />
                      <span className="truncate text-[13px] font-semibold text-navy-800 hover:underline">
                        {item.title_ar}
                      </span>
                    </Link>
                    <Badge tone={item.days_until_deadline <= 14 ? "danger" : "warning"}>
                      {deadlineLabel(item.days_until_deadline)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* أحدث المستندات */}
        <Card>
          <CardHeader
            title="أحدث مستنداتك"
            icon={<FileText className="size-4" />}
            action={
              <Link to="/dashboard/documents" className="text-[13px] font-bold text-navy-600 hover:underline">
                إدارة
              </Link>
            }
          />
          <CardBody>
            {(data?.documents ?? []).length === 0 ? (
              <p className="py-4 text-center text-[13px] text-ink-500">لم ترفع أي مستند بعد.</p>
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {data.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FileText className="size-4 shrink-0 text-navy-500" />
                      <span className="truncate text-[13px] font-semibold text-ink-800" dir="ltr">
                        {document.original_name}
                      </span>
                    </span>
                    <span className="num shrink-0 text-xs text-ink-400">
                      {document.size_formatted ?? formatFileSize(document.size_bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* دعوة لخدمة صياغة السيرة والخطاب */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gold-400/18 p-6 ring-1 ring-gold-200 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-400 text-navy-900">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-display font-bold text-navy-800">جهّز سيرتك الذاتية</p>
            <p className="mt-1 text-[13px] leading-7 text-ink-600">
              اطلب كتابة سيرتك وخطابك من فريق بَوْصلة، أو ارفع ملفك الحالي لتحسينه بالذكاء الاصطناعي.
            </p>
          </div>
        </div>
        <ButtonLink to="/tools" variant="gold" className="shrink-0">
          ابدأ الطلب
        </ButtonLink>
      </div>
    </div>
  );
}
