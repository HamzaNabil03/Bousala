import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Download, Eye, RefreshCw, Search, Upload } from "lucide-react";

import { adminApi } from "@/api/endpoints";
import { parseApiError } from "@/api/client";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi, useSubmit } from "@/hooks/useApi";
import { formatDateTimeAr, formatServiceMoney } from "@/lib/utils";

const STATUS = [
  { value: "", label: "كل الحالات" },
  { value: "pending_review", label: "بانتظار المراجعة" },
  { value: "awaiting_payment_verification", label: "بانتظار التحقق من الدفع" },
  { value: "payment_verified", label: "تم التحقق من الدفع" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "rejected", label: "مرفوض" },
  { value: "cancelled", label: "ملغي" },
];

const PAYMENT = [
  { value: "", label: "كل حالات الدفع" },
  { value: "pending_verification", label: "بانتظار التحقق" },
  { value: "verified", label: "تم التحقق" },
  { value: "rejected", label: "مرفوض" },
  { value: "not_required", label: "غير مطلوب" },
];

export default function AdminServiceRequestsPage() {
  const [filters, setFilters] = useState({ q: "", status: "", payment_status: "", sort: "newest" });
  const [applied, setApplied] = useState(filters);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedValue = Number(searchParams.get("request"));
  const selected = Number.isInteger(selectedValue) && selectedValue > 0 ? selectedValue : null;

  const list = useApi(() => adminApi.serviceRequests(applied), [applied]);
  const detail = useApi(() => selected ? adminApi.serviceRequest(selected) : Promise.resolve(null), [selected]);
  const action = useSubmit(async ({ type, id, payload }) => {
    if (type === "status") return adminApi.updateServiceRequestStatus(id, payload);
    if (type === "payment") return adminApi.reviewServicePayment(id, payload);
    if (type === "notes") return adminApi.updateServiceRequestNotes(id, payload);
    return adminApi.deliverServiceRequest(id, payload);
  });

  const selectRequest = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("request", String(id));
    else next.delete("request");
    setSearchParams(next);
  };

  const refresh = async () => {
    await list.reload(true);
    if (selected) await detail.reload(true);
  };

  // يتغير المعرّف قبل أن يبدأ effect الجديد؛ لا نرسم null أو بيانات الطلب السابق خلال تلك اللحظة.
  const detailPending = Boolean(selected) && (detail.loading || (!detail.error && detail.data?.id !== selected));

  return (
    <div className="space-y-6">
      <PageHeader title="إدارة الطلبات" description="كل خدمات الطلاب وطلبات التقديم للمنح في مكان واحد." />
      <Card>
        <CardBody>
          <form onSubmit={(event) => { event.preventDefault(); setApplied({ ...filters }); }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_190px_190px_170px_auto]">
            <Input aria-label="بحث" placeholder="رقم الطلب، الاسم أو البريد" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
            <Select aria-label="الحالة" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>{STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
            <Select aria-label="الدفع" value={filters.payment_status} onChange={(event) => setFilters((current) => ({ ...current, payment_status: event.target.value }))}>{PAYMENT.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
            <Select aria-label="الترتيب" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}><option value="newest">الأحدث</option><option value="oldest">الأقدم</option><option value="price_high">السعر الأعلى</option><option value="price_low">السعر الأقل</option></Select>
            <Button type="submit"><Search className="size-4" />بحث</Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <RequestList list={list} selected={selected} onSelect={selectRequest} />
        <Card className="self-start">
          {!selected ? <CardBody className="py-20 text-center text-ink-500">اختر طلبًا لعرضه وإدارته.</CardBody>
            : detailPending ? <LoadingBlock className="py-20" />
              : detail.error ? <LoadError message={detail.error} onRetry={() => detail.reload()} onBack={() => selectRequest(null)} />
                : !detail.data ? <LoadError message="الطلب غير موجود أو لم يعد متاحًا." onRetry={() => detail.reload()} onBack={() => selectRequest(null)} />
                  : <ErrorBoundary key={`${selected}:${detail.data.updated_at ?? ""}`} onRetry={() => detail.reload()}>
                    <AdminRequestDetail key={`${detail.data.id}:${detail.data.updated_at ?? ""}`} item={detail.data} action={action} refresh={refresh} onBack={() => selectRequest(null)} />
                  </ErrorBoundary>}
        </Card>
      </div>
    </div>
  );
}

