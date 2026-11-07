import { useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { documentApi } from "@/api/endpoints";
import { useEnum, useMeta } from "@/context/MetaContext";
import { useApi, useSubmit } from "@/hooks/useApi";
import { cn, formatDateAr, formatFileSize } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

export default function DocumentsPage() {
  const meta = useMeta();
  const kinds = useEnum("document_kinds");
  const inputRef = useRef(null);

  const [kind, setKind] = useState("");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { data, loading, error, reload } = useApi(documentApi.list, []);
  const upload = useSubmit((file) => documentApi.upload(file, kind || "other"));
  const download = useSubmit((document) => documentApi.download(document.id, document.original_name));
  const remove = useSubmit(documentApi.remove);

  const allowed = meta.uploads?.mimes ?? ["pdf", "doc", "docx", "png", "jpg", "jpeg"];

  const handleFile = async (file) => {
    setLocalError(null);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!allowed.includes(extension)) {
      setLocalError(`صيغة غير مدعومة. الصيغ المسموح بها: ${allowed.join("، ")}`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setLocalError("حجم الملف يتجاوز 10 ميجابايت.");
      return;
    }

    const { ok } = await upload.submit(file);
    if (ok) reload(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const onRemove = async (document) => {
    const { ok } = await remove.submit(document.id);
    if (ok) reload(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستندات"
        description="ارفع سيرتك الذاتية وشهاداتك وسجلاتك الأكاديمية لتكون جاهزة وقت التقديم."
      />

      {/* الرفع */}
      <Card>
        <CardBody>
          <div className="mb-4 sm:max-w-xs">
            <Select label="نوع المستند" value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="">اختر النوع…</option>
              {kinds.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
              dragging ? "border-navy-500 bg-navy-500/10" : "border-ink-900/15 bg-white/45",
            )}
          >
            <span className="mx-auto grid size-14 place-items-center rounded-2xl glass text-navy-600">
              <Upload className="size-6" />
            </span>

            <p className="mt-4 font-bold text-navy-800">اسحب الملف هنا أو اختره من جهازك</p>
            <p className="mt-1.5 text-[13px] text-ink-500">
              الصيغ المدعومة: {allowed.join("، ")} — بحد أقصى <span className="num">10</span> ميجابايت
            </p>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={allowed.map((extension) => `.${extension}`).join(",")}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            <Button
              className="mt-5"
              onClick={() => inputRef.current?.click()}
              loading={upload.submitting}
              loadingText="جارٍ الرفع…"
            >
              اختيار ملف
            </Button>
          </div>

          {localError ? (
            <Alert tone="danger" className="mt-4">
              {localError}
            </Alert>
          ) : null}

          {upload.error ? (
            <Alert tone="danger" className="mt-4">
              {upload.error}
            </Alert>
          ) : null}
        </CardBody>
      </Card>

      {/* القائمة */}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {remove.error ? <Alert tone="danger">{remove.error}</Alert> : null}
      {download.error ? <Alert tone="danger">{download.error}</Alert> : null}

      {loading ? (
        <LoadingBlock />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<FileText className="size-7" />}
          title="لا توجد مستندات"
          description="ابدأ برفع سيرتك الذاتية — ستحتاجها في كل طلب تقديم."
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-ink-900/10">
              {data.map((document) => (
                <li key={document.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-500/10 text-navy-600">
                    <FileText className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-800" dir="ltr">
                      {document.original_name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-ink-500">
                      <Badge tone="outline">{document.kind_label}</Badge>
                      <span className="num">{document.size_formatted ?? formatFileSize(document.size_bytes)}</span>
                      <span>{formatDateAr(document.created_at)}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => download.submit(document)}
                      disabled={download.submitting}
                      aria-label={`فتح ${document.original_name}`}
                      className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-navy-500/10 hover:text-navy-700 disabled:opacity-50"
                    >
                      <Download className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(document)}
                      disabled={remove.submitting}
                      aria-label={`حذف ${document.original_name}`}
                      className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-[color:var(--color-danger)]/12 hover:text-[color:var(--color-danger)] disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
