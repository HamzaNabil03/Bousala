import axios from "axios";
import { createReadCache } from "./readCache.js";

const TOKEN_KEY = "menhity_token";
const readCache = createReadCache();

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  readCache.clear();
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // متصفح يمنع التخزين المحلي — نتجاهل بصمت
  }
}

export function sendKeepalive(url) {
  const token = getToken();
  if (!token) return;

  const baseURL = String(api.defaults.baseURL).replace(/\/$/, "");
  fetch(`${baseURL}${url}`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => undefined);
}

/** مهلة عامة — بدونها يدور مؤشّر التحميل بلا نهاية إن لم يستجب الخادم */
export const REQUEST_TIMEOUT = 30_000;

/** توليد الذكاء الاصطناعي يستغرق دقيقة أو أكثر، فله مهلة خاصة */
export const AI_TIMEOUT = 130_000;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  headers: { Accept: "application/json" },
  timeout: REQUEST_TIMEOUT,
});

// إرفاق توكن الوصول مع كل طلب
api.interceptors.request.use((config) => {
  if (!["get", "head", "options"].includes(config.method)) readCache.clear();
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * طلب ينتظر ملفاً (responseType: "blob") يصله جسم الخطأ بلوباً أيضاً،
 * فتضيع رسالة الخادم خلف «حدث خطأ غير متوقّع». نفكّها هنا مرّة واحدة
 * لتقرأها كل الشاشات كما تقرأ أي خطأ آخر.
 */
async function unwrapBlobError(error) {
  const data = error.response?.data;

  if (!(data instanceof Blob) || !data.type.includes("json")) return;

  try {
    error.response.data = JSON.parse(await data.text());
  } catch {
    // جسم غير قابل للقراءة — نبقي البلوب كما هو
  }
}

// انتهاء الجلسة يعيد المستخدم لصفحة الدخول
api.interceptors.response.use(
  (response) => {
    if (!["get", "head", "options"].includes(response.config.method)) readCache.clear();
    return response;
  },
  async (error) => {
    if (error.config && !["get", "head", "options"].includes(error.config.method)) readCache.clear();
    const status = error.response?.status;
    const onAuthPage = /\/(login|register|forgot-password|verify|reset-password)/.test(
      window.location.pathname,
    );

    if (status === 401 && !onAuthPage) {
      setToken(null);
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }

    await unwrapBlobError(error);

    return Promise.reject(error);
  },
);

/** Only explicitly opted-in reads are cached, separately for each session. */
export function cachedGet(url, ttl = 0) {
  return readCache.get(
    JSON.stringify([getToken(), url]),
    () => api.get(url),
    ttl,
  );
}

/**
 * يستخرج رسالة خطأ عربية صالحة للعرض،
 * وأخطاء الحقول لعرضها أسفل كل حقل.
 */
export function parseApiError(error) {
  const response = error?.response;

  if (!response) {
    const timedOut = error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";

    return {
      message: timedOut
        ? "استغرق الخادم وقتاً أطول من المتوقّع ولم يردّ. حاول مجدداً بعد قليل."
        : "تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجدداً.",
      errors: {},
    };
  }

  const data = response.data ?? {};
  const errors = {};

  // تُقرأ في المكوّنات بصيغة fieldErrors.field?.[0]، فنبقيها مصفوفات دائماً
  for (const [field, messages] of Object.entries(data.errors ?? {})) {
    errors[field] = Array.isArray(messages) ? messages : [String(messages)];
  }

  return {
    message: data.message ?? "حدث خطأ غير متوقّع. حاول مجدداً.",
    errors,
    status: response.status,
    // جسم الاستجابة كما هو — لحقول إضافية تحملها بعض الأخطاء (مثل link_sent مع 409 لحساب غير مفعَّل)
    data,
  };
}