function RequestList({ list, selected, onSelect }) {
  if (list.loading) return <LoadingBlock className="py-16" />;
  if (list.error) return <LoadError message={list.error} onRetry={() => list.reload()} />;
  const requests = list.data?.data ?? [];
  if (!requests.length) return <Card><CardBody className="py-16 text-center text-ink-500">لا توجد طلبات مطابقة.</CardBody></Card>;

  return <div className="space-y-3">{requests.map((item) => (
    <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`glass w-full rounded-xl p-4 text-start ${selected === item.id ? "ring-2 ring-navy-500/30" : ""}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="num text-xs text-ink-500">{item.reference_number}</p><h2 className="mt-1 font-bold text-navy-900">{item.service_name ?? "خدمة غير مسماة"}</h2><p className="mt-1 text-xs text-ink-500">{item.student_name ?? "—"} · {item.student_phone ?? "—"}</p></div><Badge tone={item.status === "completed" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status_label ?? item.status ?? "—"}</Badge></div>
      <div className="mt-3 flex justify-between gap-3 text-xs"><span>{formatDateTimeAr(item.submitted_at)}</span><span className="font-bold" dir="ltr">{formatServiceMoney(item.price, item.currency)}</span></div>
    </button>
  ))}</div>;
}

function LoadError({ message, onRetry, onBack }) {
  return <CardBody className="py-10"><Alert tone="danger" title="تعذّر تحميل الطلب">{message}</Alert><div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={onRetry}><RefreshCw className="size-4" />إعادة المحاولة</Button>{onBack ? <Button type="button" variant="outline" onClick={onBack}><ArrowRight className="size-4" />العودة للقائمة</Button> : null}</div></CardBody>;
}

function AdminRequestDetail({ item, action, refresh, onBack }) {
  const [status, setStatus] = useState(item?.status ?? "pending_review");
  const [note, setNote] = useState("");
  const [internalNotes, setInternalNotes] = useState(item?.internal_notes ?? "");
  const [delivery, setDelivery] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  useEffect(() => () => {
    if (previewAsset?.url) URL.revokeObjectURL(previewAsset.url);
  }, [previewAsset]);
  if (!item) return <LoadError message="بيانات الطلب غير مكتملة." onRetry={refresh} onBack={onBack} />;

  const run = async (type, payload) => { const result = await action.submit({ type, id: item.id, payload }); if (result.ok) await refresh(); };
  const download = async (file) => { setFileError(null); try { await adminApi.downloadServiceAttachment(item.id, file.id, file.name); } catch (error) { setFileError(parseApiError(error).message); } };
  const preview = async (file) => {
    setFileError(null);
    try {
      const blob = await adminApi.previewServiceAttachment(item.id, file.id);
      setPreviewAsset({ ...blob, name: file.name ?? "معاينة المرفق" });
    } catch (error) {
      setFileError(parseApiError(error).message);
    }
  };

  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  const responses = Array.isArray(item.responses) ? item.responses : [];
  const history = Array.isArray(item.history) ? item.history : [];

  return <>{previewAsset ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/70 p-4" role="dialog" aria-modal="true" aria-label={previewAsset.name}><div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-ink-900/10 p-3"><p className="truncate font-bold text-navy-900">{previewAsset.name}</p><Button type="button" size="sm" variant="outline" onClick={() => setPreviewAsset(null)}>إغلاق</Button></div>{previewAsset.type?.startsWith("image/") ? <img src={previewAsset.url} alt={previewAsset.name} className="min-h-0 flex-1 object-contain p-3" /> : <iframe src={previewAsset.url} title={previewAsset.name} className="min-h-[70vh] w-full border-0" />}</div></div> : null}<CardHeader title={item.service_name ?? "تفاصيل الطلب"} subtitle={`${item.reference_number ?? "—"} · ID ${item.id}`} action={<Button type="button" size="sm" variant="ghost" onClick={onBack}><ArrowRight className="size-4" />القائمة</Button>} />
    <CardBody className="space-y-5">
      {action.error ? <Alert tone="danger">{action.error}</Alert> : null}{fileError ? <Alert tone="danger">{fileError}</Alert> : null}
      <div className="grid gap-3 rounded-xl bg-navy-50 p-4 text-sm sm:grid-cols-2"><Info label="رقم الطلب" value={item.reference_number} /><Info label="المعرّف الداخلي" value={item.id} /><Info label="الطالب" value={item.student_name} /><Info label="البريد" value={item.student_email} dir="ltr" /><Info label="واتساب / الهاتف" value={item.student_phone} dir="ltr" /><Info label="الخدمة المطلوبة" value={item.service_name} /><Info label="السعر" value={formatServiceMoney(item.price, item.currency)} dir="ltr" /><Info label="تاريخ الإرسال" value={formatDateTimeAr(item.submitted_at)} /><Info label="حالة الطلب" value={item.status_label ?? item.status} /><Info label="حالة الدفع" value={item.payment_status_label ?? item.payment_status} /></div>
      {item.scholarship ? <div className="grid gap-3 rounded-xl border border-navy-200 bg-white/55 p-4 text-sm sm:grid-cols-2"><Info label="المنحة المحددة" value={item.scholarship.title ?? "—"} /><Info label="معرّف المنحة" value={item.scholarship.id ?? "—"} /></div> : null}
      <Info label="ملاحظات الطالب" value={item.notes} />

      <section><h3 className="mb-2 font-bold">المعلومات المقدمة</h3>{responses.length ? <div className="space-y-2">{responses.map((response, index) => <div key={`${response.key ?? "response"}-${index}`} className="rounded-lg border border-ink-900/8 p-3"><p className="text-xs text-ink-500">{response.label ?? response.key ?? "حقل إضافي"}</p><p className="mt-1 whitespace-pre-wrap text-sm">{response.value || "—"}</p></div>)}</div> : <p className="text-sm text-ink-500">لم يرسل الطالب حقولًا إضافية لهذا الطلب.</p>}</section>
      <section><h3 className="mb-2 font-bold">المرفقات وإشعار الدفع</h3>{attachments.length ? <div className="space-y-2">{attachments.map((file) => <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-900/8 p-3"><div><p className="text-sm font-semibold text-ink-800">{attachmentLabel(file)}</p><p className="mt-1 text-xs text-ink-500">{file.name ?? "ملف مرفق"}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => preview(file)}><Eye className="size-4" />عرض</Button><Button type="button" size="sm" variant={file.kind === "receipt" ? "gold" : "outline"} onClick={() => download(file)}><Download className="size-4" />تنزيل</Button></div></div>)}</div> : <Alert tone="warning">لا توجد مرفقات أو إشعار دفع محفوظ مع هذا الطلب.</Alert>}</section>

      {item.payment_status !== "not_required" ? <div className="flex flex-wrap gap-2 border-t border-ink-900/8 pt-4"><Button type="button" size="sm" loading={action.submitting} onClick={() => run("payment", { payment_status: "verified", note })}>تأكيد الدفع</Button><Button type="button" size="sm" variant="danger" disabled={action.submitting} onClick={() => run("payment", { payment_status: "rejected", note })}>رفض الدفع</Button></div> : null}
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={action.submitting} onClick={() => run("status", { status: "in_progress", note })}>بدء التنفيذ</Button><Button type="button" size="sm" variant="danger" disabled={action.submitting} onClick={() => run("status", { status: "rejected", note })}>رفض الطلب</Button></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Select label="حالة العمل" value={status} onChange={(event) => setStatus(event.target.value)}>{STATUS.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select><Button type="button" className="self-end" loading={action.submitting} onClick={() => run("status", { status, note })}>حفظ الحالة</Button></div>
      <Textarea label="ملاحظة تغيير الحالة" rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      <Textarea label="ملاحظات داخلية (لا تظهر للطالب)" rows={3} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
      <Button type="button" variant="outline" loading={action.submitting} onClick={() => run("notes", internalNotes)}>حفظ الملاحظات</Button>
      <div className="border-t border-ink-900/8 pt-4"><Input label="رفع الملف المكتمل" type="file" onChange={(event) => setDelivery(event.target.files?.[0] ?? null)} /><Button type="button" className="mt-3" loading={action.submitting} disabled={!delivery} onClick={() => run("deliver", delivery)}><Upload className="size-4" />رفع وتسليم الطلب</Button></div>
      {history.length ? <section className="border-t border-ink-900/8 pt-4"><h3 className="mb-2 font-bold">سجل الطلب</h3><div className="space-y-2 text-sm">{history.map((entry, index) => <div key={`${entry.event}-${entry.created_at}-${index}`} className="rounded-lg bg-navy-50 p-3"><p className="font-semibold">{entry.note || entry.event}</p><p className="mt-1 text-xs text-ink-500">{formatDateTimeAr(entry.created_at)}</p></div>)}</div></section> : null}
    </CardBody></>;
}

function attachmentLabel(file) {
  if (file.kind === "receipt") return "إشعار الدفع";
  if (file.kind === "supporting") return "مستند داعم";
  if (file.kind === "completed") return "الملف المكتمل";
  if (file.kind === "field") return "مرفق من حقول الخدمة";
  return "ملف مرفق";
}

function Info({ label, value, dir }) {
  return <div><p className="text-xs text-ink-500">{label}</p><p className="mt-1 break-words font-semibold text-ink-800" dir={dir}>{value ?? "—"}</p></div>;
}
