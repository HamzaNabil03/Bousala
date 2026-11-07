import { useState } from "react";
import { Download, FileText } from "lucide-react";

import { serviceApi } from "@/api/endpoints";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatDateTimeAr, formatMoney } from "@/lib/utils";

const TONES = { completed: "success", rejected: "danger", cancelled: "neutral", in_progress: "info", payment_verified: "success", awaiting_payment_verification: "warning", pending_review: "warning" };

export default function MyServiceRequestsPage() {
  const { data, loading } = useApi(() => serviceApi.requests(), []);
  const [selectedId, setSelectedId] = useState(null);
  const detail = useApi(() => selectedId ? serviceApi.request(selectedId) : Promise.resolve(null), [selectedId]);

  if (loading) return <LoadingBlock className="py-20" />;
  const requests = data?.data ?? [];

  return <div className="space-y-6"><PageHeader title="طلباتي" description="تابع طلبات الخدمات وحالة الدفع والملفات المسلّمة." />
    {!requests.length ? <EmptyState icon={FileText} title="لا توجد طلبات بعد" description="اطلب إحدى خدمات الطلاب وستظهر هنا." /> : <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
      <div className="space-y-3">{requests.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`glass w-full rounded-xl p-4 text-start transition ${selectedId === item.id ? "ring-2 ring-navy-500/30" : "hover:bg-white/75"}`}><div className="flex items-start justify-between gap-3"><div><p className="num text-xs text-ink-500">{item.reference_number}</p><h2 className="mt-1 font-bold text-navy-900">{item.service_name}</h2></div><Badge tone={TONES[item.status] ?? "neutral"}>{item.status_label}</Badge></div><div className="mt-3 flex justify-between text-xs text-ink-500"><span>{formatDateTimeAr(item.submitted_at)}</span><span className="font-bold">{formatMoney(item.price, item.currency)}</span></div></button>)}</div>
      <Card>{!selectedId ? <CardBody className="py-16 text-center text-ink-500">اختر طلبًا لعرض تفاصيله.</CardBody> : detail.loading ? <LoadingBlock className="py-16" /> : <RequestDetails item={detail.data} />}</Card>
    </div>}
  </div>;
}

function RequestDetails({ item }) {
  if (!item) return null;
  return <><CardHeader title={item.service_name} subtitle={item.reference_number} /><CardBody className="space-y-5"><div className="grid gap-3 rounded-xl bg-navy-50 p-4 text-sm sm:grid-cols-2"><Info label="الحالة" value={item.status_label} /><Info label="حالة الدفع" value={item.payment_status_label} /><Info label="السعر" value={formatMoney(item.price, item.currency)} /><Info label="تاريخ الإرسال" value={formatDateTimeAr(item.submitted_at)} /></div>{item.scholarship ? <Info label="المنحة المرتبطة" value={item.scholarship.title} /> : null}{item.responses?.length ? <div><h3 className="mb-3 font-bold text-navy-900">بيانات الطلب</h3><div className="space-y-3">{item.responses.map((response) => <div key={response.key} className="rounded-lg border border-ink-900/8 p-3"><p className="text-xs text-ink-500">{response.label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{response.value || "—"}</p></div>)}</div></div> : null}{item.attachments?.length ? <div><h3 className="mb-3 font-bold text-navy-900">الملفات</h3><div className="flex flex-wrap gap-2">{item.attachments.map((file) => <Button key={file.id} type="button" variant="outline" size="sm" onClick={() => serviceApi.downloadAttachment(item.id, file.id, file.name)}><Download className="size-4" />{file.kind === "completed" ? "تنزيل الملف المكتمل" : file.name}</Button>)}</div></div> : null}{item.notes ? <Info label="ملاحظاتك" value={item.notes} /> : null}</CardBody></>;
}

function Info({ label, value }) { return <div><p className="text-xs text-ink-500">{label}</p><p className="mt-1 font-semibold text-ink-800">{value ?? "—"}</p></div>; }
