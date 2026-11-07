import { Bookmark } from "lucide-react";

import { ScholarshipCard, ScholarshipCardSkeleton } from "@/components/scholarships/ScholarshipCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Section";
import { scholarshipApi } from "@/api/endpoints";
import { useApi } from "@/hooks/useApi";
import { useSaved } from "@/hooks/useSaved";

export default function SavedPage() {
  const { data, loading, error, setData } = useApi(scholarshipApi.saved, []);
  const { toggle } = useSaved();

  /** الإزالة من هذه الصفحة تعني اختفاء البطاقة فوراً */
  const onToggleSave = async (scholarship) => {
    setData((current) => (current ?? []).filter((item) => item.slug !== scholarship.slug));
    await toggle(scholarship);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المنح المحفوظة"
        description="المنح التي حفظتها لمراجعتها لاحقاً — تابع مواعيدها قبل إغلاق التقديم."
        badge={data ? <Badge tone="navy">{data.length} منحة</Badge> : null}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ScholarshipCardSkeleton key={index} />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-7" />}
          title="لا توجد منح محفوظة"
          description="احفظ المنح التي تهمّك من صفحة تصفّح المنح لتجدها هنا بسرعة."
          action={<ButtonLink to="/scholarships">تصفّح المنح</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item} saved onToggleSave={onToggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
