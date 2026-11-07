import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Download,
  Loader,
  MessageSquare,
  Receipt,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Progress";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { cvOrderApi } from "@/api/endpoints";
import { parseApiError } from "@/api/client";
import { useApi, useSubmit } from "@/hooks/useApi";
import { cn, formatDateAr, formatMoney, timeAgoAr } from "@/lib/utils";

const STATUS_TONE = {
  pending_approval: "warning",
  submitted: "info",
  in_expert_review: "warning",
  ats_check: "warning",
  delivered: "success",
  cancelled: "danger",
};

const TIMELINE_ICON = {
  done: CircleCheck,
  in_progress: Loader,
  pending: Clock,
};

export default function CvOrderTrackingPage() {
  const [downloading, setDownloading] = useState(false);
  // التحميل خارج أي نموذج، فبلا حالة خطأ خاصّة به يفشل الزرّ بصمت
  const [downloadError, setDownloadError] = useState(null);
  const { id } = useParams();
  const [note, setNote] = useState("");

  const { data: order, loading, error, reload } = useApi(() => cvOrderApi.show(id), [id]);

  const onDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await cvOrderApi.downloadFinal(order.id, order.final_file_name);
    } catch (err) {
      setDownloadError(parseApiError(err).message);
    } finally {
      setDownloading(false);
    }
  };
  const addNote = useSubmit((body) => cvOrderApi.addNote(id, body));

  if (loading) return <LoadingBlock className="py-24" />;

  if (error || !order) {
    return (
      <div className="container-page py-16">
        <Alert tone="danger">{error ?? "الطلب غير موجود."}</Alert>
        <ButtonLink to="/tools" variant="outline" className="mt-6">
          <ArrowRight className="size-4" />
          كل الأدوات
        </ButtonLink>
      </div>
    );
  }

  const onAddNote = async (event) => {
    event.preventDefault();
    const { ok } = await addNote.submit(note.trim());

    if (ok) {
      setNote("");
      reload(true);
    }
  };

  const passed = (order.ats_checks ?? []).filter((check) => check.passed).length;

  return (
    <div className="py-10">
      <div className="container-page max-w-5xl">
        <PageHeader
          title="تدقيق وصياغة الخبير"
          description="تابع مراحل العمل على سيرتك الذاتية حتى التسليم."
          badge={<Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{order.status_label}</Badge>}
          actions={
            <ButtonLink to="/dashboard" variant="outline" size="sm">
              <ArrowRight className="size-4" />
              لوحة التحكم
            </ButtonLink>
          }
        />

        {/* بطاقة الطلب */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <p className="text-[12px] text-ink-500">رقم الطلب</p>
            <p className="num mt-1 font-display text-lg font-extrabold text-navy-800">{order.order_number}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-[12px] text-ink-500">تاريخ الإرسال</p>
            <p className="mt-1 font-display text-lg font-extrabold text-navy-800">
              {formatDateAr(order.submitted_at)}
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-[12px] text-ink-500">
              {order.delivered_at ? "تاريخ التسليم" : "التسليم المتوقّع"}
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-navy-800">
              {formatDateAr(order.delivered_at ?? order.expected_delivery_at)}
            </p>
          </div>
        </div>

        {order.is_paid ? <PaymentPanel order={order} onDone={reload} /> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* المراحل */}
            <Card>
              <CardHeader title="مراحل العمل" icon={<Loader className="size-4" />} />
              <CardBody>
                <ol className="relative space-y-6">
                  {(order.timeline ?? []).map((event, index, list) => {
                    const StageIcon = TIMELINE_ICON[event.status] ?? Clock;

                    return (
                      <li key={event.id} className="relative flex gap-4">
                        {index < list.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute top-10 start-[18px] h-[calc(100%+4px)] w-0.5",
                              event.status === "done" ? "bg-navy-600" : "bg-ink-200",
                            )}
                          />
                        ) : null}

                        <span
                          className={cn(
                            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full",
                            event.status === "done" && "bg-navy-600 text-white",
                            event.status === "in_progress" && "bg-gold-400 text-navy-900",
                            event.status === "pending" && "bg-ink-200 text-ink-500",
                          )}
                        >
                          <StageIcon className={cn("size-4", event.status === "in_progress" && "animate-spin")} />
                        </span>

                        <div className="min-w-0 flex-1 pb-1">
                          <p
                            className={cn(
                              "font-semibold",
                              event.status === "pending" ? "text-ink-500" : "text-navy-800",
                            )}
                          >
                            {event.title}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-ink-500">
                            <Badge
                              tone={
                                event.status === "done"
                                  ? "success"
                                  : event.status === "in_progress"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {event.status_label}
                            </Badge>
                            {event.occurred_at ? <span>{timeAgoAr(event.occurred_at)}</span> : null}
                          </p>
                          {event.description ? (
                            <p className="mt-1.5 text-[13px] leading-7 text-ink-600">{event.description}</p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardBody>
            </Card>

            {/* تقرير ATS */}
            <Card>
              <CardHeader
                title="تقرير التوافق مع أنظمة الفرز (ATS)"
                subtitle="مدى قابلية سيرتك للقراءة الآلية لدى لجان المنح."
                icon={<ShieldCheck className="size-4" />}
              />
              <CardBody>
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="shrink-0 text-center">
                    <ProgressRing value={order.ats_score ?? 0} size={104} />
                    <p className="num mt-2 text-[12px] text-ink-500">
                      {passed} من {order.ats_checks?.length ?? 0} معيار
                    </p>
                  </div>

                  <ul className="min-w-0 flex-1 space-y-3">
                    {(order.ats_checks ?? []).map((check) => (
                      <li key={check.id} className="flex gap-2.5 text-[13px] leading-7">
                        <CircleCheck
                          className={cn(
                            "mt-1 size-4 shrink-0",
                            check.passed ? "text-[color:var(--color-success)]" : "text-ink-300",
                          )}
                        />
                        <span className={check.passed ? "text-ink-700" : "text-ink-400"}>{check.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>

            {/* المراسلات */}
            <Card>
              <CardHeader title="المراسلات مع الخبير" icon={<MessageSquare className="size-4" />} />
              <CardBody>
                {(order.notes ?? []).length === 0 ? (
                  <p className="py-4 text-center text-[13px] text-ink-500">لا توجد رسائل بعد.</p>
                ) : (
                  <ul className="space-y-4">
                    {order.notes.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "rounded-xl p-4",
                          item.author_role === "expert" ? "bg-navy-500/10" : "bg-white/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={item.author_name} size={32} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-navy-800">{item.author_name}</p>
                            <p className="text-[11px] text-ink-500">
                              {item.author_role === "expert" ? "الخبير" : "أنت"} · {timeAgoAr(item.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2.5 text-[13px] leading-7 text-ink-700">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {addNote.error ? (
                  <Alert tone="danger" className="mt-4">
                    {addNote.error}
                  </Alert>
                ) : null}

                <form onSubmit={onAddNote} className="mt-5 flex gap-2">
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="اكتب رسالة للخبير…"
                    aria-label="رسالة للخبير"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-ink-900/12 bg-white/60 backdrop-blur-md px-3.5 text-[13px] focus:border-navy-500 focus:outline-none"
                  />
                  <Button type="submit" loading={addNote.submitting} disabled={note.trim().length < 2}>
                    <Send className="size-4" />
                    إرسال
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* الجانب */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {order.expert ? (
              <Card>
                <CardHeader title="الخبير المسؤول" icon={<UserRoundCheck className="size-4" />} />
                <CardBody className="text-center">
                  <Avatar name={order.expert.name} size={72} className="mx-auto" />
                  <p className="mt-3 font-display font-bold text-navy-800">
                    {order.expert.title_prefix} {order.expert.name}
                  </p>
                  <p className="mt-1 text-[13px] text-navy-600">{order.expert.specialization}</p>
                  {order.expert.bio ? (
                    <p className="mt-3 text-[12.5px] leading-7 text-ink-600">{order.expert.bio}</p>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            {order.has_final_file ? (
              <div className="rounded-2xl bg-[color:var(--color-success)]/12 backdrop-blur-md p-5 text-center">
                <CircleCheck className="mx-auto size-8 text-[color:var(--color-success)]" />
                <p className="mt-2 font-bold text-[#14532d]">ملفك جاهز</p>
                {order.final_file_name ? (
                  <p className="mt-1 truncate text-[12px] text-ink-600">{order.final_file_name}</p>
                ) : null}
                <Button className="mt-4 w-full" onClick={onDownload} loading={downloading} loadingText="جارٍ التحميل…">
                  <Download className="size-4" />
                  تحميل الملف
                </Button>
                {downloadError ? (
                  <Alert tone="danger" className="mt-3 text-start">
                    {downloadError}
                  </Alert>
                ) : null}
              </div>
            ) : (
              <Alert tone="info" title="ما الخطوة التالية؟">
                سيصلك إشعار فور انتهاء الفريق من العمل على ملفك، وسيظهر زر التحميل هنا مباشرة.
              </Alert>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * حالة التحويل — تُعرض أعلى الصفحة لأنها ما يوقف الطلب أو يُطلقه.
 * عند الرفض تحمل حقل رفع إشعار بديل: الطلب يبقى قائماً ولا يُلغى.
 */
function PaymentPanel({ order, onDone }) {
  const [receipt, setReceipt] = useState(null);
  const { submit, submitting, error, fieldErrors } = useSubmit(cvOrderApi.replaceReceipt);

  const rejected = order.payment_status === "rejected";
  const awaiting = order.payment_status === "awaiting_review";

  const tone = rejected ? "danger" : awaiting ? "warning" : "success";
  const Icon = rejected ? Receipt : awaiting ? Clock : CircleCheck;

  const onResend = async (event) => {
    event.preventDefault();
    const { ok } = await submit({ id: order.id, receipt });

    if (ok) {
      setReceipt(null);
      onDone?.();
    }
  };

  return (
    <Card
      className={cn(
        "mt-6",
        rejected && "ring-1 ring-[color:var(--color-danger)]/40",
      )}
    >
      <CardHeader
        title="حالة التحويل"
        icon={<Icon className="size-4" />}
        action={<Badge tone={tone}>{order.payment_status_label}</Badge>}
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-600">المبلغ</span>
          <span className="num text-[15px] font-extrabold text-navy-800">
            {formatMoney(order.price_amount, order.price_currency)}
          </span>
        </div>

        {order.receipt_file_name ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-3">
            <span className="text-[13px] text-ink-600">الإشعار المرفق</span>
            <span className="truncate text-[12.5px] font-semibold text-ink-800" dir="ltr">
              {order.receipt_file_name}
            </span>
          </div>
        ) : null}

        {awaiting ? (
          <Alert tone="info">
            استلمنا إشعار التحويل، وسيبدأ الفريق العمل على ملفك فور تأكيده.
          </Alert>
        ) : null}

        {rejected ? (
          <>
            <Alert tone="danger" title="لم نتمكّن من تأكيد التحويل">
              {order.payment_rejection_reason}
            </Alert>

            {error ? <Alert tone="danger">{fieldErrors.receipt?.[0] ?? error}</Alert> : null}

            <form onSubmit={onResend} className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-ink-900/20 p-4 transition hover:bg-white/60">
                <span className="text-[13px] font-semibold text-navy-800">
                  {receipt ? receipt.name : "اختر إشعاراً جديداً"}
                </span>
                <span className="text-[12px] text-ink-500">PNG · JPG · PDF</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
                />
              </label>

              <Button type="submit" loading={submitting} disabled={!receipt}>
                <Send className="size-4" />
                إرسال الإشعار
              </Button>
            </form>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
