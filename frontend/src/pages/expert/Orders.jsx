import { useRef, useState } from "react";
import { ArrowLeft, ClipboardList, Download, MessageSquare, Send, Upload, X } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { Textarea } from "@/components/ui/Field";
import { LoadingBlock } from "@/components/ui/Spinner";
import { expertApi } from "@/api/endpoints";
import { parseApiError } from "@/api/client";
import { useApi, useSubmit } from "@/hooks/useApi";
import { timeAgoAr } from "@/lib/utils";

const STATUS_TONE = {
  pending_approval: "warning",
  submitted: "info",
  in_expert_review: "warning",
  ats_check: "warning",
  delivered: "success",
  cancelled: "danger",
};

export default function ExpertOrdersPage() {
  const { data, loading, error, reload } = useApi(expertApi.orders, []);
  const advance = useSubmit(({ id, status }) => expertApi.advanceOrder(id, status));
  const deliver = useSubmit(({ id, file }) => expertApi.deliverOrder(id, file));

  const fileInput = useRef(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const meta = data?.meta ?? {};

  const onDownloadSource = async (row) => {
    setBusy(row.id);
    setFileError(null);
    try {
      await expertApi.downloadOrderSource(row.id, row.source_file_name);
    } catch (err) {
      setFileError(parseApiError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const pickFinalFile = (row) => {
    setTarget(row.id);
    fileInput.current?.click();
  };

  const onFilePicked = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !target) return;

    const { ok } = await deliver.submit({ id: target, file });
    setTarget(null);
    if (ok) reload(true);
  };

  const onAdvance = async (row) => {
    const { ok } = await advance.submit({ id: row.id, status: row.next_status });
    if (ok) reload(true);
  };

  const columns = [
    {
      key: "order",
      header: "الطلب",
      cell: (row) => (
        <div className="min-w-0">
          <p className="num font-bold whitespace-nowrap text-navy-800">{row.order_number}</p>
          <p className="mt-0.5 text-[12.5px] font-semibold text-ink-700">{row.kind_label}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-500">{timeAgoAr(row.updated_at)}</p>
        </div>
      ),
    },
    {
      key: "student",
      header: "الطالب",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-800">{row.student_name}</p>
          <p className="truncate text-[12px] text-ink-500" dir="ltr">
            {row.student_email}
          </p>
          {row.payment_blocks_work ? (
            <Badge tone="warning" className="mt-1.5" dot>
              {row.payment_status_label}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "files",
      header: "الملفات",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          {row.has_source_file ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadSource(row)}
              loading={busy === row.id}
              loadingText="جارٍ التحميل…"
            >
              <Download className="size-3.5" />
              ملف الطالب
            </Button>
          ) : (
            <span className="text-[12px] text-ink-400">بلا ملف مرفق</span>
          )}

          {row.has_final_file ? (
            <span className="text-[11.5px] font-semibold text-[color:var(--color-success)]">
              ✓ سُلّم: {row.final_file_name}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          <Badge tone={STATUS_TONE[row.status] ?? "neutral"} dot>
            {row.status_label}
          </Badge>
          {row.ats_score !== null && row.ats_score !== undefined ? (
            <span className="num text-[11.5px] text-ink-500">ATS {row.ats_score}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setDetailId(row.id)}>
            <MessageSquare className="size-3.5" />
            التفاصيل والملاحظات
          </Button>

          <Button
            size="sm"
            variant="gold"
            onClick={() => pickFinalFile(row)}
            loading={deliver.submitting && target === row.id}
            loadingText="جارٍ الرفع…"
            /* العمل لا يبدأ قبل تأكيد الإدارة للتحويل */
            disabled={row.payment_blocks_work}
          >
            <Upload className="size-3.5" />
            {row.has_final_file ? "استبدال التسليم" : "تسليم الملف"}
          </Button>

          {row.next_status ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAdvance(row)}
              disabled={advance.submitting || row.payment_blocks_work}
              title={row.next_status_label}
            >
              {row.next_status_short ?? row.next_status_label}
              <ArrowLeft className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلباتي المسنَدة"
        description="حمّل ملف الطالب، اعمل عليه، وارفع النسخة النهائية. تأكيد التحويل من مهام الإدارة."
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {advance.error ? <Alert tone="danger">{advance.error}</Alert> : null}
      {deliver.error ? <Alert tone="danger">{deliver.error}</Alert> : null}
      {deliver.success ? <Alert tone="success">تم تسليم الملف وإشعار الطالب.</Alert> : null}
      {fileError ? <Alert tone="danger">{fileError}</Alert> : null}

      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onFilePicked}
        className="hidden"
      />

      {detailId ? (
        <OrderDetail id={detailId} onClose={() => setDetailId(null)} onChanged={() => reload(true)} />
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={meta.total ?? 0} icon={<ClipboardList className="size-5" />} />
        <StatCard label="قيد التنفيذ" value={meta.in_progress ?? 0} tone="info" />
        <StatCard label="بانتظار تأكيد الإدارة للتحويل" value={meta.awaiting_payment ?? 0} tone="gold" />
        <StatCard label="مُسلّمة" value={meta.delivered ?? 0} tone="success" />
      </div>

      <Card>
        <CardBody className="p-0">
          <DataTable columns={columns} rows={data?.data} loading={loading} empty="لا طلبات مسنَدة إليك بعد." />
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * تفاصيل الطلب وملاحظاته.
 *
 * الملاحظات قناة التواصل مع الطالب: يكتب ما يريد إبرازه، ويردّ الخبير
 * بما احتاجه أو أنجزه — بلا هذه الشاشة تبقى ملاحظة الطالب معلَّقة بلا ردّ.
 */
function OrderDetail({ id, onClose, onChanged }) {
  const { data: order, loading, reload } = useApi(() => expertApi.order(id), [id]);
  const note = useSubmit((body) => expertApi.addNote(id, body));
  const [body, setBody] = useState("");

  const onSend = async (event) => {
    event.preventDefault();
    const { ok } = await note.submit(body);
    if (ok) {
      setBody("");
      reload(true);
      onChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      {/* التعتيم طبقة شقيقة لا حاضنة: عنصر مموّه يحرم ما بداخله من تمويه ما وراءه */}
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="glass-strong relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/10 px-5 py-3.5">
          <p className="font-display font-bold text-navy-800">
            {order ? `${order.order_number} — ${order.kind_label}` : "تفاصيل الطلب"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-white/60"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading || !order ? (
            <LoadingBlock className="py-10" />
          ) : (
            <div className="space-y-5">
              {order.request_note ? (
                <div>
                  <p className="text-[12px] font-bold text-ink-500">ملاحظة الطالب عند الإرسال</p>
                  <p className="mt-1 whitespace-pre-line text-[13.5px] leading-7 text-ink-800">
                    {order.request_note}
                  </p>
                </div>
              ) : null}

              {order.data_snapshot ? (
                <div>
                  <p className="text-[12px] font-bold text-ink-500">لمحة عن ملف الطالب الأكاديمي</p>
                  <dl className="mt-1.5 grid gap-1.5 text-[13px]">
                    {order.data_snapshot.full_name_ar ? (
                      <SnapshotRow label="الاسم" value={order.data_snapshot.full_name_ar} />
                    ) : null}
                    {order.data_snapshot.bio ? (
                      <SnapshotRow label="النبذة" value={order.data_snapshot.bio} />
                    ) : null}
                    <SnapshotRow label="المؤهلات" value={order.data_snapshot.educations} />
                    <SnapshotRow label="الخبرات" value={order.data_snapshot.experiences} />
                    {order.data_snapshot.skills?.length ? (
                      <SnapshotRow label="المهارات" value={order.data_snapshot.skills.join("، ")} />
                    ) : null}
                  </dl>
                </div>
              ) : null}

              <div>
                <p className="text-[12px] font-bold text-ink-500">الملاحظات</p>
                <ul className="mt-2 space-y-2.5">
                  {(order.notes ?? []).length === 0 ? (
                    <li className="text-[12.5px] text-ink-400">لا ملاحظات بعد.</li>
                  ) : (
                    order.notes.map((n) => (
                      <li key={n.id} className="glass-soft rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-bold text-navy-700">
                            {n.author_role === "student" ? "الطالب" : n.author_name}
                          </span>
                          <span className="text-[11px] text-ink-400">{timeAgoAr(n.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-[13px] leading-6 text-ink-800">{n.body}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSend} className="border-t border-ink-900/10 p-4">
          {note.error ? <Alert tone="danger" className="mb-3">{note.error}</Alert> : null}
          <Textarea
            rows={2}
            counter={2000}
            placeholder="اكتب ملاحظة للطالب…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button type="submit" size="sm" className="mt-2" loading={note.submitting} disabled={body.trim().length < 3}>
            <Send className="size-3.5" />
            إرسال
          </Button>
        </form>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="text-end text-ink-800">{value}</dd>
    </div>
  );
}
