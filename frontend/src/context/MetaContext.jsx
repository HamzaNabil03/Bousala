import { createContext, useContext, useEffect, useState } from "react";

import { metaApi } from "@/api/endpoints";

/** بيانات ثابتة من الخادم: معلومات المنصة وترجمة التعدادات */
const MetaContext = createContext(null);

const FALLBACK = {
  site: {
    name: "بَوْصلة",
    name_en: "Bousla",
    tagline: "منصة عربية للطلاب والباحثين عن المنح",
    description: "منصة لاكتشاف المنح وتجهيز طلبات التقديم.",
    email: null,
    contact_email: null,
    phone: null,
    whatsapp: null,
    address: null,
    social: {},
    media: {
      hero: { url: "/images/landing/hero-1397.jpg", srcset: "/images/landing/hero-640.jpg 640w, /images/landing/hero-1024.jpg 1024w, /images/landing/hero-1397.jpg 1397w", width: 1397, height: 768 },
      cta: { url: "/images/landing/cta-1376.jpg", srcset: "/images/landing/cta-640.jpg 640w, /images/landing/cta-1024.jpg 1024w, /images/landing/cta-1376.jpg 1376w", width: 1376, height: 768 },
      logo: { url: "/logo.png" },
      favicon: { url: "/logo.png" },
    },
  },
  enums: {},
  uploads: { mimes: ["pdf", "doc", "docx", "png", "jpg", "jpeg"] },
};

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const load = () => metaApi.meta().then((data) => {
      if (!cancelled) setMeta(data);
    }).catch(() => undefined);
    const storageUpdated = (event) => {
      if (event.key === "bousla_site_settings_updated") load();
    };

    load();
    window.addEventListener("site-settings-updated", load);
    window.addEventListener("storage", storageUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("site-settings-updated", load);
      window.removeEventListener("storage", storageUpdated);
    };
  }, []);

  useEffect(() => {
    const site = meta.site ?? FALLBACK.site;
    document.title = site.tagline ? `${site.name} — ${site.tagline}` : site.name;

    const description = document.querySelector('meta[name="description"]');
    if (description && site.description) description.setAttribute("content", site.description);

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && site.media?.favicon?.url) favicon.setAttribute("href", site.media.favicon.url);
  }, [meta]);

  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  return useContext(MetaContext) ?? FALLBACK;
}

/** خيارات تعداد جاهزة للقوائم المنسدلة */
export function useEnum(name) {
  const meta = useMeta();
  return meta.enums?.[name] ?? [];
}
