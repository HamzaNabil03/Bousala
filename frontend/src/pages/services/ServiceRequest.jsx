import { useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { CheckCircle2, FileUp, Receipt, ShieldCheck } from "lucide-react";

import { cvOrderApi, scholarshipApi, serviceApi } from "@/api/endpoints";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { PaymentDetails } from "@/components/tools/PaymentDetails";
import { useAuth } from "@/context/AuthContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { formatDateTimeAr, formatServiceMoney } from "@/lib/utils";

const APP_SERVICE = "scholarship-application-assistance";

export default function UnifiedServiceRequestPage() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  const scholarshipSlug = search.get("scholarship");
  const { user } = useAuth();
  const { data, loading, error } = useApi(async () => {
    const service = await serviceApi.show(scholarshipSlug ? APP_SERVICE : slug);
    const scholarship = scholarshipSlug ? await scholarshipApi.show(scholarshipSlug) : null;
    const payment = await cvOrderApi.paymentInfo().catch(() => null);
    return { service, scholarship, payment };
  }, [slug, scholarshipSlug]);

  const [basic, setBasic] = useState({ fullName: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", notes: "" });
  const [responses, setResponses] = useState({});
  const [files, setFiles] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [result, setResult] = useState(null);
  const token = useMemo(() => crypto.randomUUID(), []);
  const action = useSubmit(serviceApi.submit);

  if (loading) return <LoadingBlock className="py-24" />;
  if (error || !data?.service) return <div className="container-page py-16"><Alert tone="danger">{error ?? "الخدمة غير متاحة."}</Alert></div>;

  const { service, scholarship, payment } = data;
  const price = scholarship ? scholarship.platform_application_price : service.price;
  const currency = scholarship ? scholarship.platform_application_currency : service.currency;
  const supportingReady = !scholarship?.platform_application_documents?.length || scholarship.platform_application_documents.every((_, index) => Boolean(supportingDocuments[index]));

  if (scholarship && (!scholarship.platform_application_enabled || !scholarship.platform_application_requests_enabled)) {
    return <div className="container-page py-16"><Alert tone="warning">التقديم من خلال المنصة غير متاح لهذه المنحة حاليًا.</Alert></div>;
  }

  if (result) return (
    <div className="container-page max-w-2xl py-16">
      <Card><CardBody className="py-10 text-center"><CheckCircle2 className="mx-auto size-14 text-[color:var(--color-success)]" /><h1 className="mt-4 font-display text-2xl font-bold text-navy-900">تم استلام طلبك بنجاح!</h1><p className="mt-2 text-ink-600">سيراجع الفريق الطلب وإشعار الدفع يدويًا.</p><dl className="mx-auto mt-6 grid max-w-md gap-3 rounded-xl bg-navy-50 p-5 text-sm text-start"><div><dt className="text-ink-500">رقم الطلب</dt><dd className="num font-bold">{result.reference_number}</dd></div><div><dt className="text-ink-500">الخدمة</dt><dd className="font-bold">{result.service_name}</dd></div><div><dt className="text-ink-500">تاريخ الإرسال</dt><dd>{formatDateTimeAr(result.submitted_at)}</dd></div><div><dt className="text-ink-500">الحالة</dt><dd>{result.status_label}</dd></div></dl><ButtonLink to="/dashboard/requests" className="mt-6">عرض طلباتي</ButtonLink></CardBody></Card>
    </div>
  );

  const setBasicField = (key) => (event) => setBasic((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const { ok, result: response } = await action.submit({ serviceId: scholarship ? null : service.id, scholarshipId: scholarship?.id, ...basic, responses, files, receipt, supportingDocuments: supportingDocuments.filter(Boolean), submissionToken: token });
    if (ok) setResult(response.data);
  };

  return (
    <div className="container-page max-w-4xl py-10">
      <PageHeader title="طلب خدمة" description="أكمل البيانات التالية؛ الحقول المطلوبة تتغير تلقائيًا حسب الخدمة." />
      {action.error ? <Alert tone="danger" className="mt-5">{action.error}</Alert> : null}
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <Card><CardBody><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-gold-800">الخدمة المحددة</p><h2 className="mt-1 text-xl font-bold text-navy-900">{scholarship ? `مساعدة التقديم: ${scholarship.title_ar}` : service.name}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-ink-600">{scholarship?.platform_application_description || service.description}</p></div><span className="rounded-full bg-gold-400/25 px-4 py-2 font-bold text-navy-900" dir="ltr">{Number(price) > 0 ? formatServiceMoney(price, currency) : "مجانًا"}</span></div></CardBody></Card>

        {service.instructions ? <Alert tone="info" title="تعليمات الخدمة">{service.instructions}</Alert> : null}

        <Card><CardHeader title="بيانات التواصل" /><CardBody className="grid gap-4 sm:grid-cols-2"><Input label="الاسم الكامل" required value={basic.fullName} onChange={setBasicField("fullName")} error={action.fieldErrors.full_name?.[0]} /><Input label="البريد الإلكتروني" type="email" required dir="ltr" value={basic.email} onChange={setBasicField("email")} error={action.fieldErrors.email?.[0]} /><Input label="رقم الهاتف / واتساب" required dir="ltr" value={basic.phone} onChange={setBasicField("phone")} error={action.fieldErrors.phone?.[0]} /><Textarea className="sm:col-span-2" label="ملاحظات إضافية" rows={3} value={basic.notes} onChange={setBasicField("notes")} /></CardBody></Card>

        {service.fields?.length ? <Card><CardHeader title="معلومات الخدمة" /><CardBody className="grid gap-4 sm:grid-cols-2">{service.fields.map((field) => <DynamicField key={field.id} field={field} value={responses[field.key] ?? ""} file={files[field.key]} onValue={(value) => setResponses((current) => ({ ...current, [field.key]: value }))} onFile={(file) => setFiles((current) => ({ ...current, [field.key]: file }))} error={action.fieldErrors[field.type === "file" ? `field_files.${field.key}` : `responses.${field.key}`]?.[0]} />)}</CardBody></Card> : null}

        {scholarship?.platform_application_documents?.length ? <Card><CardHeader title="المستندات المطلوبة للمنحة" /><CardBody className="space-y-3">{scholarship.platform_application_documents.map((item, index) => <FilePicker key={item} file={supportingDocuments[index]} onChange={(file) => setSupportingDocuments((current) => { const next = [...current]; next[index] = file; return next; })} label={item} required />)}</CardBody></Card> : null}

        {Number(price) > 0 ? <><Card><CardHeader title="بيانات الدفع" /><CardBody>{payment?.configured ? <PaymentDetails account={payment.account} price={price} currency={currency} /> : <Alert tone="warning">بيانات التحويل غير مهيأة. تواصل مع الإدارة قبل الإرسال.</Alert>}</CardBody></Card><Card><CardHeader title="إشعار الدفع" icon={<Receipt className="size-4" />} /><CardBody><FilePicker accept=".jpg,.jpeg,.png,.webp" file={receipt} onChange={setReceipt} label="صورة إشعار الدفع" required /><p className="mt-3 text-xs leading-6 text-ink-500">رفع الإشعار لا يعني نجاح الدفع؛ يتحقق منه موظف مخوّل يدويًا.</p>{action.fieldErrors.receipt?.[0] ? <p className="mt-2 text-xs text-red-600">{action.fieldErrors.receipt[0]}</p> : null}</CardBody></Card></> : null}

        <div className="flex flex-wrap gap-3"><Button type="submit" size="lg" loading={action.submitting} disabled={!supportingReady || (Number(price) > 0 && (!receipt || !payment?.configured))}>إرسال الطلب</Button><ButtonLink to="/services" variant="outline" size="lg">العودة للخدمات</ButtonLink></div>
        <p className="flex items-start gap-2 text-xs leading-6 text-ink-500"><ShieldCheck className="mt-0.5 size-4 shrink-0" />ملفاتك خاصة ولا تُتاح إلا لك وللموظفين المخولين. المساعدة لا تضمن قبول المنحة ولا تعني ارتباط بَوْصلة رسميًا بالجهة المانحة.</p>
      </form>
    </div>
  );
}

function DynamicField({ field, value, file, onValue, onFile, error }) {
  const common = { label: field.label, required: field.is_required, value, onChange: (event) => onValue(event.target.value), placeholder: field.placeholder ?? "", error };
  if (field.type === "file") return <div className="sm:col-span-2"><FilePicker file={file} onChange={onFile} label={field.label} required={field.is_required} /><p className="mt-1 text-xs text-red-600">{error}</p></div>;
  if (field.type === "textarea") return <Textarea {...common} className="sm:col-span-2" />;
  if (field.type === "select") return <Select {...common}><option value="">اختر...</option>{(field.options ?? []).map((item) => <option key={item} value={item}>{item}</option>)}</Select>;
  return <Input {...common} type={field.type === "phone" ? "tel" : field.type} dir={["email", "phone"].includes(field.type) ? "ltr" : undefined} />;
}

function FilePicker({ accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp", file, onChange, label, required }) {
  return <label className="block cursor-pointer rounded-xl border border-dashed border-navy-300 bg-white/50 p-5 text-center"><input className="hidden" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} /><FileUp className="mx-auto size-6 text-navy-600" /><span className="mt-2 block text-sm font-bold text-navy-800">{file?.name ?? label}{required ? " *" : ""}</span><span className="mt-1 block text-xs text-ink-500">PDF، Word أو صورة — حتى 10MB</span></label>;
}
