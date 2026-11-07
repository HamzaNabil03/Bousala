import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    title: "عن المنصة",
    items: [
      {
        q: "ما هي منصة بَوْصلة؟",
        a: "بَوْصلة منصة عربية تجمع المنح الدراسية من جامعات وجهات مانحة حول العالم في مكان واحد، وتساعدك على معرفة المنح المناسبة لملفك الأكاديمي وتجهيز مستندات التقديم.",
      },
      {
        q: "هل استخدام المنصة مجاني؟",
        a: "تصفّح المنح والمطابقة معها مجانيان بالكامل ولا يحتاجان أي اشتراك. خدمة صياغة السيرة الذاتية وخطاب الدافع بإشراف خبير أكاديمي، ويظهر سعرها — وقد تكون مجانية — قبل إرسال طلبك.",
      },
      {
        q: "هل تقدّم بَوْصلة على المنح نيابة عني؟",
        a: "لا. بَوْصلة تجهّزك للتقديم: ترشّح لك المنح، وتساعدك في كتابة سيرتك الذاتية وخطاب التحفيز، وتذكّرك بالمواعيد. أما تقديم الطلب فيتم عبر الموقع الرسمي للجهة المانحة.",
      },
    ],
  },
  {
    title: "الحساب والملف الأكاديمي",
    items: [
      {
        q: "لماذا أحتاج إلى إكمال ملفي الأكاديمي؟",
        a: "نسبة المطابقة تُحسب بمقارنة ملفك بشروط كل منحة: المرحلة الدراسية، التخصص، المعدل، واللغة. كلما اكتمل ملفك كانت الترشيحات أدق.",
      },
      {
        q: "كيف تُحسب نسبة المطابقة؟",
        a: "تُوزَّن المعايير كالتالي: المرحلة الدراسية ٣٠٪، التخصص ٢٥٪، المعدل ٢٠٪، اللغة ١٥٪، ونوع التمويل ١٠٪. النتيجة نسبة مئوية تظهر على بطاقة كل منحة.",
      },
      {
        q: "معدلي بمقياس مختلف (من ٥ أو نسبة مئوية) — هل هذا مشكلة؟",
        a: "لا. أدخل معدلك ومقياسه كما هو في شهادتك، ونحن نحوّله داخلياً إلى نسبة مئوية لمقارنته بشروط كل منحة.",
      },
      {
        q: "هل يمكنني حذف حسابي؟",
        a: "نعم، من صفحة الإعدادات يمكنك تعطيل حسابك مؤقتاً أو حذفه نهائياً مع كل بياناتك.",
      },
    ],
  },
  {
    title: "صياغة السيرة الذاتية وخطاب الدافع",
    items: [
      {
        q: "ما الخدمات المتاحة؟",
        a: "يكتب فريق بَوْصلة السيرة وخطاب الدافع من الصفر. أما تحسين ملفاتك الحالية فيتم بالذكاء الاصطناعي: ترفع PDF نصياً أو Word، وتستلم ملاحظات ونسخة Word محسّنة.",
      },
      {
        q: "كيف أرسل طلباً؟",
        a: "للتحسين: ارفع ملفك في خدمة الذكاء الاصطناعي ثم راجع النتيجة ونزّلها من حسابك. للكتابة من الصفر: أكمل الطلب وأرفق إشعار التحويل إن كانت الخدمة مدفوعة، ثم تابع عمل الفريق من لوحة التحكم.",
      },
      {
        q: "هل الخدمة مجانية أم مدفوعة؟",
        a: "التحسين بالذكاء الاصطناعي متاح حالياً دون تحويل مالي. سعر الكتابة من الصفر يظهر قبل إرسال الطلب، وقد تكون مجانية بحسب إعدادات الخدمة.",
      },
    ],
  },
  {
    title: "المنح والمواعيد",
    items: [
      {
        q: "كم مرة تُحدَّث بيانات المنح؟",
        a: "يراجع فريق التحرير المنح باستمرار، وتُحدَّث المواعيد وحالة كل منحة أولاً بأول. المنحة التي ينتهي موعدها تُوسم بوضوح.",
      },
      {
        q: "هل تصلني تنبيهات قبل إغلاق التقديم؟",
        a: "نعم. فعّل تنبيهات المواعيد من الإعدادات لتصلك إشعارات قبل انتهاء موعد المنح التي حفظتها أو التي تطابق ملفك.",
      },
    ],
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
      >
        <span className="font-semibold text-navy-800">{item.q}</span>
        <ChevronDown className={cn("size-5 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>

      {open ? <p className="border-t border-ink-900/10 px-5 py-4 text-[14px] leading-8 text-ink-600">{item.a}</p> : null}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="py-12">
      <div className="container-page max-w-4xl">
        <header className="text-center">
          <span className="inline-grid size-14 place-items-center rounded-2xl bg-navy-500/10 text-navy-700">
            <MessageCircleQuestion className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-navy-800">الأسئلة الشائعة</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-8 text-ink-600">
            إجابات سريعة عن أكثر ما يسأل عنه طلاب بَوْصلة.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 font-display text-lg font-bold text-navy-800">{group.title}</h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <FaqItem key={item.q} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 glass-dark rounded-2xl px-6 py-10 text-center text-white">
          <h2 className="font-display text-xl">لم تجد إجابتك؟</h2>
          <p className="mt-2 text-[14px] text-navy-100">اكتب لنا وسنجيبك خلال أيام العمل.</p>
          <ButtonLink to="/contact" variant="gold" className="mt-5">
            تواصل معنا
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
