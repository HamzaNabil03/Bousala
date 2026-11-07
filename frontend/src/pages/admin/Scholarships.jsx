import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { adminApi } from "@/api/endpoints";
import { useEnum } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { cn, deadlineLabel, formatDateAr } from "@/lib/utils";

export default function AdminScholarshipsPage() {
  const [params, setParams] = useSearchParams();
  const statuses = useEnum("scholarship_statuses");

  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);

  const [term, setTerm] = useState(q);
  const [confirming, setConfirming] = useState(null);

  const query = useMemo(() => {
    const payload = { page };
    if (status) payload.status = status;
    if (q) payload.q = q;
    return payload;
  }, [status, q, page]);

  const { data, loading, error, reload } = useApi(() => adminApi.scholarships(query), [JSON.stringify(query)]);
  const setStatus = useSubmit(({ slug, value }) => adminApi.setScholarshipStatus(slug, value));
  const remove = useSubmit(adminApi.deleteScholarship);

  const write = (next) => {
    const search = new URLSearchParams();
    if (next.status) search.set("status", next.status);
    if (next.q) search.set("q", next.q);
    if (next.page > 1) search.set("page", String(next.page));
    setParams(search);
  };

  const stats = data?.meta?.stats ?? {};

  const onStatusChange = async (row, value) => {
    const { ok } = await setStatus.submit({ slug: row.slug, value });
    if (ok) reload(true);
  };

  const onDelete = async () => {
    const { ok } = await remove.submit(confirming.slug);
    if (ok) {
      setConfirming(null);
      reload(true);
    }
  };

  const columns = [
    {
      key: "title",
      header: "المنحة",
      cell: (row) => (
        <div className="min-w-0">
          <Link to={`/admin/scholarships/${row.slug}`} className="font-bold text-navy-800 hover:underline">
            {row.title_ar}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
            <CountryFlag code={row.country_code} className="text-sm" />
            {row.country_name_ar} · {row.provider}
          </p>
        </div>
      ),
    },
    {
      key: "levels",
      header: "المراحل",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.levels?.map((level) => (
            <Badge key={level.value} tone="outline">
              {level.label}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "deadline",
      header: "الموعد النهائي",
      cell: (row) => (
        <div>
          <p className="text-ink-700">{formatDateAr(row.deadline)}</p>
          <p className="text-[12px] text-ink-400">{deadlineLabel(row.days_until_deadline)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <select
          value={row.status}
          onChange={(event) => onStatusChange(row, event.target.value)}
          disabled={setStatus.submitting}
          aria-label={`حالة ${row.title_ar}`}
          className="h-8 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-2 text-[12px] font-semibold text-ink-800 focus:border-navy-500 focus:outline-none"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "featured",
      header: "مميزة",
      cell: (row) =>
        row.is_featured ? (
          <Star className="size-4 fill-gold-400 text-gold-500" aria-label="منحة مميزة" />
        ) : (
          <span className="text-ink-300">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          <Link
            to={`/admin/scholarships/${row.slug}`}
            aria-label={`تعديل ${row.title_ar}`}
            className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-navy-500/10 hover:text-navy-700"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(row)}
            aria-label={`حذف ${row.title_ar}`}
            className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-[color:var(--color-danger)]/12 hover:text-[color:var(--color-danger)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المنح"
        description="أضف المنح وحدّث بياناتها وتحكّم في حالة نشرها."
        actions={
          <ButtonLink to="/admin/scholarships/new">
            <Plus className="size-4" />
            منحة جديدة
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="الإجمالي" value={stats.total ?? 0} />
        <StatCard label="منشورة" value={stats.published ?? 0} tone="success" />
        <StatCard label="بانتظار المراجعة" value={stats.pending_review ?? 0} tone="gold" />
        <StatCard label="منتهية" value={stats.expired ?? 0} tone="danger" />
      </div>

      {/* الفلاتر */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              write({ status, q: term.trim(), page: 1 });
            }}
            className="relative min-w-[240px] flex-1"
          >
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="ابحث باسم المنحة أو الجهة…"
              aria-label="بحث في المنح"
              className="h-10 w-full rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md ps-10 pe-3 text-[13px] focus:border-navy-500 focus:outline-none"
            />
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => write({ q, page: 1 })}
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
                onClick={() => write({ status: item.value, q, page: 1 })}
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
      {remove.error ? <Alert tone="danger">{remove.error}</Alert> : null}

      <Card>
        <CardBody className="p-0">
          <DataTable columns={columns} rows={data?.data} loading={loading} empty="لا توجد منح مطابقة." />
        </CardBody>
      </Card>

      {data?.meta && data.meta.last_page > 1 ? (
        <Pagination
          page={data.meta.current_page}
          totalPages={data.meta.last_page}
          onChange={(nextPage) => write({ status, q, page: nextPage })}
        />
      ) : null}

      {/* تأكيد الحذف */}
      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          {/* التعتيم طبقة شقيقة لا حاضنة: عنصر مموّه يحرم ما بداخله من تمويه ما وراءه */}
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="glass-strong relative w-full max-w-md rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-navy-800">حذف المنحة</h2>
            <p className="mt-2 text-[13.5px] leading-7 text-ink-600">
              سيُحذف «{confirming.title_ar}» نهائياً مع كل بياناتها المرتبطة. لا يمكن التراجع.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="danger" onClick={onDelete} loading={remove.submitting}>
                تأكيد الحذف
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
