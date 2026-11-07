import { cn } from "@/lib/utils";
import { LoadingBlock } from "@/components/ui/Spinner";

/**
 * جدول بيانات إداري.
 * الأعمدة: { key, header, className, cell(row) }
 *
 * على الهاتف يتحوّل كل صفّ إلى بطاقة بعناوين الأعمدة إلى جانب قيمها:
 * جدولٌ بعرض 720px داخل شاشة 375px يعني أن نصف الأعمدة خارج الرؤية
 * بلا ما يدلّ عليها، وأعمدة الحالة والإجراءات هي أوّل ما يغيب.
 */
export function DataTable({ columns, rows, loading, empty = "لا توجد بيانات.", rowKey = (row) => row.id }) {
  if (loading) return <LoadingBlock />;

  if (!rows?.length) {
    return <p className="px-5 py-10 text-center text-[13px] text-ink-500">{empty}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-ink-900/10 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="flex flex-col gap-2.5 px-4 py-4">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-3">
                {/* عمود بلا عنوان هو عمود إجراءات: يأخذ السطر كاملاً */}
                {column.header ? (
                  <span className="shrink-0 pt-0.5 text-[12px] font-bold text-ink-500">{column.header}</span>
                ) : null}
                <div className={cn("min-w-0 text-[13px]", column.header ? "text-end" : "flex-1")}>
                  {column.cell(row)}
                </div>
              </div>
            ))}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto scrollbar-slim md:block">
        <table className="w-full min-w-[860px] border-collapse text-start">
          <thead>
            <tr className="border-b border-ink-900/10 bg-white/45">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-start text-[12px] font-bold whitespace-nowrap text-ink-500",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-900/10">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition hover:bg-white/50">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3.5 align-middle text-[13px]", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
