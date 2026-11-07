import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { PenLine, Receipt, Upload, UserCheck, Wallet } from "lucide-react";

import { PaymentDetails } from "@/components/tools/PaymentDetails";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { cvOrderApi } from "@/api/endpoints";
import { useApi, useSubmit } from "@/hooks/useApi";
import { cn, formatFileSize, formatMoney } from "@/lib/utils";

/**
 * الخدمات اليدوية الأربع. اثنتان تبدآن من ملف يرفعه الطالب (تحسين)،
 * واثنتان من بياناته وملاحظاته (كتابة من الصفر) — لمن لا خطاب أو سيرة
 * سابقة لديه ليحسّنها.
 */
const KINDS = [
  {
    key: "letter_build",
    label: "كتابة خطاب دافع من الصفر",
    hint: "لا خطاب لديك بعد؟ صف دوافعك وهدفك، ويكتبه الفريق من الصفر.",
    icon: PenLine,
    requiresFile: false,
    noteLabel: "عن ماذا يتحدّث خطابك؟",
    notePlaceholder:
      "اذكر: التخصص والجامعة والمنحة التي تتقدّم لها، دوافعك للدراسة، وأبرز إنجازاتك التي تريد إبرازها.",
  },
];

const ACCEPT_WORK = ".pdf,.doc,.docx";
const ACCEPT_RECEIPT = ".pdf,.png,.jpg,.jpeg";

