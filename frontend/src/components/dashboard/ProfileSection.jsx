import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { profileApi } from "@/api/endpoints";
import { useSubmit } from "@/hooks/useApi";

/**
 * قسم قابل للتكرار في الملف الأكاديمي (تعليم، خبرات، شهادات…).
 * كل الأقسام تشترك في نفس دورة الإضافة والتعديل والحذف.
 */
export function ProfileSection({
  type,
  title,
  icon,
  description,
  items = [],
  renderItem,
  renderForm,
  emptyLabel,
  addLabel = "إضافة",
  onChange,
  blankValues,
}) {
  const [editing, setEditing] = useState(null); // 'new' أو كائن العنصر
  const [values, setValues] = useState(blankValues);

  const save = useSubmit((payload) =>
    editing === "new"
      ? profileApi.addItem(type, payload)
      : profileApi.updateItem(type, editing.id, payload),
  );

  const remove = useSubmit((id) => profileApi.removeItem(type, id));

  const openNew = () => {
    setValues(blankValues);
    setEditing("new");
    save.reset();
  };

  const openEdit = (item) => {
    setValues({ ...blankValues, ...item });
    setEditing(item);
    save.reset();
  };

  const close = () => setEditing(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok, result } = await save.submit(values);

    if (ok) {
      close();
      onChange?.(result);
    }
  };

  const onRemove = async (item) => {
    const { ok, result } = await remove.submit(item.id);
    if (ok) onChange?.(result);
  };

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={description}
        icon={icon}
        action={
          editing ? null : (
            <Button variant="soft" size="sm" onClick={openNew}>
              <Plus className="size-4" />
              {addLabel}
            </Button>
          )
        }
      />

      <CardBody>
        {save.error && editing ? (
          <Alert tone="danger" className="mb-4">
            {save.error}
          </Alert>
        ) : null}

        {remove.error ? (
          <Alert tone="danger" className="mb-4">
            {remove.error}
          </Alert>
        ) : null}

        {editing ? (
          <form onSubmit={onSubmit} className="glass-soft rounded-xl p-4 ring-1 ring-ink-900/10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-800">
                {editing === "new" ? addLabel : "تعديل العنصر"}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="إلغاء"
                className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-200"
              >
                <X className="size-4" />
              </button>
            </div>

            {renderForm({ values, setValues, errors: save.fieldErrors })}

            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" loading={save.submitting}>
                حفظ
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={close}>
                إلغاء
              </Button>
            </div>
          </form>
        ) : items.length === 0 ? (
          <p className="py-5 text-center text-[13px] text-ink-500">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-ink-900/10">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">{renderItem(item)}</div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label="تعديل"
                    className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-navy-500/10 hover:text-navy-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    disabled={remove.submitting}
                    aria-label="حذف"
                    className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-[color:var(--color-danger)]/12 hover:text-[color:var(--color-danger)] disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * قسم الوسوم البسيطة (مهارات، اهتمامات): إضافة بالاسم فقط.
 */
export function TagSection({ type, title, icon, description, items = [], suggestions = [], onChange, placeholder }) {
  const [name, setName] = useState("");

  const add = useSubmit((value) => profileApi.addItem(type, { name: value }));
  const remove = useSubmit((id) => profileApi.removeItem(type, id));

  const existing = new Set(items.map((item) => item.name));

  const onAdd = async (value) => {
    const trimmed = value.trim();
    if (!trimmed || existing.has(trimmed)) return;

    const { ok, result } = await add.submit(trimmed);
    if (ok) {
      setName("");
      onChange?.(result);
    }
  };

  const onRemove = async (item) => {
    const { ok, result } = await remove.submit(item.id);
    if (ok) onChange?.(result);
  };

  const remaining = suggestions.filter((suggestion) => !existing.has(suggestion)).slice(0, 8);

  return (
    <Card>
      <CardHeader title={title} subtitle={description} icon={icon} />

      <CardBody>
        {add.error ? (
          <Alert tone="danger" className="mb-4">
            {add.error}
          </Alert>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(name);
          }}
          className="flex gap-2"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 min-w-0 flex-1 rounded-lg border border-ink-900/12 bg-white/60 backdrop-blur-md px-3 text-[13px] focus:border-navy-500 focus:outline-none"
          />
          <Button type="submit" size="sm" loading={add.submitting}>
            <Plus className="size-4" />
            إضافة
          </Button>
        </form>

        {items.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="flex items-center gap-1.5 rounded-full bg-navy-500/10 px-3 py-1.5 text-[13px] font-semibold text-navy-700"
              >
                {item.name}
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`حذف ${item.name}`}
                  className="text-navy-400 hover:text-[color:var(--color-danger)]"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-ink-500">لم تُضف أي عنصر بعد.</p>
        )}

        {remaining.length > 0 ? (
          <div className="mt-4 border-t border-ink-900/10 pt-3">
            <p className="mb-2 text-[12px] font-semibold text-ink-500">اقتراحات سريعة</p>
            <div className="flex flex-wrap gap-2">
              {remaining.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onAdd(suggestion)}
                  className="rounded-full border border-dashed border-ink-300 px-3 py-1.5 text-[12px] text-ink-600 hover:border-navy-400 hover:text-navy-700"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
