import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { adminApi } from "@/api/endpoints";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi, useSubmit } from "@/hooks/useApi";
import { formatMoney } from "@/lib/utils";

const EMPTY = { name: "", description: "", category_id: "", price: 0, currency: "USD", icon: "FileText", delivery_days: "", instructions: "", is_active: true, sort_order: 0, fields: [], image: null };
const FIELD = { key: "", label: "", type: "text", placeholder: "", options: [], is_required: false, sort_order: 0 };

export default function AdminServicesPage() {
  const api = useApi(adminApi.services, []);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const save = useSubmit((payload) => editing ? adminApi.updateService(editing.slug, payload) : adminApi.createService(payload));
  const action = useSubmit(async ({ type, service }) => type === "toggle" ? adminApi.toggleService(service.slug) : adminApi.deleteService(service.slug));

  useEffect(() => { if (save.success) api.reload(true); }, [save.success]); // eslint-disable-line react-hooks/exhaustive-deps
  if (api.loading) return <LoadingBlock className="py-20" />;

  const select = (service = null) => { setEditing(service); setValues(service ? { ...EMPTY, ...service, category_id: service.category?.id ?? "", fields: service.fields ?? [] } : EMPTY); save.reset(); };
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => { event.preventDefault(); const payload = { ...values, category_id: values.category_id || null, price: Number(values.price), delivery_days: values.delivery_days ? Number(values.delivery_days) : null, sort_order: Number(values.sort_order), fields: values.fields.map((field, index) => ({ ...field, sort_order: index, options: Array.isArray(field.options) ? field.options : String(field.options || "").split("،").map((x) => x.trim()).filter(Boolean) })) }; const response = await save.submit(payload); if (response.ok) select(response.result.data); };

  return <div className="space-y-6"><PageHeader title="إدارة الخدمات" description="أضف الخدمات والأسعار والحقول المطلوبة دون تعديل الكود." actions={<Button onClick={() => select()}><Plus className="size-4" />إضافة خدمة</Button>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <div className="space-y-3">{(api.data?.data ?? []).map((service) => <button key={service.id} type="button" onClick={() => select(service)} className={`glass w-full rounded-xl p-4 text-start ${editing?.id === service.id ? "ring-2 ring-navy-500/30" : ""}`}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-lg bg-gold-400/25"><Icon name={service.icon} className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-navy-900">{service.name}</h2><Badge tone={service.is_active ? "success" : "neutral"}>{service.is_active ? "مفعلة" : "معطلة"}</Badge></div><p className="mt-1 line-clamp-2 text-xs leading-6 text-ink-500">{service.description}</p><div className="mt-2 flex justify-between text-xs"><span className="font-bold text-navy-700">{formatMoney(service.price, service.currency)}</span><span className="text-ink-500">{service.requests_count ?? 0} طلب</span></div></div></div></button>)}</div>

      <Card><CardHeader title={editing ? `تعديل: ${editing.name}` : "إضافة خدمة جديدة"} /><CardBody>{save.error ? <Alert tone="danger" className="mb-4">{save.error}</Alert> : null}{save.success ? <Alert tone="success" className="mb-4">{save.success}</Alert> : null}<form onSubmit={submit} className="space-y-4"><Input label="اسم الخدمة" required value={values.name} onChange={set("name")} /><Textarea label="الوصف" required rows={4} value={values.description} onChange={set("description")} /><div className="grid gap-4 sm:grid-cols-2"><Select label="التصنيف" value={values.category_id} onChange={set("category_id")}><option value="">بدون تصنيف</option>{(api.data?.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select><Select label="الأيقونة" value={values.icon} onChange={set("icon")}><option>FileText</option><option>FileUser</option><option>PenLine</option><option>Languages</option><option>GraduationCap</option><option>ClipboardList</option></Select><Input label="السعر" type="number" min="0" step="0.01" value={values.price} onChange={set("price")} /><Select label="العملة" value={values.currency} onChange={set("currency")}><option>USD</option><option>ILS</option><option>JOD</option><option>SAR</option><option>EUR</option></Select><Input label="مدة التسليم بالأيام" type="number" min="1" value={values.delivery_days} onChange={set("delivery_days")} /><Input label="ترتيب العرض" type="number" min="0" value={values.sort_order} onChange={set("sort_order")} /></div><Input label="صورة الخدمة (اختياري)" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setValues((current) => ({ ...current, image: event.target.files?.[0] ?? null }))} /><Textarea label="تعليمات إضافية" rows={3} value={values.instructions} onChange={set("instructions")} /><Checkbox label="الخدمة ظاهرة ومتاحة للطلاب" checked={values.is_active} onChange={set("is_active")} />
          <div className="border-t border-ink-900/8 pt-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-navy-900">حقول النموذج الديناميكية</h3><Button type="button" variant="outline" size="sm" onClick={() => setValues((current) => ({ ...current, fields: [...current.fields, { ...FIELD, sort_order: current.fields.length }] }))}><Plus className="size-4" />حقل</Button></div><div className="space-y-3">{values.fields.map((field, index) => <FieldEditor key={`${field.id ?? "new"}-${index}`} field={field} onChange={(next) => setValues((current) => ({ ...current, fields: current.fields.map((item, i) => i === index ? next : item) }))} onRemove={() => setValues((current) => ({ ...current, fields: current.fields.filter((_, i) => i !== index) }))} />)}</div></div>
          <div className="flex flex-wrap gap-3"><Button type="submit" loading={save.submitting}><Save className="size-4" />حفظ الخدمة</Button>{editing ? <><Button type="button" variant="outline" loading={action.submitting} onClick={async () => { await action.submit({ type: "toggle", service: editing }); await api.reload(true); }}>{editing.is_active ? "تعطيل" : "تفعيل"}</Button><Button type="button" variant="danger" onClick={async () => { if (!confirm("حذف أو تعطيل هذه الخدمة؟")) return; await action.submit({ type: "delete", service: editing }); select(); await api.reload(true); }}><Trash2 className="size-4" />حذف</Button></> : null}</div>
        </form></CardBody></Card>
    </div>
  </div>;
}

function FieldEditor({ field, onChange, onRemove }) {
  const set = (key) => (event) => onChange({ ...field, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  return <div className="rounded-xl border border-ink-900/10 bg-white/40 p-3"><div className="grid gap-3 sm:grid-cols-2"><Input label="المعرّف" dir="ltr" placeholder="academic_background" value={field.key} onChange={set("key")} /><Input label="العنوان" value={field.label} onChange={set("label")} /><Select label="النوع" value={field.type} onChange={set("type")}><option value="text">نص</option><option value="textarea">نص طويل</option><option value="email">بريد</option><option value="phone">هاتف</option><option value="select">قائمة</option><option value="file">ملف</option><option value="date">تاريخ</option></Select><Input label="النص التوضيحي" value={field.placeholder ?? ""} onChange={set("placeholder")} />{field.type === "select" ? <Input className="sm:col-span-2" label="الخيارات (افصل بفاصلة عربية ،)" value={(field.options ?? []).join?.("، ") ?? field.options} onChange={set("options")} /> : null}</div><div className="mt-3 flex items-center justify-between"><Checkbox label="حقل مطلوب" checked={field.is_required} onChange={set("is_required")} /><Button type="button" variant="ghost" size="sm" onClick={onRemove}><Trash2 className="size-4 text-red-600" />حذف الحقل</Button></div></div>;
}
