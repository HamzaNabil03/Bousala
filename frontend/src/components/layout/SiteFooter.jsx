import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { SiteSocialLinks } from "@/components/public/SiteSocialLinks";
import { useMeta } from "@/context/MetaContext";
import { FOOTER_LINKS } from "@/lib/constants";

/**
 * فوتر موحّد لكل صفحات المنصة.
 * (ملف الواجهات كان يحوي نسختين مختلفتين — اعتُمدت النسخة الكاملة.)
 */
export function SiteFooter() {
  const { site } = useMeta();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-800 text-white">
      <div className="container-page py-9">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo tone="white" markClassName="size-11 rounded-lg bg-white p-1" />
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-navy-200">{site.footer_description || site.description}</p>
            <SiteSocialLinks className="mt-4" />
          </div>

          <FooterColumn title="روابط سريعة" links={FOOTER_LINKS.quick} />
          <FooterColumn title="الدعم" links={FOOTER_LINKS.support} />

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">معلومات التواصل</h3>
            <ul className="space-y-3 text-[13px] text-navy-200">
              {site.phone ? <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-gold-400" />
                <a href={`tel:${site.phone}`} className="num hover:text-white" dir="ltr">{site.phone}</a>
              </li> : null}
              {site.email ? <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-gold-400" />
                <a href={`mailto:${site.email}`} className="hover:text-white" dir="ltr">
                  {site.email}
                </a>
              </li> : null}
              {site.whatsapp ? <li className="flex items-center gap-2.5">
                <MessageCircle className="size-4 shrink-0 text-gold-400" />
                <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="num hover:text-white" dir="ltr">{site.whatsapp}</a>
              </li> : null}
              {site.address ? <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-gold-400" />
                <span>{site.address}</span>
              </li> : null}
              {site.working_hours ? <li className="text-xs leading-6 text-navy-300">{site.working_hours}</li> : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-4">
          <p className="text-center text-[12px] text-navy-300">
            {site.copyright_text || <>© <span className="num">{year}</span> {site.name} — جميع الحقوق محفوظة.</>}
          </p>
        </div>
      </div>
    </footer>
  );
}
function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      <ul className="-my-1.5">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link
              to={link.to}
              className="inline-flex min-h-10 items-center text-[13px] text-navy-200 transition-colors hover:text-gold-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
