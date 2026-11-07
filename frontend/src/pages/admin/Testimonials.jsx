import { useState } from "react";
import { ImagePlus, Plus, Save, Star, Trash2, UserRound } from "lucide-react";

import { adminApi } from "@/api/endpoints";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi, useSubmit } from "@/hooks/useApi";

const EMPTY = { student_name: "", student_description: "", feedback_text: "", rating: "", related_service_id: "", display_order: 0, is_published: false, published_at: "", consent_confirmed: false, consent_confirmed_at: null, photo: null, photo_url: null, remove_photo: false };
const dateInput = (value) => value ? String(value).slice(0, 16) : "";

export default function AdminTestimonialsPage() {
  const api = useApi(adminApi.testimonials, []);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const save = useSubmit((payload) => editing ? adminApi.updateTestimonial(editing.id, payload) : adminApi.createTestimonial(payload));
  const remove = useSubmit((id) => adminApi.deleteTestimonial(id));

  if (api.loading) return <LoadingBlock className="py-20" />;

  const clearPreview = () => { if (preview) URL.revokeObjectURL(preview); setPreview(null); };
  const select = (item = null) => { clearPreview(); setEditing(item); setValues(item ? { ...EMPTY, ...item, rating: item.rating ?? "", related_service_id: item.related_service_id ?? "", published_at: dateInput(item.published_at), consent_confirmed: Boolean(item.consent_confirmed) } : EMPTY); save.reset(); };
  const choosePhoto = (event) => { const file = event.target.files?.[0] ?? null; clearPreview(); setPreview(file ? URL.createObjectURL(file) : null); setValues((current) => ({ ...current, photo: file, remove_photo: false })); };
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const payload = () => ({ ...values, rating: values.rating ? Number(values.rating) : null, related_service_id: values.related_service_id ? Number(values.related_service_id) : null, display_order: Number(values.display_order), published_at: values.published_at || null });
  const submit = async (event) => { event.preventDefault(); const result = await save.submit(payload()); if (result.ok) { select(result.result.data); await api.reload(true); } };
  const deleteItem = async () => { if (!editing || !confirm(`حذف رأي ${editing.student_name}؟`)) return; const result = await remove.submit(editing.id); if (result.ok) { select(); await api.reload(true); } };
  const shownPhoto = preview || (!values.remove_photo ? values.photo_url : null);

  return <div className="space-y-6">
    <PageHeader title="إدارة آراء الطلاب" description="انشر فقط آراءً حقيقية بموافقة أصحابها؛ لا تُنشأ أي مراجعات تلقائيًا." actions={<Button onClick={() => select()}><Plus className="size-4" />إضافة رأي</Button>} />
    {api.error ? <Alert tone="danger">{api.error}</Alert> : null}
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.25fr]">
      <div className="space-y-3">{(api.data?.data ?? []).length ? (api.data?.data ?? []).map((item) => <button key={item.id} type="button" onClick={() => select(item)} className={`glass flex w-full items-center gap-3 rounded-xl p-4 text-start transition ${editing?.id === item.id ? "ring-2 ring-navy-500/30" : "hover:-translate-y-0.5"}`}>
        {item.photo_url ? <img src={item.photo_url} alt="" className="size-14 rounded-full object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-navy-100 text-navy-600"><UserRound className="size-6" /></span>}
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-navy-900">{item.student_name}</strong><Badge tone={item.is_published ? "success" : "neutral"}>{item.is_published ? "منشور" : "مسودة"}</Badge></span><span className="mt-1 block line-clamp-2 text-xs leading-5 text-ink-500">{item.feedback_text}</span></span>
      </button>) : <Card><CardBody className="text-center text-sm text-ink-500">لا توجد آراء طلاب بعد.</CardBody></Card>}</div>

      <div className="space-y-5"><Card><CardHeader title={editing ? `تعديل: ${editing.student_name}` : "إضافة رأي طالب"} /><CardBody>
        {save.error || remove.error ? <Alert tone="danger" className="mb-4">{save.error || remove.error}</Alert> : null}{save.success ? <Alert tone="success" className="mb-4">{save.success}</Alert> : null}
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col gap-4 rounded-xl bg-white/40 p-4 sm:flex-row sm:items-center">{shownPhoto ? <img src={shownPhoto} alt="معاينة صورة الطالب" className="size-24 rounded-full object-cover" /> : <span className="grid size-24 place-items-center rounded-full bg-navy-100 text-navy-600"><UserRound className="size-9" /></span>}<div className="flex flex-wrap gap-2"><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-navy-700 px-4 text-sm font-semibold text-white"><ImagePlus className="size-4" />اختيار صورة<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} /></label>{shownPhoto ? <Button type="button" variant="outline" size="sm" onClick={() => { clearPreview(); setValues((current) => ({ ...current, photo: null, remove_photo: true })); }}>إزالة الصورة</Button> : null}</div></div>
          {save.fieldErrors.photo?.[0] ? <p className="text-xs font-semibold text-danger">{save.fieldErrors.photo[0]}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2"><Input label="اسم الطالب أو اسم العرض" required value={values.student_name} onChange={set("student_name")} error={save.fieldErrors.student_name?.[0]} /><Input label="وصف الطالب" placeholder="طالب جامعي، خريج…" value={values.student_description ?? ""} onChange={set("student_description")} /></div>
          <Textarea label="نص الرأي" required rows={5} value={values.feedback_text} onChange={set("feedback_text")} error={save.fieldErrors.feedback_text?.[0]} />
          <div className="grid gap-4 sm:grid-cols-2"><Select label="التقييم (اختياري)" value={values.rating} onChange={set("rating")}><option value="">بدون تقييم</option>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} نجوم</option>)}</Select><Select label="الخدمة المرتبطة" value={values.related_service_id} onChange={set("related_service_id")}><option value="">بدون خدمة</option>{(api.data?.services ?? []).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</Select><Input label="ترتيب العرض" type="number" min="0" value={values.display_order} onChange={set("display_order")} /><Input label="تاريخ النشر (اختياري)" type="datetime-local" value={values.published_at} onChange={set("published_at")} /></div>
          <Checkbox label="نشر الرأي في الصفحة الرئيسية" checked={values.is_published} onChange={set("is_published")} />
          <div className="rounded-xl border border-gold-400/40 bg-gold-50/60 p-4">
            <Checkbox
              label="أؤكد أن لدي موافقة الطالب على نشر هذا الرأي والبيانات الظاهرة معه."
              checked={values.consent_confirmed}
              onChange={set("consent_confirmed")}
              error={save.fieldErrors.consent_confirmed?.[0]}
            />
            {!values.is_published ? <p className="mt-2 text-xs leading-6 text-ink-500">يمكن حفظ الرأي كمسودة دون هذا التأكيد. سيصبح التأكيد مطلوبًا عند النشر.</p> : null}
            {values.consent_confirmed_at ? <p className="mt-2 text-xs font-semibold text-emerald-700">تم تسجيل الموافقة بتاريخ {new Date(values.consent_confirmed_at).toLocaleString("ar")}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-ink-900/8 pt-4"><Button type="submit" loading={save.submitting}><Save className="size-4" />حفظ</Button>{editing ? <Button type="button" variant="danger" loading={remove.submitting} onClick={deleteItem}><Trash2 className="size-4" />حذف</Button> : null}</div>
        </form>
      </CardBody></Card>

      <Card><CardHeader title="معاينة الظهور العام" /><CardBody><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy-900/5"><div className="flex items-center gap-3">{shownPhoto ? <img src={shownPhoto} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-navy-100 font-bold text-navy-700">{(values.student_name || "ط").trim().charAt(0)}</span>}<div><p className="font-bold text-navy-900">{values.student_name || "اسم الطالب"}</p><p className="text-xs text-ink-500">{values.student_description || "وصف الطالب"}</p></div></div>{values.rating ? <div className="mt-4 flex gap-1 text-gold-500" aria-label={`${values.rating} من 5`}>{Array.from({ length: Number(values.rating) }).map((_, index) => <Star key={index} className="size-4 fill-current" />)}</div> : null}<p className="mt-4 text-sm leading-7 text-ink-700">{values.feedback_text || "سيظهر نص رأي الطالب هنا."}</p></div></CardBody></Card></div>
    </div>
  </div>;
}
