import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  GraduationCap,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Section";
import { Progress } from "@/components/ui/Progress";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingBlock } from "@/components/ui/Spinner";
import { adminApi } from "@/api/endpoints";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const TONE_BOX = {
  warning: "bg-[color:var(--color-warning)]/16 backdrop-blur-md text-[#78350f]",
  info: "bg-[color:var(--color-info)]/12 backdrop-blur-md text-[#1e3a8a]",
  danger: "bg-[color:var(--color-danger)]/12 backdrop-blur-md text-[#7f1d1d]",
};

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi(adminApi.dashboard, []);

  if (loading) return <LoadingBlock className="py-24" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="نظرة عامة"
        description="حالة المنصة اليوم: المنح والمستخدمون والطلبات وتشغيلات الأدوات."
      />

      {/* الأرقام */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="إجمالي المنح"
          value={stats.total_scholarships ?? 0}
          hint={`${stats.published_scholarships ?? 0} منشورة`}
          icon={<GraduationCap className="size-5" />}
        />
        <StatCard label="الطلاب المسجّلون" value={stats.students ?? 0} icon={<Users className="size-5" />} tone="info" />
        <StatCard
          label="طلبات سيرة ذاتية مفتوحة"
          value={stats.open_orders ?? 0}
          icon={<ClipboardList className="size-5" />}
          tone="gold"
        />
        <StatCard
          label="تشغيلات أدوات الذكاء"
          value={stats.ai_runs ?? 0}
          icon={<Sparkles className="size-5" />}
          tone="success"
        />
      </div>

      {/* نسبة النشر */}
      <Card>
        <CardHeader title="نسبة المنح المنشورة" subtitle="من إجمالي المنح المسجّلة في المنصة." />
        <CardBody>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-ink-600">
              <span className="num font-extrabold text-navy-700">{stats.published_scholarships ?? 0}</span> من{" "}
              <span className="num">{stats.total_scholarships ?? 0}</span> منحة
            </span>
            <span className="num font-extrabold text-navy-700">{stats.published_percent ?? 0}%</span>
          </div>
          <Progress className="mt-3" value={stats.published_percent ?? 0} tone="success" />
        </CardBody>
      </Card>

      {/* تحتاج انتباهك */}
      <Card>
        <CardHeader title="تحتاج انتباهك" icon={<TriangleAlert className="size-4" />} />
        <CardBody>
          {(data?.attention ?? []).length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-500">لا توجد مهام معلّقة — كل شيء على ما يرام.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.attention.map((item) => (
                <li
                  key={item.key}
                  className={cn("flex items-start justify-between gap-4 rounded-xl p-4", TONE_BOX[item.tone] ?? TONE_BOX.info)}
                >
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span className="num">{item.count}</span> — {item.title}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-6 opacity-90">{item.note}</p>
                    <Link to={item.href} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold underline">
                      {item.cta}
                      <ArrowLeft className="size-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* روابط سريعة */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: "/admin/scholarships/new", label: "إضافة منحة جديدة", icon: GraduationCap },
          { to: "/admin/notifications", label: "إرسال إشعار للطلاب", icon: Sparkles },
          { to: "/admin/reports", label: "عرض التقارير", icon: ClipboardList },
        ].map((action) => (
          <ButtonLink key={action.to} to={action.to} variant="outline" className="h-14 justify-start">
            <action.icon className="size-5 text-navy-600" />
            {action.label}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}
