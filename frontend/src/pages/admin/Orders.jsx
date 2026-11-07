import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Download,
  Receipt,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { adminApi } from "@/api/endpoints";
import { parseApiError } from "@/api/client";
import { useApi, useSubmit } from "@/hooks/useApi";
import { formatMoney, timeAgoAr } from "@/lib/utils";

const PAYMENT_TONE = {
  awaiting_review: "warning",
  accepted: "success",
  rejected: "danger",
  not_required: "neutral",
};

const STATUS_TONE = {
  pending_approval: "warning",
  submitted: "info",
  in_expert_review: "warning",
  ats_check: "warning",
  delivered: "success",
  cancelled: "danger",
};

export default function AdminOrdersPage() {
  // المحذوفة قائمة منفصلة تُطلب صراحةً، لا صفوف مشطوبة تزاحم العمل اليومي
  const [showDeleted, setShowDeleted] = useState(false);
  const { data, loading, error, reload } = useApi(
    () => adminApi.orders(showDeleted),
    [showDeleted],
  );
  const advance = useSubmit(({ id, status }) => adminApi.advanceOrder(id, status));
  const deliver = useSubmit(({ id, file }) => adminApi.deliverOrder(id, file));
  const review = useSubmit(({ id, decision, reason }) => adminApi.reviewPayment(id, decision, reason));
  const remove = useSubmit(({ id, reason }) => adminApi.deleteOrder(id, reason));
  const restore = useSubmit(({ id }) => adminApi.restoreOrder(id));

  // مُدخل ملف واحد مخفي يخدم كل الصفوف — نتذكّر أي صفّ فتحه
  const fileInput = useRef(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(null);
  const [receipt, setReceipt] = useState(null);
  // فشل تنزيل ملف لا يظهر في أي نموذج، فبلا هذه الحالة يبتلعه الصمت
  const [fileError, setFileError] = useState(null);

  // رابط الكائن يحجز ذاكرة حتى يُلغى
  useEffect(() => () => { if (receipt?.url) URL.revokeObjectURL(receipt.url); }, [receipt]);

  const meta = data?.meta ?? {};

  const onDownloadSource = async (row) => {
    setBusy(row.id);
    setFileError(null);
    try {
      await adminApi.downloadOrderSource(row.id, row.source_file_name);
    } catch (err) {
      setFileError(parseApiError(err).message);
    } finally {
      setBusy(null);
    }
  };

  /* الإشعار يُعرض ليتأكّد المدير منه بالنظر، والتنزيل خيار داخل المعاينة */
  const onViewReceipt = async (row) => {
    setBusy(`receipt-${row.id}`);
    setFileError(null);
    try {
      const file = await adminApi.openOrderReceipt(row.id);
      setReceipt({ ...file, row });
    } catch (err) {
      setFileError(parseApiError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const onAcceptPayment = async (row) => {
    const { ok } = await review.submit({ id: row.id, decision: 'accept' });
    if (ok) reload(true);
  };

  const onRejectPayment = async (row) => {
    // سبب الرفض يصل الطالب في الإشعار، فلا يُقبل رفضٌ بلا سبب
    const reason = window.prompt('اكتب سبب رفض إشعار التحويل — سيصل الطالب كما هو:');

    if (!reason?.trim()) return;

    const { ok } = await review.submit({ id: row.id, decision: 'reject', reason: reason.trim() });
    if (ok) reload(true);
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

  /*
   * الحذف ناعم: الطلب يختفي عن الطرفين ويبقى سجلّه. والسبب مطلوب لأن
   * الطالب يقرؤه، وقد يكون دفع ثمن ما يُحذف.
   */
  const onDelete = async (row) => {
    const paid = row.payment_status === "accepted";
    const warning = paid
      ? `تنبيه: هذا الطلب مؤكَّد الدفع بمبلغ ${formatMoney(row.price_amount, row.price_currency)}.\n`
      : "";

    const reason = window.prompt(
      `${warning}اكتب سبب حذف الطلب ${row.order_number} — سيصل الطالب كما هو:`,
    );

    if (!reason?.trim()) return;

    const { ok } = await remove.submit({ id: row.id, reason: reason.trim() });
    if (ok) reload(true);
  };

  const onRestore = async (row) => {
    const { ok } = await restore.submit({ id: row.id });
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
          <p className="mt-1 truncate text-[11.5px] text-ink-500">
            الخبير:{" "}
            {row.expert_name ? (
              <span className="font-semibold text-ink-700">{row.expert_name}</span>
            ) : (
              <span className="font-semibold text-[color:var(--color-warning)]">غير مُسنَد</span>
            )}
          </p>
        </div>
      ),
    },
    {
      key: "files",
      header: "الملفات",
      cell: (row) => (
        <div className="flex max-w-[220px] flex-col items-start gap-1.5">
          {row.request_note ? (
            <p className="line-clamp-2 text-[11.5px] leading-5 text-ink-500" title={row.request_note}>
              {row.request_note}
            </p>
          ) : null}
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
      key: "payment",
      header: "التحويل",
      cell: (row) =>
        row.price_amount > 0 ? (
          <div className="flex flex-col items-start gap-1.5">
            <span className="num text-[13px] font-bold text-navy-800">
              {formatMoney(row.price_amount, row.price_currency)}
            </span>
            <Badge tone={PAYMENT_TONE[row.payment_status] ?? "neutral"} dot>
              {row.payment_status_label}
            </Badge>

            {row.has_receipt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewReceipt(row)}
                loading={busy === `receipt-${row.id}`}
                loadingText="جارٍ الفتح…"
              >
                <Receipt className="size-3.5" />
                عرض الإشعار
              </Button>
            ) : null}

            {row.payment_note ? (
              <p className="line-clamp-2 text-[11.5px] leading-5 text-ink-500" title={row.payment_note}>
                {row.payment_note}
              </p>
            ) : null}

            {row.awaiting_payment_review ? (
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" onClick={() => onAcceptPayment(row)} disabled={review.submitting}>
                  <Check className="size-3.5" />
                  قبول
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onRejectPayment(row)}
                  disabled={review.submitting}
                >
                  <X className="size-3.5" />
                  رفض
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-[12px] text-ink-400">مجانية</span>
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

          {row.deleted_at ? (
            <p className="text-[11.5px] leading-5 text-ink-500">
              حُذف {timeAgoAr(row.deleted_at)}
              {row.deleted_by_name ? ` — ${row.deleted_by_name}` : ""}
              <span className="block text-ink-700">{row.deletion_reason}</span>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) =>
        row.deleted_at ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(row)}
            disabled={restore.submitting}
          >
            <RotateCcw className="size-3.5" />
            استعادة
          </Button>
        ) : (
        <div className="flex flex-col items-start gap-1.5">
          <Button
            size="sm"
            variant="gold"
            onClick={() => pickFinalFile(row)}
            loading={deliver.submitting && target === row.id}
            loadingText="جارٍ الرفع…"
            /* العمل لا يبدأ قبل تأكيد التحويل، فلا تسليم ولا تحريك مراحل */
            disabled={row.payment_status === "awaiting_review" || row.payment_status === "rejected"}
          >
            <Upload className="size-3.5" />
            {row.has_final_file ? "استبدال التسليم" : "تسليم الملف"}
          </Button>

          {row.next_status ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAdvance(row)}
              disabled={advance.submitting}
              title={row.next_status_label}
            >
              {row.next_status_short ?? row.next_status_label}
              <ArrowLeft className="size-3.5" />
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            disabled={remove.submitting}
            className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/12"
          >
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلبات صياغة السيرة الذاتية"
        description="أكّد إشعار التحويل، حمّل ملف الطالب، اعمل عليه، ثم ارفع النسخة النهائية."
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {advance.error ? <Alert tone="danger">{advance.error}</Alert> : null}
      {deliver.error ? <Alert tone="danger">{deliver.error}</Alert> : null}
      {deliver.success ? <Alert tone="success">تم تسليم الملف وإشعار الطالب.</Alert> : null}
      {review.error ? <Alert tone="danger">{review.error}</Alert> : null}
      {fileError ? <Alert tone="danger">{fileError}</Alert> : null}
      {remove.error ? <Alert tone="danger">{remove.error}</Alert> : null}
      {restore.error ? <Alert tone="danger">{restore.error}</Alert> : null}

      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onFilePicked}
        className="hidden"
      />

      {receipt ? (
        <ReceiptViewer receipt={receipt} onClose={() => setReceipt(null)} />
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={meta.total ?? 0} icon={<ClipboardList className="size-5" />} />
        <StatCard
          label="بانتظار تأكيد التحويل"
          value={meta.awaiting_payment ?? 0}
          icon={<Receipt className="size-5" />}
          tone="gold"
        />
        <StatCard label="قيد التنفيذ" value={meta.in_progress ?? 0} tone="info" />
        <StatCard label="مُسلّمة" value={meta.delivered ?? 0} tone="success" />
      </div>

      {meta.deleted > 0 || showDeleted ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-ink-600">
            {showDeleted
              ? "تعرض الآن الطلبات المحذوفة — سجلّها ومرفقاتها محفوظة."
              : `هناك ${meta.deleted} طلب محذوف.`}
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowDeleted((value) => !value)}>
            {showDeleted ? (
              <>
                <ArrowLeft className="size-3.5" />
                رجوع للطلبات
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                عرض المحذوفة
              </>
            )}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            rows={data?.data}
            loading={loading}
            empty={showDeleted ? "لا توجد طلبات محذوفة." : "لا توجد طلبات بعد."}
          />
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * معاينة إشعار التحويل.
 *
 * الإشعار غالباً لقطة شاشة من تطبيق البنك، والمدير يقبل أو يرفض بناءً على
 * ما يراه فيها — فتنزيلها ليفتحها من مجلد التنزيلات يقطع العمل بلا داعٍ.
 * الملف على قرص خاص فيُجلب بالتوكن ويُعرض من رابط كائن.
 */
function ReceiptViewer({ receipt, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPdf = receipt.type === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      {/* التعتيم طبقة شقيقة لا حاضنة: عنصر مموّه يحرم ما بداخله من تمويه ما وراءه */}
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="glass-strong relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/10 px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-display font-bold text-navy-800">إشعار التحويل</p>
            <p className="num mt-0.5 truncate text-[12px] text-ink-500">
              {receipt.row.order_number} — {receipt.row.student_name}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* الملف محمّل في الذاكرة أصلاً، فالتنزيل من رابطه لا من طلب ثانٍ قد يفشل */}
            <a
              href={receipt.url}
              download={receipt.row.receipt_file_name ?? `إشعار-${receipt.row.order_number}`}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              <Download className="size-3.5" />
              تنزيل
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المعاينة"
              className="grid size-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-white/60"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-white/45 p-4">
          {isPdf ? (
            <iframe src={receipt.url} title="إشعار التحويل" className="h-[70vh] w-full rounded-lg" />
          ) : (
            <img src={receipt.url} alt="إشعار التحويل" className="mx-auto max-w-full rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
}
