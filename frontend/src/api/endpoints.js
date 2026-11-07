import { AI_TIMEOUT, api, cachedGet } from "./client";

/** كل نداءات الـ API في مكان واحد حتى لا تتناثر المسارات في المكوّنات */

/* ---------------- عام ---------------- */
export const metaApi = {
  meta: () => api.get("/meta").then((r) => r.data.data),
  stats: () => cachedGet("/stats", 60_000).then((r) => r.data.data),
  contact: (payload) => api.post("/contact", payload).then((r) => r.data),
};

export const showcaseApi = {
  team: () => api.get("/team-members").then((r) => r.data.data),
  testimonials: () => api.get("/testimonials").then((r) => r.data.data),
};

/* ---------------- المصادقة ---------------- */
export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  exchangeGoogle: (code) => api.post("/auth/google/exchange", { code }).then((r) => r.data),
  me: () => cachedGet("/auth/me").then((r) => r.data.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  presenceHeartbeat: () => api.post("/presence/heartbeat").then((r) => r.data),
  verifyEmail: ({ email, token }) =>
    api.post("/auth/verify-email", { email, token }).then((r) => r.data),
  resendVerification: (payload) => api.post("/auth/resend-verification", payload).then((r) => r.data),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((r) => r.data),
  resendCode: (payload) => api.post("/auth/resend-code", payload).then((r) => r.data),
  verifyCode: (payload) => api.post("/auth/verify-code", payload).then((r) => r.data),
  resetPassword: (payload) => api.post("/auth/reset-password", payload).then((r) => r.data),
};

/** رابط بدء OAuth يعمل عبر Vite proxy محلياً وعبر عنوان API المطلق في الإنتاج. */
export function googleAuthUrl(next) {
  const base = String(api.defaults.baseURL).replace(/\/$/, "");
  const params = new URLSearchParams();
  if (next?.startsWith("/") && !next.startsWith("//")) params.set("next", next);

  const query = params.toString();
  return `${base}/auth/google/redirect${query ? `?${query}` : ""}`;
}

/* ---------------- المنح ---------------- */
export const scholarshipApi = {
  list: (params) => api.get("/scholarships", { params }).then((r) => r.data),
  featured: () => api.get("/scholarships/featured").then((r) => r.data.data),
  facets: () => cachedGet("/scholarships/facets", 60_000).then((r) => r.data.data),
  show: (slug) => api.get(`/scholarships/${slug}`).then((r) => r.data.data),
  saved: () => cachedGet("/saved").then((r) => r.data.data),
  toggleSave: (slug) => api.post(`/saved/${slug}`).then((r) => r.data),
};

