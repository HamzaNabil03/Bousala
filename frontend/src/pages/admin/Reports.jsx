import { BarChart3, Bookmark, GraduationCap, Sparkles, TriangleAlert, Users } from "lucide-react";

import { BarList, CHART_COLORS, DonutChart, TrendChart } from "@/components/admin/Charts";
import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingBlock } from "@/components/ui/Spinner";
import { adminApi } from "@/api/endpoints";
import { useApi } from "@/hooks/useApi";
import { timeAgoAr } from "@/lib/utils";

/** لون ثابت لكل حالة نشر حتى لا يتغيّر معناه بين الرسوم */
const STATUS_COLOR = {
  published: "#15803d",
  pending: "#b45309",
  draft: "#2b52ab",
  expired: "#b91c1c",
};

export default function AdminReportsPage() {
  const { data, loading, error } = useApi(adminApi.reports, []);

  if (loading) return <LoadingBlock className="py-24" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  const kpis = data?.kpis ?? {};

  const failedColumns = [
    { key: "tool", header: "الأداة", cell: (row) => <span className="font-semibold text-navy-800">{row.tool_name}</span> },
    { key: "user", header: "المستخدم", cell: (row) => <span className="text-ink-700">{row.user_name}</span> },
    {
      key: "error",
      header: "الخطأ",
      cell: (row) => <span className="text-[color:var(--color-danger)]">{row.error_message}</span>,
    },
    { key: "time", header: "التوقيت", cell: (row) => <span className="text-ink-500">{timeAgoAr(row.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير والإحصائيات"
        description={`مؤشرات المنصة خلال آخر ${data?.days ?? 14} يوماً.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="المنح المنشورة" value={kpis.published_scholarships ?? 0} icon={<GraduationCap className="size-5" />} />
        <StatCard label="الطلاب" value={kpis.students ?? 0} icon={<Users className="size-5" />} tone="info" />
        <StatCard label="عمليات الحفظ" value={kpis.saves ?? 0} icon={<Bookmark className="size-5" />} tone="gold" />
        <StatCard label="تشغيلات الأدوات" value={kpis.ai_runs ?? 0} icon={<Sparkles className="size-5" />} tone="success" />
      </div>

      {/* الاتجاهات */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="تسجيلات الطلاب" subtitle="عدد الحسابات الجديدة يومياً." icon={<BarChart3 className="size-4" />} />
          <CardBody>
            <TrendChart points={data?.signups_trend ?? []} color={CHART_COLORS[0]} valueLabel="تسجيل" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="تشغيلات أدوات الذكاء" subtitle="عدد مرات استخدام الأدوات يومياً." icon={<Sparkles className="size-4" />} />
          <CardBody>
            <TrendChart points={data?.ai_runs_trend ?? []} color={CHART_COLORS[1]} valueLabel="تشغيل" />
          </CardBody>
        </Card>
      </div>

      {/* التوزيعات */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="توزيع المنح حسب الحالة" />
          <CardBody>
            <DonutChart
              segments={(data?.status_distribution ?? []).map((item) => ({
                label: item.label,
                value: item.value,
                color: STATUS_COLOR[item.key] ?? CHART_COLORS[0],
              }))}
              centerLabel="العدد في الوسط هو إجمالي المنح المسجّلة."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="المنح حسب الدولة" subtitle="أكثر الدول التي تستضيف منحاً في المنصة." />
          <CardBody>
            <BarList
              items={(data?.by_country ?? []).slice(0, 8).map((item) => ({
                label: item.label,
                value: item.value,
                countryCode: item.code,
              }))}
              valueLabel="منحة"
              color={CHART_COLORS[0]}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="المنح حسب التخصص" />
          <CardBody>
            <BarList items={(data?.by_major ?? []).slice(0, 8)} valueLabel="منحة" color={CHART_COLORS[1]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="الأكثر حفظاً لدى الطلاب" icon={<Bookmark className="size-4" />} />
          <CardBody>
            <BarList
              items={(data?.top_saved ?? []).map((item) => ({
                label: item.label,
                value: item.value,
                countryCode: item.country_code,
              }))}
              valueLabel="حفظ"
              color={CHART_COLORS[2]}
            />
          </CardBody>
        </Card>
      </div>

      {/* الأخطاء */}
      <Card>
        <CardHeader
          title="تشغيلات فاشلة"
          subtitle="تحتاج متابعة فنية — قد تشير إلى انقطاع في مزوّد الذكاء الاصطناعي."
          icon={<TriangleAlert className="size-4 text-[color:var(--color-danger)]" />}
        />
        <CardBody className="p-0">
          <DataTable
            columns={failedColumns}
            rows={data?.failed_runs}
            empty="لا توجد تشغيلات فاشلة — كل الأدوات تعمل بسلاسة."
            rowKey={(row) => `${row.tool_name}-${row.created_at}`}
          />
        </CardBody>
      </Card>
    </div>
  );
}
