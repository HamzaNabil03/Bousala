import { useState } from "react";
import { Bell, Send } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { adminApi } from "@/api/endpoints";
import { useApi, useSubmit } from "@/hooks/useApi";
import { timeAgoAr } from "@/lib/utils";

const BLANK = { title: "", body: "", action_label: "", action_url: "", audience: "all" };

export default function AdminNotificationsPage() {
  const [values, setValues] = useState(BLANK);
  const { data, loading, error, reload } = useApi(adminApi.notifications, []);
  const broadcast = useSubmit(adminApi.broadcast);

  const meta = data?.meta ?? {};

  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await broadcast.submit(values);

    if (ok) {
      setValues(BLANK);
      reload(true);
    }
  };

  const audienceCount = values.audience === "active" ? meta.students_active : meta.students_all;

  const columns = [
    {
      key: "title",
      header: "الإشعار",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-800">{row.title}</p>
          <p className="mt-0.5 text-[12px] text-ink-500">{row.type_label}</p>
        </div>
      ),
    },
    { key: "user", header: "المستلم", cell: (row) => <span className="text-ink-700">{row.user_name}</span> },
    {
      key: "read",
      header: "الحالة",
      cell: (row) => (
        <Badge tone={row.is_read ? "success" : "warning"} dot>
          {row.is_read ? "مقروء" : "غير مقروء"}
        </Badge>
      ),
    },
    { key: "time", header: "التوقيت", cell: (row) => <span className="text-ink-500">{timeAgoAr(row.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="الإشعارات" description="أرسل إشعاراً جماعياً للطلاب وتابع آخر الإشعارات المرسلة." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="إجمالي الإشعارات" value={meta.total ?? 0} icon={<Bell className="size-5" />} />
        <StatCard label="غير مقروءة" value={meta.unread ?? 0} tone="gold" />
        <StatCard label="نسبة القراءة" value={`${meta.read_rate ?? 0}%`} tone="success" />
        <StatCard label="الطلاب النشطون" value={meta.students_active ?? 0} tone="info" />
      </div>

      <Card>
        <CardHeader title="إرسال إشعار جماعي" icon={<Send className="size-4" />} />
        <CardBody>
          {broadcast.success ? (
            <Alert tone="success" className="mb-4">
              تم إرسال الإشعار.
            </Alert>
          ) : null}
          {broadcast.error ? (
            <Alert tone="danger" className="mb-4">
              {broadcast.error}
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Input
              label="عنوان الإشعار"
              required
              className="sm:col-span-2"
              placeholder="مثال: فتح باب التقديم على منح تركيا"
              value={values.title}
              onChange={change("title")}
              error={broadcast.fieldErrors.title?.[0]}
            />
            <Textarea
              label="نص الإشعار"
              required
              className="sm:col-span-2"
              rows={4}
              counter={2000}
              value={values.body}
              onChange={change("body")}
              error={broadcast.fieldErrors.body?.[0]}
            />
            <Input
              label="نص زر الإجراء"
              placeholder="عرض المنحة"
              value={values.action_label}
              onChange={change("action_label")}
              error={broadcast.fieldErrors.action_label?.[0]}
            />
            <Input
              label="رابط الإجراء"
              dir="ltr"
              placeholder="/scholarships/turkiye-burslari"
              value={values.action_url}
              onChange={change("action_url")}
              error={broadcast.fieldErrors.action_url?.[0]}
            />
            <Select
              label="الفئة المستهدفة"
              required
              value={values.audience}
              onChange={change("audience")}
              hint={`سيصل الإشعار إلى ${audienceCount ?? 0} طالب.`}
              error={broadcast.fieldErrors.audience?.[0]}
            >
              <option value="all">كل الطلاب</option>
              <option value="active">الطلاب النشطون فقط</option>
            </Select>

            <div className="flex items-end sm:col-span-2">
              <Button type="submit" loading={broadcast.submitting}>
                <Send className="size-4" />
                إرسال الإشعار
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader title="آخر الإشعارات المرسلة" />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={data?.data} loading={loading} empty="لا توجد إشعارات." />
        </CardBody>
      </Card>
    </div>
  );
}
