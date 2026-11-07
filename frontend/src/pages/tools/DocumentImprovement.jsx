import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, AI_TIMEOUT, parseApiError } from "@/api/client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/Section";

export default function DocumentImprovementPage() {
  const [params] = useSearchParams();
  const kind = params.get("kind") === "letter_improve" ? "letter_improve" : "cv_improve";
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const { data } = await api.get("/document-improvements");
    setRuns(data.data);
  };
  useEffect(() => {
    let active = true;
    api.get("/document-improvements").then(({ data }) => {
      if (active) setRuns(data.data);
    }).catch((err) => { if (active) setError(parseApiError(err).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (!file || !consent || busy) return;
    if (file.size > 5 * 1024 * 1024) { setError("حجم الملف يجب ألا يتجاوز 5 ميجابايت."); return; }
    setBusy(true); setError(""); setSelected(null);
    const body = new FormData();
    body.append("kind", kind); body.append("file", file); body.append("target", target); body.append("consent", "1");
    try {
      const { data } = await api.post("/document-improvements", body, {
        timeout: AI_TIMEOUT,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelected(data.data);
      setRuns((previous) => [data.data, ...previous.filter((run) => run.id !== data.data.id)]);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.errors.file?.[0] ?? parsed.message);
      try { await refresh(); } catch { /* Keep the original failure visible. */ }
    } finally { setBusy(false); }
  }
  async function download(run) {
    setDownloading(run.id); setError("");
    try {
      const { data } = await api.get(`/document-improvements/${run.id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url; link.download = `bousla-improved-${run.id}.docx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(parseApiError(err).message); }
    finally { setDownloading(null); }
  }
  return <div className="container-page max-w-4xl py-10">
    <PageHeader title={kind === "cv_improve" ? "تحسين سيرتك الذاتية بالذكاء الاصطناعي" : "تحسين خطاب الدافع بالذكاء الاصطناعي"}
      description="ارفع ملفك، اطّلع على الأخطاء والتعديلات، ونزّل النسخة المحسّنة مباشرة دون انتظار مراجعة الفريق." />
    {error && <Alert tone="danger" className="mb-5">{error}</Alert>}
    <form onSubmit={submit} className="glass space-y-5 rounded-2xl p-6">
      <label className="block space-y-2"><span className="font-bold">ملفك الحالي</span>
        <input required disabled={busy} type="file" accept=".pdf,.doc,.docx" className="block w-full" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setSelected(null); }} />
        <span className="block text-sm text-ink-600">PDF نصي أو Word، حتى 5 ميجابايت و18000 حرف. الملفات المصوّرة أو المحمية بكلمة مرور غير مدعومة. النسخة المحسّنة تُنزّل بصيغة Word بتنسيق جديد.</span>
      </label>
      <label className="block space-y-2"><span>المنحة أو الجهة المستهدفة (اختياري)</span>
        <input maxLength={500} disabled={busy} value={target} onChange={(event) => setTarget(event.target.value)} className="w-full rounded-xl border border-ink-900/20 bg-white p-3" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" required disabled={busy} checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-2" />
        <span>أوافق على إرسال نص ملفي إلى مزوّد الذكاء الاصطناعي لمعالجته وحفظ النتيجة في حسابي. سأراجع دقة المعلومات قبل استخدام النسخة المحسّنة.</span>
      </label>
      <Button type="submit" loading={busy} disabled={!file || !consent || busy}>حلّل الملف وحسّنه</Button>
      {busy && <p role="status" className="text-sm">جارٍ قراءة الملف وتحسينه؛ قد يستغرق ذلك دقيقتين. أبقِ الصفحة مفتوحة.</p>}
    </form>
    {selected?.result && <section className="glass mt-6 space-y-4 rounded-2xl p-6" aria-live="polite">
      {selected.result.valid === false ? <>
        <Alert tone="danger" title="تنويه">
          {selected.result.notice}
        </Alert>
        {selected.result.suggested_kind ? <ButtonLink to={`/tools/improve?kind=${selected.result.suggested_kind}`}>الانتقال إلى الأداة الصحيحة</ButtonLink> : null}
      </> : <>
      <h2 className="text-xl font-bold">نتيجة المراجعة</h2><p>{selected.result.summary}</p>
      <h3 className="font-bold">الأخطاء والتعديلات</h3>
      {selected.result.issues.length ? <ul className="list-disc space-y-2 ps-5">{selected.result.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul> : <p>لم تُسجّل أخطاء تحتاج تعديلاً.</p>}
      <h3 className="font-bold">النسخة المحسّنة</h3><div dir="auto" className="whitespace-pre-wrap rounded-xl bg-white p-4 leading-8">{selected.result.revised_text}</div>
      <Button loading={downloading === selected.id} onClick={() => download(selected)}>تنزيل النسخة المحسّنة Word</Button>
      </>}
    </section>}
    <section className="mt-8"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">ملفاتي الأخيرة</h2>
      <Button variant="outline" disabled={busy} onClick={async () => { try { await refresh(); } catch (err) { setError(parseApiError(err).message); } }}>تحديث النتائج</Button></div>
      {loading ? <p className="mt-4">جارٍ تحميل ملفاتك…</p> : !runs.length && <p className="mt-4">ستظهر نتائج ملفاتك هنا بعد رفعها.</p>}
      <div className="mt-4 space-y-3">{runs.map((run) => <div key={run.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <span>{run.kind === "cv_improve" ? "تحسين سيرة ذاتية" : "تحسين خطاب دافع"} — {new Date(run.created_at).toLocaleDateString("ar")}</span>
        {run.result ? <Button variant="outline" onClick={() => setSelected(run)}>{run.result.valid === false ? "عرض التنويه" : "عرض النتيجة والتنزيل"}</Button> : <span>{run.status === "running" ? "قيد المعالجة — حدّث النتائج بعد قليل" : "تعذّرت المعالجة؛ يمكنك رفع الملف مجدداً"}</span>}
      </div>)}</div>
    </section>
  </div>;
}
