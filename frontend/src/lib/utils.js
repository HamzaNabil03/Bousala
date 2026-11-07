import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** دمج أصناف Tailwind مع حلّ التعارضات */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/** 17 سبتمبر 2026 */
export function formatDateAr(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * 17 سبتمبر 2026 · 02:47 م
 * الوقت بصيغة 12 ساعة لأنها المألوفة عربياً، والأرقام لاتينية كبقية الأرقام.
 */
export function formatDateTimeAr(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const hours = date.getHours();
  const period = hours < 12 ? "ص" : "م";
  const hour12 = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatDateAr(date)} · ${hour12}:${minutes} ${period}`;
}

/** سبتمبر 2026 */
export function formatMonthYearAr(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "باقي 12 يوم" / "انتهى الموعد" */
export function deadlineLabel(days) {
  if (days === null || days === undefined) return "غير محدد";
  if (days < 0) return "انتهى الموعد";
  if (days === 0) return "ينتهي اليوم";
  if (days === 1) return "باقي يوم واحد";
  if (days === 2) return "باقي يومان";
  if (days <= 10) return `باقي ${days} أيام`;
  if (days < 30) return `باقي ${days} يوماً`;

  const months = Math.round(days / 30);
  if (months === 1) return "باقي شهر";
  if (months === 2) return "باقي شهران";
  if (months <= 10) return `باقي ${months} أشهر`;
  return `باقي ${months} شهراً`;
}

/** "منذ 5 دقائق" */
export function timeAgoAr(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "الآن";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    if (minutes === 1) return "منذ دقيقة";
    if (minutes === 2) return "منذ دقيقتين";
    return minutes <= 10 ? `منذ ${minutes} دقائق` : `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (hours === 1) return "منذ ساعة";
    if (hours === 2) return "منذ ساعتين";
    return hours <= 10 ? `منذ ${hours} ساعات` : `منذ ${hours} ساعة`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    if (days === 1) return "أمس";
    if (days === 2) return "منذ يومين";
    return `منذ ${days} أيام`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    if (weeks === 1) return "منذ أسبوع";
    if (weeks === 2) return "منذ أسبوعين";
    return `منذ ${weeks} أسابيع`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    if (months === 1) return "منذ شهر";
    if (months === 2) return "منذ شهرين";
    return `منذ ${months} أشهر`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? "منذ سنة" : `منذ ${years} سنوات`;
}

/** 1,248 */
export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

/** رموز العملات الشائعة في المنطقة — وما عداها يُعرض برمزه كما هو */
const CURRENCY_SYMBOLS = {
  ILS: "₪",
  JOD: "د.أ",
  USD: "$",
  EUR: "€",
  EGP: "ج.م",
  SAR: "ر.س",
  AED: "د.إ",
};

/** 50 ₪ */
export function formatMoney(amount, currency = "ILS") {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const value = Number(amount ?? 0);

  // الكسور تُعرض فقط إن وُجدت: 50 لا 50.00
  const formatted = Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);

  return `${formatted} ${symbol}`;
}

/** سعر خدمة بدقة منزلتين مع رمز العملة وكودها الإداري الصريح. */
export function formatServiceMoney(amount, currency = "ILS") {
  const code = String(currency || "ILS").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  const formatted = Number(amount ?? 0).toFixed(2);

  return `${symbol ? `${symbol}${formatted} ` : `${formatted} `}${code}`;
}

/** 2.4 MB */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** الأحرف الأولى من الاسم للأفاتار النصي */
export function initials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

/** المعدل بصيغة موحّدة عند غياب القيمة الجاهزة من الخادم */
export function formatGpa(value, scale) {
  if (value === null || value === undefined) return "—";
  if (!scale) return String(value);
  if (Number(scale) === 100) return `${value}%`;
  return `${Number(value).toFixed(2)} / ${Number(scale).toFixed(2)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
