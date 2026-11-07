import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Database, Mail, MessageSquare, Save, Server, Sparkles, Wallet } from "lucide-react";

import { BarList, CHART_COLORS } from "@/components/admin/Charts";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingBlock } from "@/components/ui/Spinner";
import { adminApi } from "@/api/endpoints";
import { useApi, useSubmit } from "@/hooks/useApi";
import { timeAgoAr } from "@/lib/utils";

const INTEGRATION_ICON = {
  database: Database,
  ai: Sparkles,
  mail: Mail,
  storage: Server,
};

export default function AdminSettingsPage() {
  const { data, loading, error } = useApi(adminApi.settings, []);

  if (loading) return <LoadingBlock className="py-24" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  const site = data?.site ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="إعدادات المنصة"
        description="بيانات المنصة وحالة التكاملات وحجم البيانات وسجل العمليات."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="الجلسات النشطة" value={data?.active_sessions ?? 0} icon={<Activity className="size-5" />} />
        <Link to="/admin/contact-messages" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="رسائل تواصل غير مقروءة"
            value={data?.unread_messages ?? 0}
            icon={<MessageSquare className="size-5" />}
            tone="gold"
          />
        </Link>
        <StatCard
          label="التكاملات العاملة"
          value={`${(data?.integrations ?? []).filter((item) => item.ok).length} / ${(data?.integrations ?? []).length}`}
          icon={<Server className="size-5" />}
          tone="info"
        />
      </div>

      <PaymentSettings data={data} />

      {/* بيانات المنصة */}
      <Card>
        <CardHeader
          title="بيانات المنصة"
          subtitle="تُعرض في الواجهة والفوتر، وتُضبط من ملف إعدادات الخادم config/menhity.php."
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["الاسم", site.name],
              ["الاسم بالإنجليزية", site.name_en],
              ["الشعار النصي", site.tagline],
              ["البريد الإلكتروني", site.email],
              ["الهاتف", site.phone],
              ["العنوان", site.address],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 glass-soft rounded-lg px-4 py-3">
                <dt className="text-[12.5px] font-semibold text-ink-500">{label}</dt>
                <dd className="text-end text-[13px] font-bold text-navy-800">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          {site.description ? (
            <p className="mt-4 glass-soft rounded-lg px-4 py-3 text-[13px] leading-7 text-ink-600">
              {site.description}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* التكاملات */}
      <Card>
        <CardHeader title="حالة التكاملات" icon={<Server className="size-4" />} />
        <CardBody>
          <ul className="divide-y divide-ink-900/10">
            {(data?.integrations ?? []).map((integration) => {
              const IntegrationIcon = INTEGRATION_ICON[integration.key] ?? Server;

              return (
                <li key={integration.key} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-500/10 text-navy-600">
                    <IntegrationIcon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-800">{integration.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">{integration.note}</p>
                  </div>

                  <Badge tone={integration.ok ? "success" : "warning"} dot>
                    {integration.ok ? "متصل" : "غير مفعّل"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* حجم البيانات */}
      <Card>
        <CardHeader title="حجم البيانات" subtitle="عدد السجلات في كل جدول رئيسي." icon={<Database className="size-4" />} />
        <CardBody>
          <BarList items={data?.data_sizes ?? []} valueLabel="سجل" color={CHART_COLORS[0]} />
        </CardBody>
      </Card>

      {/* سجل العمليات */}
      <Card>
        <CardHeader title="سجل العمليات الإدارية" subtitle="آخر الإجراءات التي نُفّذت من لوحة الإدارة." />
        <CardBody>
          {(data?.audit_log ?? []).length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-500">لا توجد عمليات مسجّلة بعد.</p>
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {data.audit_log.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-800">{entry.description ?? entry.action}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">{entry.actor_name ?? "النظام"}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-ink-400">{timeAgoAr(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * أسعار الخدمات وبيانات الحساب الذي يحوّل إليه الطلاب.
 *
 * سعر صفر يُبقي الخدمة مجانية: لا تحويل ولا إشعار ولا انتظار موافقة.
 * وتعديل السعر لا يمسّ طلباً سابقاً — كل طلب يحمل سعره المجمّد وقت إرساله.
 */
function PaymentSettings({ data }) {
  const [form, setForm] = useState(null);
  const { submit, submitting, error, fieldErrors, success } = useSubmit(adminApi.updatePayment);

  useEffect(() => {
    if (!data || form) return;

    const prices = {};

    (data.services ?? []).forEach((service) => {
      prices[service.kind] = data.pricing?.[service.kind] ?? 0;
    });

    setForm({
      currency: data.pricing?.currency ?? "ILS",
      prices,
      account_holder: data.payment?.account_holder ?? "",
      bank_name: data.payment?.bank_name ?? "",
      account_number: data.payment?.account_number ?? "",
      iban: data.payment?.iban ?? "",
      instructions: data.payment?.instructions ?? "",
    });
  }, [data, form]);

  if (!form) return null;

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const setPrice = (kind) => (event) =>
    setForm({ ...form, prices: { ...form.prices, [kind]: event.target.value } });

  const onSubmit = async (event) => {
    event.preventDefault();
    await submit(form);
  };

  return (
    <Card>
      <CardHeader
        title="الأسعار وبيانات التحويل"
        subtitle="السعر الذي يراه الطالب، والحساب الذي يحوّل إليه ثم يرفق إشعاره."
        icon={<Wallet className="size-4" />}
      />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {success ? <Alert tone="success">تم حفظ الأسعار وبيانات التحويل.</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {(data.services ?? []).map((service) => (
              <Input
                key={service.kind}
                label={`سعر: ${service.label}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                hint="صفر = مجانية بلا تحويل"
                value={form.prices[service.kind] ?? 0}
                onChange={setPrice(service.kind)}
                error={fieldErrors[`prices.${service.kind}`]?.[0]}
              />
            ))}

            <Input
              label="العملة"
              required
              placeholder="ILS"
              hint="ILS · JOD · USD · EUR"
              value={form.currency}
              onChange={set("currency")}
              error={fieldErrors.currency?.[0]}
            />
          </div>

          <div className="grid gap-4 border-t border-ink-900/10 pt-5 sm:grid-cols-2">
            <Input
              label="اسم صاحب الحساب"
              value={form.account_holder}
              onChange={set("account_holder")}
              error={fieldErrors.account_holder?.[0]}
            />
            <Input
              label="البنك"
              value={form.bank_name}
              onChange={set("bank_name")}
              error={fieldErrors.bank_name?.[0]}
            />
            <Input
              label="رقم الحساب"
              dir="ltr"
              value={form.account_number}
              onChange={set("account_number")}
              error={fieldErrors.account_number?.[0]}
            />
            <Input
              label="IBAN"
              dir="ltr"
              value={form.iban}
              onChange={set("iban")}
              error={fieldErrors.iban?.[0]}
            />
          </div>

          <Textarea
            label="بيانات وتعليمات إضافية للطالب"
            rows={3}
            counter={2000}
            hint="تظهر للطالب أسفل بيانات الحساب — مثل ما يكتبه في خانة البيان."
            value={form.instructions}
            onChange={set("instructions")}
            error={fieldErrors.instructions?.[0]}
          />

          <Button type="submit" loading={submitting}>
            <Save className="size-4" />
            حفظ
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
