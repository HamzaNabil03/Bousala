import { useState } from "react";
import { Eye, Mail, MailOpen, X } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingBlock } from "@/components/ui/Spinner";
import { adminApi } from "@/api/endpoints";
import { useApi } from "@/hooks/useApi";
import { formatDateAr, timeAgoAr } from "@/lib/utils";

/**
 * رسائل "تواصل معنا" — أي زائر يرسلها بلا حساب، فهذه الشاشة هي الوسيلة
 * الوحيدة لقراءتها؛ كانت تُحفظ سابقاً بلا أي واجهة تعرضها.
 */
export default function AdminContactMessagesPage() {
  const { data, loading, error, reload } = useApi(adminApi.contactMessages, []);
  const [openId, setOpenId] = useState(null);

  const meta = data?.meta ?? {};

  const onOpen = (row) => {
    setOpenId(row.id);
    // فتح الرسالة يُعلِمها مقروءة بالخادم؛ نعكس ذلك محلياً فوراً
    if (!row.is_read) reload(true);
  };

  const columns = [
    {
      key: "status",
      header: "",
      className: "w-10",
      cell: (row) =>
        row.is_read ? (
          <MailOpen className="size-4 text-ink-400" />
        ) : (
          <Mail className="size-4 text-navy-700" />
        ),
    },
    {
      key: "from",
      header: "المرسل",
      cell: (row) => (
        <div className="min-w-0">
          <p className={row.is_read ? "truncate font-semibold text-ink-800" : "truncate font-bold text-navy-900"}>
            {row.name}
          </p>
          <p className="truncate text-[12px] text-ink-500" dir="ltr">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "الموضوع",
      cell: (row) => (
        <p className="line-clamp-2 max-w-sm text-[13px] text-ink-700">{row.subject || row.body}</p>
      ),
    },
    {
      key: "status_badge",
      header: "الحالة",
      cell: (row) => (
        <Badge tone={row.is_read ? "neutral" : "warning"} dot>
          {row.is_read ? "مقروءة" : "غير مقروءة"}
        </Badge>
      ),
    },
    {
      key: "time",
      header: "التوقيت",
      cell: (row) => <span className="num text-[12.5px] text-ink-500">{timeAgoAr(row.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => onOpen(row)}>
          <Eye className="size-3.5" />
          عرض
        </Button>
      ),
    },
  ];

  const openRow = (data?.data ?? []).find((row) => row.id === openId);

  return (
    <div className="space-y-6">
      <PageHeader title="رسائل تواصل معنا" description="رسائل يرسلها الزوّار من صفحة تواصل معنا — بلا حاجة لحساب." />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="إجمالي الرسائل" value={meta.total ?? 0} icon={<Mail className="size-5" />} />
        <StatCard label="غير مقروءة" value={meta.unread ?? 0} icon={<MailOpen className="size-5" />} tone="gold" />
      </div>

      <Card>
        <CardBody className="p-0">
          <DataTable columns={columns} rows={data?.data} loading={loading} empty="لا رسائل بعد." />
        </CardBody>
      </Card>

      {openId ? (
        <MessageDetail id={openId} preview={openRow} onClose={() => setOpenId(null)} />
      ) : null}
    </div>
  );
}

function MessageDetail({ id, preview, onClose }) {
  const { data: message, loading } = useApi(() => adminApi.contactMessage(id), [id]);
  const shown = message ?? preview;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      {/* التعتيم طبقة شقيقة لا حاضنة: عنصر مموّه يحرم ما بداخله من تمويه ما وراءه */}
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="glass-strong relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/10 px-5 py-3.5">
          <p className="font-display font-bold text-navy-800">تفاصيل الرسالة</p>
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
          {loading && !preview ? (
            <LoadingBlock className="py-10" />
          ) : !shown ? null : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-navy-900">{shown.name}</p>
                  <a href={`mailto:${shown.email}`} className="text-[13px] text-navy-600 hover:underline" dir="ltr">
                    {shown.email}
                  </a>
                </div>
                <span className="num shrink-0 text-[12px] text-ink-500">{formatDateAr(shown.created_at)}</span>
              </div>

              {shown.subject ? (
                <div>
                  <p className="text-[12px] font-bold text-ink-500">الموضوع</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink-800">{shown.subject}</p>
                </div>
              ) : null}

              <div>
                <p className="text-[12px] font-bold text-ink-500">الرسالة</p>
                <p className="mt-1 whitespace-pre-line text-[13.5px] leading-7 text-ink-800">{shown.body}</p>
              </div>

              <a
                href={`mailto:${shown.email}${shown.subject ? `?subject=${encodeURIComponent(`رد: ${shown.subject}`)}` : ""}`}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-navy-700 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800"
              >
                الرد عبر البريد الإلكتروني
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
