import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search, ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { adminApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useEnum } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { USER_STATUS_TONES } from "@/lib/constants";
import { cn, formatDateAr, formatDateTimeAr } from "@/lib/utils";

export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const roles = useEnum("user_roles");
  const statuses = useEnum("user_statuses");

  const q = params.get("q") ?? "";
  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";
  const page = Number(params.get("page") ?? 1);

  const [term, setTerm] = useState(q);
  const [suspending, setSuspending] = useState(null);
  const [reason, setReason] = useState("");
  const [exporting, setExporting] = useState(false);

  const query = useMemo(() => {
    const payload = { page };
    if (q) payload.q = q;
    if (role) payload.role = role;
    if (status) payload.status = status;
    return payload;
  }, [q, role, status, page]);

  const { data, loading, error, reload } = useApi(() => adminApi.users(query), [JSON.stringify(query)]);
  const setStatus = useSubmit(({ id, value, note }) => adminApi.setUserStatus(id, value, note));
  const setRole = useSubmit(({ id, value }) => adminApi.setUserRole(id, value));

  useEffect(() => {
    const interval = window.setInterval(() => reload(true), 10_000);
    return () => window.clearInterval(interval);
  }, [reload]);

  const write = (next) => {
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.role) search.set("role", next.role);
    if (next.status) search.set("status", next.status);
    if (next.page > 1) search.set("page", String(next.page));
    setParams(search);
  };

  const stats = data?.meta?.stats ?? {};

  const onStatusChange = async (row, value) => {
    if (value === "suspended") {
      setSuspending(row);
      setReason("");
      return;
    }

    const { ok } = await setStatus.submit({ id: row.id, value });
    if (ok) reload(true);
  };

  const confirmSuspend = async () => {
    const { ok } = await setStatus.submit({ id: suspending.id, value: "suspended", note: reason.trim() || undefined });
    if (ok) {
      setSuspending(null);
      reload(true);
    }
  };

  const onRoleChange = async (row, value) => {
    const { ok } = await setRole.submit({ id: row.id, value });
    if (ok) reload(true);
  };

  /** التنزيل يمر عبر الـ API لأن الرابط المباشر لا يحمل توكن المصادقة */
  const onExport = async () => {
    setExporting(true);

    try {
      const blob = await adminApi.exportUsers();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `bousla-users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "user",
      header: "المستخدم",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-bold text-navy-800">{row.name}</p>
            <p className="truncate text-[12px] text-ink-500" dir="ltr">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "الدور",
      cell: (row) => (
        <select
          value={row.role}
          disabled={row.id === currentUser?.id || setRole.submitting}
          onChange={(event) => onRoleChange(row, event.target.value)}
          aria-label={`دور ${row.name}`}
          className="h-8 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-2 text-[12px] font-semibold text-ink-800 disabled:opacity-60 focus:border-navy-500 focus:outline-none"
        >
          {roles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone={USER_STATUS_TONES[row.status] ?? "neutral"} dot>
            {row.status_label}
          </Badge>
          <select
            value={row.status}
            disabled={row.id === currentUser?.id || setStatus.submitting}
            onChange={(event) => onStatusChange(row, event.target.value)}
            aria-label={`حالة ${row.name}`}
            className="h-8 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-2 text-[12px] disabled:opacity-60 focus:border-navy-500 focus:outline-none"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: "completion",
      header: "اكتمال الملف",
      cell: (row) => <span className="num font-semibold text-ink-700">{row.completion_percent ?? 0}%</span>,
    },
    {
      key: "created",
      header: "تاريخ التسجيل",
      cell: (row) => <span className="text-ink-600">{formatDateAr(row.created_at)}</span>,
    },
    {
      key: "last_login",
      header: "آخر دخول",
      cell: (row) => (
        <span className={row.last_login_at ? "text-ink-700" : "text-ink-400"}>
          {row.last_login_at ? formatDateTimeAr(row.last_login_at) : "لم يدخل بعد"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون"
        description="إدارة حسابات الطلاب والمشرفين والخبراء وصلاحياتهم."
        actions={
          <div className="flex items-center gap-2">
            <span
              title="نشاط خلال آخر دقيقة"
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-success)]/12 px-2.5 py-1.5 text-xs font-semibold text-[#166534]"
            >
              <span className="size-1.5 rounded-full bg-[#16a34a]" />
              نشطون الآن
              <span className="num text-sm font-bold">{stats.online ?? 1}</span>
            </span>
            <Button variant="outline" size="sm" onClick={onExport} loading={exporting}>
              <Download className="size-4" />
              تصدير CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={stats.total ?? 0} />
        <StatCard label="حسابات نشطة" value={stats.active ?? 0} tone="success" />
        <StatCard label="موقوفون" value={stats.suspended ?? 0} tone="danger" />
        <StatCard label="جدد هذا الأسبوع" value={stats.new_this_week ?? 0} tone="info" />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              write({ q: term.trim(), role, status, page: 1 });
            }}
            className="relative min-w-[240px] flex-1"
          >
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="ابحث بالاسم أو البريد…"
              aria-label="بحث في المستخدمين"
              className="h-10 w-full rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md ps-10 pe-3 text-[13px] focus:border-navy-500 focus:outline-none"
            />
          </form>

          <select
            value={role}
            onChange={(event) => write({ q, role: event.target.value, status, page: 1 })}
            aria-label="تصفية حسب الدور"
            className="h-10 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-3 text-[13px] focus:border-navy-500 focus:outline-none"
          >
            <option value="">كل الأدوار</option>
            {roles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => write({ q, role, page: 1 })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition",
                !status ? "bg-navy-700 text-white" : "bg-white/55 backdrop-blur-md text-ink-700 hover:bg-white/80",
              )}
            >
              الكل
            </button>
            {statuses.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => write({ q, role, status: item.value, page: 1 })}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition",
                  status === item.value ? "bg-navy-700 text-white" : "bg-white/55 backdrop-blur-md text-ink-700 hover:bg-white/80",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {setStatus.error ? <Alert tone="danger">{setStatus.error}</Alert> : null}
      {setRole.error ? <Alert tone="danger">{setRole.error}</Alert> : null}

      <Card>
        <CardBody className="p-0">
          <DataTable columns={columns} rows={data?.data} loading={loading} empty="لا يوجد مستخدمون مطابقون." />
        </CardBody>
      </Card>

      {data?.meta && data.meta.last_page > 1 ? (
        <Pagination
          page={data.meta.current_page}
          totalPages={data.meta.last_page}
          onChange={(nextPage) => write({ q, role, status, page: nextPage })}
        />
      ) : null}

      {/* سبب الإيقاف */}
      {suspending ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          {/* التعتيم طبقة شقيقة لا حاضنة: عنصر مموّه يحرم ما بداخله من تمويه ما وراءه */}
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="glass-strong relative w-full max-w-md rounded-2xl p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy-800">
              <ShieldCheck className="size-5" />
              إيقاف حساب {suspending.name}
            </h2>
            <p className="mt-2 text-[13.5px] leading-7 text-ink-600">
              لن يتمكن المستخدم من الدخول. يظهر له سبب الإيقاف إن كتبته.
            </p>

            <Input
              label="سبب الإيقاف"
              className="mt-4"
              placeholder="مثال: مخالفة شروط الاستخدام"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />

            <div className="mt-6 flex gap-3">
              <Button variant="danger" onClick={confirmSuspend} loading={setStatus.submitting}>
                إيقاف الحساب
              </Button>
              <Button variant="ghost" onClick={() => setSuspending(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