export default function ServiceRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // رابطٌ يحدّد الخدمة (كل روابط الأدوات تفعل) لا يحتاج المستخدم يختارها مجدداً
  const requestedKind = params.get("kind");
  const lockedKind = KINDS.some((k) => k.key === requestedKind);

  const [kind, setKind] = useState(lockedKind ? requestedKind : KINDS[0].key);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");

  const { data: payment, loading: loadingPayment } = useApi(cvOrderApi.paymentInfo, []);
  const { submit, submitting, error, fieldErrors } = useSubmit(cvOrderApi.submit);

  const current = KINDS.find((k) => k.key === kind) ?? KINDS[0];
  const price = payment?.services?.find((service) => service.kind === kind)?.price ?? 0;
  const currency = payment?.currency ?? "ILS";
  const isPaid = price > 0;

  // خدمة مدفوعة بلا بيانات حساب لا يمكن التحويل إليها أصلاً
  const blocked = isPaid && !payment?.configured;
  const ready = (!current.requiresFile || Boolean(file)) && (!isPaid || Boolean(receipt)) && !blocked;

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result } = await submit({ kind, file, note, receipt, paymentNote });

    if (ok) navigate(`/tools/cv-builder/${result.data.id}`);
  };

  if (["cv_improve", "letter_improve"].includes(requestedKind)) return <Navigate to={`/tools/improve?kind=${requestedKind}`} replace />;

  if (loadingPayment) return <LoadingBlock className="py-24" />;

  return (
    <div className="py-10">
      <div className="container-page max-w-3xl">
        <PageHeader
          title="طلب خدمة يدوية"
          description="يعمل فريق بَوْصلة على ملفك بنفسه ويسلّمك نسخة جاهزة."
        />

        {error ? (
          <Alert tone="danger" className="mb-5">
            {fieldErrors.receipt?.[0] ?? fieldErrors.file?.[0] ?? error}
          </Alert>
        ) : null}

        {blocked ? (
          <Alert tone="warning" className="mb-5">
            خدمة الدفع غير مهيّأة بعد. تواصل معنا لإتمام طلبك.
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          {lockedKind ? (
            /* الخدمة محدَّدة من الرابط الذي وصل منه الطالب — لا داعي ليختارها مجدداً */
            <Card>
              <CardBody className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-400/25 text-gold-800">
                  <current.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-navy-800">{current.label}</p>
                  <p className="mt-0.5 text-[12px] leading-6 text-ink-500">{current.hint}</p>
                </div>
                <span className="num shrink-0 rounded-full bg-navy-500/12 px-2.5 py-1 text-[12px] font-bold text-navy-700">
                  {price > 0 ? formatMoney(price, currency) : "مجاناً"}
                </span>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="نوع الخدمة" icon={<UserCheck className="size-4" />} />
              <CardBody className="grid gap-3 sm:grid-cols-3">
                {KINDS.map((item) => {
                  const active = kind === item.key;
                  const itemPrice =
                    payment?.services?.find((service) => service.kind === item.key)?.price ?? 0;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setKind(item.key)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl p-4 text-start transition",
                        active ? "glass-gold text-navy-900" : "glass-soft hover:bg-white/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <item.icon className="size-5" />
                        <span
                          className={cn(
                            "num shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold",
                            active ? "bg-navy-900/12" : "bg-navy-500/12 text-navy-700",
                          )}
                        >
                          {itemPrice > 0 ? formatMoney(itemPrice, currency) : "مجاناً"}
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] font-bold">{item.label}</p>
                      <p className="mt-1 text-[12px] leading-6 opacity-80">{item.hint}</p>
                    </button>
                  );
                })}
              </CardBody>
            </Card>
          )}

          {current.requiresFile ? (
            <Card>
              <CardHeader
                title="ملفك الحالي"
                subtitle="PDF أو Word، حتى 10 ميجابايت."
                icon={<Upload className="size-4" />}
              />
              <CardBody>
                <FileDrop
                  accept={ACCEPT_WORK}
                  file={file}
                  onPick={setFile}
                  title="اختر ملفاً من جهازك"
                  hint="PDF · DOC · DOCX"
                />
              </CardBody>
            </Card>
          ) : null}

          {isPaid && !blocked ? (
            <>
              <Card>
                <CardHeader
                  title="حوّل المبلغ إلى هذا الحساب"
                  subtitle="ثم أرفق إشعار التحويل أدناه ليؤكّده الفريق."
                  icon={<Wallet className="size-4" />}
                />
                <CardBody>
                  <PaymentDetails account={payment.account} price={price} currency={currency} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="إشعار التحويل"
                  subtitle="لقطة شاشة من تطبيق البنك أو إيصال PDF."
                  icon={<Receipt className="size-4" />}
                />
                <CardBody className="space-y-4">
                  <FileDrop
                    accept={ACCEPT_RECEIPT}
                    file={receipt}
                    onPick={setReceipt}
                    title="أرفق إشعار التحويل"
                    hint="PNG · JPG · PDF"
                  />

                  <Textarea
                    label="ملاحظة عن التحويل (اختياري)"
                    rows={2}
                    counter={500}
                    placeholder="مثال: حوّلت من حساب باسم والدي."
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    error={fieldErrors.payment_note?.[0]}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          <Card>
            <CardBody>
              <Textarea
                label={current.noteLabel}
                rows={4}
                counter={1000}
                placeholder={current.notePlaceholder}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                error={fieldErrors.note?.[0]}
              />
            </CardBody>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={submitting} disabled={!ready}>
              إرسال الطلب
            </Button>
            <ButtonLink to="/tools" variant="outline" size="lg">
              رجوع للأدوات
            </ButtonLink>
          </div>

          {!ready && !blocked ? (
            <p className="text-[12.5px] text-ink-500">
              {current.requiresFile && !file
                ? "أرفق ملفك أولاً ليتمكّن الفريق من العمل عليه."
                : "أرفق إشعار التحويل لإتمام الطلب."}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function FileDrop({ accept, file, onPick, title, hint }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center transition",
        file
          ? "border-[color:var(--color-success)]/50 bg-[color:var(--color-success)]/8"
          : "border-ink-900/20 hover:bg-white/60",
      )}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
      <Upload className="size-7 text-navy-600" />
      {file ? (
        <>
          <span className="text-[13.5px] font-bold text-navy-800">{file.name}</span>
          <span className="num text-[12px] text-ink-500">{formatFileSize(file.size)}</span>
          <span className="text-[12px] text-ink-500">اضغط لاختيار ملف آخر</span>
        </>
      ) : (
        <>
          <span className="text-[13.5px] font-semibold text-navy-800">{title}</span>
          <span className="text-[12px] text-ink-500">{hint}</span>
        </>
      )}
    </label>
  );
}
