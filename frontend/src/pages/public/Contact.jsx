import { useState } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { SiteSocialLinks } from "@/components/public/SiteSocialLinks";
import { metaApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useMeta } from "@/context/MetaContext";
import { useSubmit } from "@/hooks/useApi";

export default function ContactPage() {
  const { site } = useMeta();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    subject: "",
    body: "",
  });

  const { submit, submitting, error, fieldErrors, success, reset } = useSubmit(metaApi.contact);

  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await submit(form);

    if (ok) setForm((current) => ({ ...current, subject: "", body: "" }));
  };

  const channels = [
    { icon: Mail, label: "البريد الإلكتروني", value: site.email, href: `mailto:${site.email}`, ltr: true },
    { icon: Mail, label: "البريد الثانوي", value: site.secondary_email, href: `mailto:${site.secondary_email}`, ltr: true },
    { icon: Phone, label: "الهاتف", value: site.phone, href: `tel:${site.phone}`, ltr: true },
    { icon: MessageCircle, label: "واتساب", value: site.whatsapp, href: site.whatsapp ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` : null, ltr: true },
    { icon: MapPin, label: "العنوان", value: site.address },
    { icon: Clock3, label: "ساعات الدعم", value: site.working_hours },
  ].filter((channel) => channel.value);

  return (
    <div className="py-12">
      <div className="container-page">
        <header className="text-center">
          <h1 className="font-display text-3xl text-navy-800">تواصل معنا</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-8 text-ink-600">
            سؤال عن منحة، ملاحظة على المنصة، أو اقتراح لتحسينها — نحن نسمعك.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glass rounded-2xl p-6 sm:p-8">
            {success ? (
              <Alert tone="success" className="mb-6" title="وصلتنا رسالتك">
                شكراً لتواصلك معنا. سيرد عليك فريق بَوْصلة على بريدك الإلكتروني قريباً.
              </Alert>
            ) : null}

            {error ? (
              <Alert tone="danger" className="mb-6">
                {error}
              </Alert>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4" noValidate onChange={() => success && reset()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="الاسم"
                  required
                  value={form.name}
                  onChange={change("name")}
                  error={fieldErrors.name?.[0]}
                />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={change("email")}
                  error={fieldErrors.email?.[0]}
                />
              </div>

              <Input
                label="الموضوع"
                required
                placeholder="مثال: استفسار عن منحة تشيفينينغ"
                value={form.subject}
                onChange={change("subject")}
                error={fieldErrors.subject?.[0]}
              />

              <Textarea
                label="الرسالة"
                required
                rows={7}
                counter={5000}
                placeholder="اكتب رسالتك بالتفصيل…"
                value={form.body}
                onChange={change("body")}
                error={fieldErrors.body?.[0]}
              />

              <Button type="submit" size="lg" loading={submitting}>
                <Send className="size-4" />
                إرسال الرسالة
              </Button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="glass-dark rounded-2xl p-6 text-white">
              <h2 className="font-display text-lg font-bold">معلومات التواصل</h2>

              <ul className="mt-5 space-y-4">
                {channels.map((channel) => (
                  <li key={channel.label} className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
                      <channel.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] text-navy-200">{channel.label}</p>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          className="block truncate font-semibold hover:underline"
                          dir={channel.ltr ? "ltr" : undefined}
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <p className="font-semibold">{channel.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <SiteSocialLinks className="mt-6 border-t border-white/15 pt-5" />
            </div>

            <Alert tone="info" title="قبل أن ترسل">
              كثير من الأسئلة لها إجابة جاهزة في صفحة الأسئلة الشائعة — قد توفّر عليك الانتظار.
            </Alert>
          </aside>
        </div>
      </div>
    </div>
  );
}