/* ---------------- الخدمات والطلبات الديناميكية ---------------- */
export const serviceApi = {
  // لا نخبّئ إعدادات الخدمات: أي تعديل إداري يجب أن يظهر للطالب فوراً.
  list: () => api.get("/services").then((r) => r.data.data),
  show: (slug) => api.get(`/services/${slug}`).then((r) => r.data.data),
  requests: (params) => api.get("/service-requests", { params }).then((r) => r.data),
  request: (id) => api.get(`/service-requests/${id}`).then((r) => r.data.data),
  submit: ({ serviceId, scholarshipId, fullName, email, phone, notes, responses, files, receipt, supportingDocuments, submissionToken }) => {
    const form = new FormData();
    form.append("submission_token", submissionToken);
    if (serviceId) form.append("service_id", serviceId);
    if (scholarshipId) form.append("scholarship_id", scholarshipId);
    form.append("full_name", fullName);
    form.append("email", email);
    form.append("phone", phone);
    if (notes) form.append("notes", notes);
    form.append("responses", JSON.stringify(responses ?? {}));
    Object.entries(files ?? {}).forEach(([key, file]) => file && form.append(`field_files[${key}]`, file));
    (supportingDocuments ?? []).forEach((file) => form.append("supporting_documents[]", file));
    if (receipt) form.append("receipt", receipt);
    return api.post("/service-requests", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  downloadAttachment: (requestId, attachmentId, name) => downloadFile(`/service-requests/${requestId}/attachments/${attachmentId}`, name),
};

/* ---------------- لوحة الطالب ---------------- */
export const dashboardApi = {
  overview: () => api.get("/dashboard").then((r) => r.data.data),
};

export const profileApi = {
  show: () => api.get("/profile").then((r) => r.data.data),
  completion: () => api.get("/profile/completion").then((r) => r.data.data),
  updatePersonal: (payload) => api.put("/profile", payload).then((r) => r.data.data),
  addItem: (type, payload) => api.post(`/profile/${type}`, payload).then((r) => r.data.data),
  updateItem: (type, id, payload) => api.put(`/profile/${type}/${id}`, payload).then((r) => r.data.data),
  removeItem: (type, id) => api.delete(`/profile/${type}/${id}`).then((r) => r.data.data),
};

export const documentApi = {
  list: () => api.get("/documents").then((r) => r.data.data),
  upload: (file, kind) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return api
      .post("/documents", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.data);
  },
  download: (id, name) => downloadFile(`/documents/${id}/file`, name),
  remove: (id) => api.delete(`/documents/${id}`).then((r) => r.data),
};

export const notificationApi = {
  list: (tab) => api.get("/notifications", { params: { tab } }).then((r) => r.data),
  unreadCount: () => cachedGet("/notifications/unread-count").then((r) => r.data.count),
  markAllRead: () => api.post("/notifications/read-all").then((r) => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
};

export const settingsApi = {
  sessions: () => api.get("/sessions").then((r) => r.data.data),
  revokeSession: (id) => api.delete(`/sessions/${id}`).then((r) => r.data),
  revokeAllSessions: () => api.delete("/sessions/all").then((r) => r.data),
  updatePassword: (payload) => api.put("/settings/password", payload).then((r) => r.data),
  updatePrivacy: (payload) => api.put("/settings/privacy", payload).then((r) => r.data.data),
  updateNotifications: (payload) => api.put("/settings/notifications", payload).then((r) => r.data.data),
  updateLocale: (payload) => api.put("/settings/locale", payload).then((r) => r.data.data),
  deactivate: () => api.post("/settings/deactivate").then((r) => r.data),
  deleteAccount: (confirm) => api.delete("/settings/account", { data: { confirm } }).then((r) => r.data),
};

/* ---------------- أدوات الذكاء الاصطناعي ---------------- */
export const aiApi = {
  tools: () => api.get("/ai-tools").then((r) => r.data),
  run: (key, payload) =>
    api.post(`/ai-tools/${key}/run`, payload, { timeout: AI_TIMEOUT }).then((r) => r.data.data),
};

export const cvOrderApi = {
  active: () => api.get("/cv-orders/active").then((r) => r.data.data),
  readiness: () => api.get("/cv-orders/readiness").then((r) => r.data.data),
  show: (id) => api.get(`/cv-orders/${id}`).then((r) => r.data.data),
  paymentInfo: () => api.get("/cv-orders/payment-info").then((r) => r.data.data),
  submit: ({ kind = "cv_build", file, note, receipt, paymentNote } = {}) => {
    const form = new FormData();
    form.append("kind", kind);
    if (file) form.append("file", file);
    if (note) form.append("note", note);
    if (receipt) form.append("receipt", receipt);
    if (paymentNote) form.append("payment_note", paymentNote);
    return api
      .post("/cv-orders", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  /** إشعار بديل بعد رفض الأول */
  replaceReceipt: ({ id, receipt, paymentNote }) => {
    const form = new FormData();
    form.append("receipt", receipt);
    if (paymentNote) form.append("payment_note", paymentNote);
    return api
      .post(`/cv-orders/${id}/receipt`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  /* الملفات على قرص خاص، فتُحمَّل عبر مسار مصرّح لا برابط مباشر */
  downloadFinal: (id, name) => downloadFile(`/cv-orders/${id}/file`, name),
  addNote: (id, body) => api.post(`/cv-orders/${id}/notes`, { body }).then((r) => r.data.data),
};

/**
 * يجلب ملفاً محمياً بالتوكن ويعيد رابط كائن لعرضه داخل الصفحة.
 * الملفات على قرص خاص فلا يصلح وضع مسارها في src مباشرة.
 *
 * على المستدعي استدعاء URL.revokeObjectURL عند الإغلاق.
 */
async function fetchBlobUrl(url) {
  const response = await api.get(url, { responseType: "blob" });

  return { url: URL.createObjectURL(response.data), type: response.data.type };
}

/** يحمّل ملفاً محمياً بالتوكن ثم يسلّمه للمتصفح كتنزيل */
async function downloadFile(url, fallbackName) {
  const response = await api.get(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fallbackName ?? "بَوْصلة";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

/* ---------------- لوحة الإدارة ---------------- */
export const adminApi = {
  dashboard: () => api.get("/admin/dashboard").then((r) => r.data.data),

  scholarships: (params) => api.get("/admin/scholarships", { params }).then((r) => r.data),
  scholarship: (slug) => api.get(`/admin/scholarships/${slug}`).then((r) => r.data.data),
  createScholarship: (payload) => api.post("/admin/scholarships", payload).then((r) => r.data),
  updateScholarship: (slug, payload) => api.put(`/admin/scholarships/${slug}`, payload).then((r) => r.data),
  setScholarshipStatus: (slug, status) =>
    api.patch(`/admin/scholarships/${slug}/status`, { status }).then((r) => r.data),
  deleteScholarship: (slug) => api.delete(`/admin/scholarships/${slug}`).then((r) => r.data),

  users: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  setUserStatus: (id, status, reason) =>
    api.patch(`/admin/users/${id}/status`, { status, reason }).then((r) => r.data),
  setUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  /** تنزيل CSV عبر الـ API حتى يُرسَل توكن المصادقة مع الطلب */
  exportUsers: () => api.get("/admin/users/export", { responseType: "blob" }).then((r) => r.data),

  aiTools: () => api.get("/admin/ai-tools").then((r) => r.data),
  toggleAiTool: (key) => api.patch(`/admin/ai-tools/${key}/toggle`).then((r) => r.data),

  orders: (deleted) =>
    api.get("/admin/orders", { params: deleted ? { deleted: 1 } : {} }).then((r) => r.data),
  deleteOrder: (id, reason) =>
    api.delete(`/admin/orders/${id}`, { data: { reason } }).then((r) => r.data),
  restoreOrder: (id) => api.post(`/admin/orders/${id}/restore`).then((r) => r.data),
  downloadOrderSource: (id, name) => downloadFile(`/admin/orders/${id}/source`, name),
  deliverOrder: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post(`/admin/orders/${id}/deliver`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  advanceOrder: (id, status) => api.patch(`/admin/orders/${id}/advance`, { status }).then((r) => r.data),
  /* الإشعار يُعاين لا يُنزَّل: المدير يتأكّد منه بالنظر */
  openOrderReceipt: (id) => fetchBlobUrl(`/admin/orders/${id}/receipt`),
  reviewPayment: (id, decision, reason) =>
    api.post(`/admin/orders/${id}/payment`, { decision, reason }).then((r) => r.data),

  notifications: () => api.get("/admin/notifications").then((r) => r.data),
  broadcast: (payload) => api.post("/admin/notifications/broadcast", payload).then((r) => r.data),

  contactMessages: () => api.get("/admin/contact-messages").then((r) => r.data),
  contactMessage: (id) => api.get(`/admin/contact-messages/${id}`).then((r) => r.data.data),

  reports: () => api.get("/admin/reports").then((r) => r.data.data),
  settings: () => api.get("/admin/settings").then((r) => r.data.data),
  updatePayment: (payload) => api.put("/admin/settings/payment", payload).then((r) => r.data),
  siteSettings: () => api.get("/admin/site-settings").then((r) => r.data.data),
  updateSiteSettings: (payload) => api.post("/admin/site-settings", payload, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  restoreSiteMedia: (slot) => api.post(`/admin/site-settings/media/${slot}/restore`).then((r) => r.data),

  teamMembers: () => api.get("/admin/team-members").then((r) => r.data.data),
  createTeamMember: (payload) => showcaseWrite("/admin/team-members", payload),
  updateTeamMember: (id, payload) => showcaseWrite(`/admin/team-members/${id}`, payload, true),
  deleteTeamMember: (id) => api.delete(`/admin/team-members/${id}`).then((r) => r.data),

  testimonials: () => api.get("/admin/testimonials").then((r) => r.data),
  createTestimonial: (payload) => showcaseWrite("/admin/testimonials", payload),
  updateTestimonial: (id, payload) => showcaseWrite(`/admin/testimonials/${id}`, payload, true),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`).then((r) => r.data),

  services: () => api.get("/admin/services").then((r) => r.data),
  service: (slug) => api.get(`/admin/services/${slug}`).then((r) => r.data.data),
  createService: (payload) => serviceWrite("/admin/services", payload),
  updateService: (slug, payload) => serviceWrite(`/admin/services/${slug}`, payload, true),
  toggleService: (slug) => api.patch(`/admin/services/${slug}/toggle`).then((r) => r.data),
  deleteService: (slug) => api.delete(`/admin/services/${slug}`).then((r) => r.data),

  serviceRequests: (params) => api.get("/admin/service-requests", { params }).then((r) => r.data),
  serviceRequest: (id) => api.get(`/admin/service-requests/${id}`).then((r) => r.data.data),
  updateServiceRequestStatus: (id, payload) => api.patch(`/admin/service-requests/${id}/status`, payload).then((r) => r.data),
  reviewServicePayment: (id, payload) => api.patch(`/admin/service-requests/${id}/payment`, payload).then((r) => r.data),
  updateServiceRequestNotes: (id, internal_notes) => api.put(`/admin/service-requests/${id}/notes`, { internal_notes }).then((r) => r.data),
  deliverServiceRequest: (id, file) => {
    const form = new FormData(); form.append("file", file);
    return api.post(`/admin/service-requests/${id}/deliver`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  downloadServiceAttachment: (requestId, attachmentId, name) => downloadFile(`/admin/service-requests/${requestId}/attachments/${attachmentId}`, name),
  previewServiceAttachment: (requestId, attachmentId) => fetchBlobUrl(`/admin/service-requests/${requestId}/attachments/${attachmentId}`),
};

function serviceWrite(url, payload, update = false) {
  if (!payload.image) return (update ? api.put(url, payload) : api.post(url, payload)).then((r) => r.data);
  const form = new FormData();
  if (update) form.append("_method", "PUT");
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "fields") {
      value.forEach((field, index) => Object.entries(field).forEach(([fieldKey, fieldValue]) => {
        if (fieldKey === "options") (fieldValue ?? []).forEach((option, optionIndex) => form.append(`fields[${index}][options][${optionIndex}]`, option));
        else form.append(`fields[${index}][${fieldKey}]`, typeof fieldValue === "boolean" ? Number(fieldValue) : fieldValue ?? "");
      }));
    } else form.append(key, typeof value === "boolean" ? Number(value) : value ?? "");
  });
  return api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

function showcaseWrite(url, payload, update = false) {
  if (!payload.photo) return (update ? api.put(url, payload) : api.post(url, payload)).then((r) => r.data);
  const form = new FormData();
  if (update) form.append("_method", "PUT");
  Object.entries(payload).forEach(([key, value]) => form.append(key, typeof value === "boolean" ? Number(value) : value ?? ""));
  return api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

/* ---------------- مساحة عمل الخبير ---------------- */
export const expertApi = {
  orders: () => api.get("/expert/orders").then((r) => r.data),
  order: (id) => api.get(`/expert/orders/${id}`).then((r) => r.data.data),
  downloadOrderSource: (id, name) => downloadFile(`/expert/orders/${id}/source`, name),
  deliverOrder: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post(`/expert/orders/${id}/deliver`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  advanceOrder: (id, status) => api.patch(`/expert/orders/${id}/advance`, { status }).then((r) => r.data),
  addNote: (id, body) => api.post(`/cv-orders/${id}/notes`, { body }).then((r) => r.data),
};
