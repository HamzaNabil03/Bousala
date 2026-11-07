import { Clock3, ShieldCheck } from "lucide-react";

import { serviceApi } from "@/api/endpoints";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { formatServiceMoney } from "@/lib/utils";

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const { data: services, loading, error } = useApi(serviceApi.list, []);

  if (loading) return <LoadingBlock className="py-24" />;

  return (
    <div className="container-page py-12">
      <PageHeader title="خدمات الطلاب" description="خدمات مهنية مرنة يديرها فريق بَوْصلة. السعر والحقول المعروضة محدثة مباشرة من النظام." />
      {error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : null}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {(services ?? []).map((service) => (
          <Card key={service.id} className="flex flex-col overflow-hidden">
            {service.has_image ? <img src={`/api/v1/services/${service.slug}/icon?v=${encodeURIComponent(service.updated_at ?? "")}`} alt="" className="h-40 w-full object-cover" /> : null}
            <CardBody className="flex flex-1 flex-col">
              <span className="grid size-12 place-items-center rounded-xl bg-gold-400/25 text-navy-800"><Icon name={service.icon} className="size-6" /></span>
              <p className="mt-4 text-xs font-bold text-gold-800">{service.category?.name}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-navy-900">{service.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-ink-600">{service.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-900/8 pt-4">
                <span className="font-bold text-navy-800" dir="ltr">{service.price > 0 ? formatServiceMoney(service.price, service.currency) : "مجانًا"}</span>
                {service.delivery_days ? <span className="flex items-center gap-1 text-xs text-ink-500"><Clock3 className="size-4" />{service.delivery_days} أيام تقريبًا</span> : null}
              </div>
              <ButtonLink to={isAuthenticated ? `/services/${service.slug}/request` : `/login?next=${encodeURIComponent(`/services/${service.slug}/request`)}`} className="mt-4 w-full">اطلب الخدمة</ButtonLink>
            </CardBody>
          </Card>
        ))}
      </div>
      {!error && !services?.length ? <p className="mt-8 rounded-2xl bg-navy-50 p-8 text-center text-ink-600">لا توجد خدمات متاحة حاليًا.</p> : null}
      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-navy-50 p-5 text-sm leading-7 text-navy-800"><ShieldCheck className="mt-1 size-5 shrink-0" /><p>يُراجع الفريق إشعار الدفع يدويًا، ولا يعني إرسال الطلب أو رفع الإشعار نجاح الدفع أو ضمان القبول في أي منحة.</p></div>
    </div>
  );
}
