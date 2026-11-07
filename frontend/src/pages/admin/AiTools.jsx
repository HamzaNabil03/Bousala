import { CircleAlert, CircleCheck, Sparkles, Users } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { Switch } from "@/components/ui/Field";
import { adminApi } from "@/api/endpoints";
import { useApi, useSubmit } from "@/hooks/useApi";
import { timeAgoAr } from "@/lib/utils";

export default function AdminAiToolsPage() {
  const { data, loading, error, reload } = useApi(adminApi.aiTools, []);
  const toggle = useSubmit(adminApi.toggleAiTool);

  const meta = data?.meta ?? {};
  const tools = data?.data?.tools ?? [];
  const runs = data?.data?.recent_runs ?? [];

  const onToggle = async (tool) => {
    const { ok } = await toggle.submit(tool.key);
    if (ok) reload(true);
  };

  const columns = [
    {
      key: "tool",
      header: "الأداة",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Icon name={row.tool_icon} className="size-4 text-navy-600" />
          <span className="font-semibold text-navy-800">{row.tool_name}</span>
        </span>
      ),
    },
    { key: "user", header: "المستخدم", cell: (row) => <span className="text-ink-700">{row.user_name}</span> },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <Badge tone={row.status === "success" ? "success" : "danger"} dot>
          {row.status_label}
        </Badge>
      ),
    },
    {
      key: "duration",
      header: "المدة",
      cell: (row) => <span className="num text-ink-600">{row.duration_ms ?? 0} م.ث</span>,
    },
    { key: "time", header: "التوقيت", cell: (row) => <span className="text-ink-500">{timeAgoAr(row.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="أدوات الذكاء الاصطناعي"
        description="فعّل الأدوات أو أوقفها، وتابع تشغيلاتها ونسبة نجاحها."
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {toggle.error ? <Alert tone="danger">{toggle.error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="إجمالي التشغيلات" value={meta.total_runs ?? 0} icon={<Sparkles className="size-5" />} />
        <StatCard label="تشغيلات هذا الشهر" value={meta.month_runs ?? 0} tone="info" />
        <StatCard label="المستفيدون" value={meta.beneficiaries ?? 0} icon={<Users className="size-5" />} tone="gold" />
        <StatCard
          label="نسبة النجاح"
          value={`${meta.success_rate ?? 0}%`}
          icon={<CircleCheck className="size-5" />}
          tone="success"
          hint={meta.most_used ? `الأكثر استخداماً: ${meta.most_used}` : undefined}
        />
      </div>

      <Card>
        <CardHeader
          title="الأدوات"
          subtitle={`${meta.active_tools ?? 0} من ${meta.total_tools ?? 0} أداة مفعّلة. إيقاف أداة يخفيها عن الطلاب فوراً.`}
        />
        <CardBody className="divide-y divide-ink-900/10 py-1">
          {tools.map((tool) => (
            <div key={tool.key} className="flex items-start gap-4 py-1">
              <span className="mt-3.5 grid size-10 shrink-0 place-items-center rounded-xl bg-navy-500/10 text-navy-600">
                <Icon name={tool.icon} className="size-5" />
              </span>

              <Switch
                label={tool.name_ar}
                description={`${tool.description} — ${tool.month_runs_count ?? 0} تشغيل هذا الشهر.`}
                checked={tool.is_active}
                disabled={toggle.submitting}
                onChange={() => onToggle(tool)}
              />
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="آخر التشغيلات" icon={<CircleAlert className="size-4" />} />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={runs} loading={loading} empty="لا توجد تشغيلات بعد." />
        </CardBody>
      </Card>
    </div>
  );
}
