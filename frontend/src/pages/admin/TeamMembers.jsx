import { useState } from "react";
import { ImagePlus, Plus, Save, Trash2, UserRound } from "lucide-react";

import { adminApi } from "@/api/endpoints";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useApi, useSubmit } from "@/hooks/useApi";

const EMPTY = { name: "", role: "", biography: "", linkedin_url: "", github_url: "", facebook_url: "", email: "", display_order: 0, is_visible: true, photo: null, photo_url: null, remove_photo: false };

export default function AdminTeamMembersPage() {
  const api = useApi(adminApi.teamMembers, []);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const save = useSubmit((payload) => editing ? adminApi.updateTeamMember(editing.id, payload) : adminApi.createTeamMember(payload));
  const remove = useSubmit((id) => adminApi.deleteTeamMember(id));

  if (api.loading) return <LoadingBlock className="py-20" />;

  const clearPreview = () => { if (preview) URL.revokeObjectURL(preview); setPreview(null); };
  const select = (member = null) => { clearPreview(); setEditing(member); setValues(member ? { ...EMPTY, ...member } : EMPTY); save.reset(); };
  const choosePhoto = (event) => { const file = event.target.files?.[0] ?? null; clearPreview(); setPreview(file ? URL.createObjectURL(file) : null); setValues((current) => ({ ...current, photo: file, remove_photo: false })); };
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const result = await save.submit({ ...values, display_order: Number(values.display_order) });
    if (result.ok) { select(result.result.data); await api.reload(true); }
  };
  const deleteMember = async () => {
    if (!editing || !confirm(`حذف ${editing.name} من فريق العمل؟`)) return;
    const result = await remove.submit(editing.id);
    if (result.ok) { select(); await api.reload(true); }
  };
  const shownPhoto = preview || (!values.remove_photo ? values.photo_url : null);

  return <div className="space-y-6">
    <PageHeader title="إدارة فريق العمل" description="أضف أعضاء الفريق ورتّب ظهورهم في الصفحة الرئيسية دون إنشاء حسابات دخول." actions={<Button onClick={() => select()}><Plus className="size-4" />عضو جديد</Button>} />
    {api.error ? <Alert tone="danger">{api.error}</Alert> : null}
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.25fr]">
      <div className="space-y-3">
        {(api.data ?? []).length ? (api.data ?? []).map((member) => <button key={member.id} type="button" onClick={() => select(member)} className={`glass flex w-full items-center gap-3 rounded-xl p-4 text-start transition ${editing?.id === member.id ? "ring-2 ring-navy-500/30" : "hover:-translate-y-0.5"}`}>
          {member.photo_url ? <img src={member.photo_url} alt="" className="size-14 rounded-xl object-cover" /> : <span className="grid size-14 place-items-center rounded-xl bg-navy-100 text-navy-600"><UserRound className="size-6" /></span>}
          <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-navy-900">{member.name}</strong><Badge tone={member.is_visible ? "success" : "neutral"}>{member.is_visible ? "ظاهر" : "مخفي"}</Badge></span><span className="mt-1 block truncate text-xs text-ink-500">{member.role}</span></span>
          <span className="num text-xs text-ink-400">#{member.display_order}</span>
        </button>) : <Card><CardBody className="text-center text-sm text-ink-500">لا يوجد أعضاء فريق بعد.</CardBody></Card>}
      </div>

      <Card><CardHeader title={editing ? `تعديل: ${editing.name}` : "إضافة عضو فريق"} subtitle="العضو هنا ملف عام فقط، ولا يحصل على صلاحية دخول." /><CardBody>
        {save.error || remove.error ? <Alert tone="danger" className="mb-4">{save.error || remove.error}</Alert> : null}
        {save.success ? <Alert tone="success" className="mb-4">{save.success}</Alert> : null}
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col gap-4 rounded-xl bg-white/40 p-4 sm:flex-row sm:items-center">
            {shownPhoto ? <img src={shownPhoto} alt="معاينة صورة العضو" className="size-24 rounded-2xl object-cover ring-1 ring-navy-100" /> : <span className="grid size-24 place-items-center rounded-2xl bg-navy-100 text-navy-600"><UserRound className="size-9" /></span>}
            <div className="flex flex-wrap gap-2"><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-navy-700 px-4 text-sm font-semibold text-white"><ImagePlus className="size-4" />اختيار صورة<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} /></label>{shownPhoto ? <Button type="button" variant="outline" size="sm" onClick={() => { clearPreview(); setValues((current) => ({ ...current, photo: null, remove_photo: true })); }}>إزالة الصورة</Button> : null}</div>
          </div>
          {save.fieldErrors.photo?.[0] ? <p className="text-xs font-semibold text-danger">{save.fieldErrors.photo[0]}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2"><Input label="الاسم الكامل" required value={values.name} onChange={set("name")} error={save.fieldErrors.name?.[0]} /><Input label="المسمى الوظيفي" required value={values.role} onChange={set("role")} error={save.fieldErrors.role?.[0]} /></div>
          <Textarea label="نبذة قصيرة" rows={3} value={values.biography ?? ""} onChange={set("biography")} error={save.fieldErrors.biography?.[0]} />
          <div className="grid gap-4 sm:grid-cols-2"><Input label="LinkedIn" type="url" dir="ltr" value={values.linkedin_url ?? ""} onChange={set("linkedin_url")} /><Input label="GitHub" type="url" dir="ltr" value={values.github_url ?? ""} onChange={set("github_url")} /><Input label="Facebook" type="url" dir="ltr" value={values.facebook_url ?? ""} onChange={set("facebook_url")} /><Input label="البريد الإلكتروني" type="email" dir="ltr" value={values.email ?? ""} onChange={set("email")} /><Input label="ترتيب العرض" type="number" min="0" value={values.display_order} onChange={set("display_order")} /></div>
          <Checkbox label="إظهار العضو في الصفحة الرئيسية" checked={values.is_visible} onChange={set("is_visible")} />
          <div className="flex flex-wrap gap-3 border-t border-ink-900/8 pt-4"><Button type="submit" loading={save.submitting}><Save className="size-4" />حفظ</Button>{editing ? <Button type="button" variant="danger" loading={remove.submitting} onClick={deleteMember}><Trash2 className="size-4" />حذف</Button> : null}</div>
        </form>
      </CardBody></Card>
    </div>
  </div>;
}
