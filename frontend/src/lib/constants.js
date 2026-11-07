/** التنقّل — تسميات موحّدة عبر كل الشاشات */

export const PUBLIC_NAV = [
  { to: "/", label: "الرئيسية", end: true },
  { to: "/scholarships", label: "اكتشف المنح" },
  { to: "/services", label: "الخدمات" },
  { to: "/#how-it-works", label: "كيف تعمل؟" },
  { to: "/about", label: "من نحن؟" },
];

export const DASHBOARD_NAV = [
  { to: "/dashboard", label: "نظرة عامة", icon: "LayoutGrid", end: true },
  { to: "/dashboard/profile", label: "الملف الأكاديمي", icon: "UserRound" },
  { to: "/dashboard/saved", label: "المحفوظات", icon: "Bookmark" },
  { to: "/dashboard/documents", label: "المستندات", icon: "FileText" },
  { to: "/dashboard/requests", label: "طلباتي", icon: "ClipboardList" },
  { to: "/dashboard/notifications", label: "الإشعارات", icon: "Bell" },
  { to: "/dashboard/settings", label: "الإعدادات", icon: "Settings" },
];

/**
 * حساب إداري أو خبير يصل هذه اللوحة لإعداداته وإشعاراته وحدها — لا ملف
 * أكاديمي له ولا مطابقة منح ولا محفوظات، فلا تظهر له تلك الأقسام.
 */
export const STAFF_DASHBOARD_NAV = [
  { to: "/dashboard/notifications", label: "الإشعارات", icon: "Bell" },
  { to: "/dashboard/settings", label: "الإعدادات", icon: "Settings" },
];

/** السايدبار الإداري — دمج النسختين اللتين ظهرتا في ملف التصاميم */
export const ADMIN_NAV = [
  { to: "/admin", label: "الرئيسية", icon: "LayoutDashboard", end: true },
  { to: "/admin/scholarships", label: "إدارة المنح", icon: "GraduationCap" },
  { to: "/admin/services", label: "إدارة الخدمات", icon: "FileText" },
  { to: "/admin/service-requests", label: "إدارة الطلبات", icon: "ClipboardList" },
  { to: "/admin/team-members", label: "إدارة فريق العمل", icon: "Users" },
  { to: "/admin/testimonials", label: "إدارة آراء الطلاب", icon: "Star" },
  { to: "/admin/users", label: "المستخدمون", icon: "Users" },
  { to: "/admin/ai-tools", label: "أدوات الذكاء الاصطناعي", icon: "Sparkles" },
  { to: "/admin/orders", label: "طلبات السيرة السابقة", icon: "FileUser" },
  { to: "/admin/notifications", label: "الإشعارات", icon: "Bell" },
  { to: "/admin/contact-messages", label: "رسائل تواصل معنا", icon: "Mail" },
  { to: "/admin/reports", label: "التقارير والإحصائيات", icon: "BarChart3" },
  { to: "/admin/site-settings", label: "إعدادات الموقع", icon: "Globe2" },
  { to: "/admin/settings", label: "الإعدادات", icon: "Settings" },
];

export const FOOTER_LINKS = {
  quick: [
    { to: "/", label: "الرئيسية" },
    { to: "/scholarships", label: "اكتشف المنح" },
    { to: "/tools", label: "صياغة السيرة والخطاب" },
    { to: "/services", label: "خدمات الطلاب" },
    { to: "/about", label: "من نحن؟" },
  ],
  support: [
    { to: "/about", label: "عن المنصة" },
    { to: "/contact", label: "تواصل معنا" },
    { to: "/faq", label: "الأسئلة الشائعة" },
    { to: "/terms", label: "شروط الاستخدام" },
    { to: "/privacy", label: "سياسة الخصوصية" },
  ],
};

export const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "deadline", label: "الأقرب موعداً" },
  { value: "match", label: "الأعلى مطابقة" },
  { value: "title", label: "الاسم (أ - ي)" },
];

export const QUICK_FILTERS = [
  { label: "منح البكالوريوس", params: { level: "bachelor" } },
  { label: "منح الماجستير", params: { level: "master" } },
  { label: "منح الدكتوراه", params: { level: "phd" } },
  { label: "منح ممولة بالكامل", params: { funding: "full" } },
];

export const LANGUAGE_PROFICIENCY = [
  "اللغة الأم",
  "متقدم جداً (C2)",
  "متقدم (C1)",
  "متوسط مرتفع (B2)",
  "متوسط (B1)",
  "مبتدئ (A2)",
];

export const SKILL_SUGGESTIONS = [
  "Git & GitHub",
  "حل المشكلات المعقدة",
  "Scrum & Agile",
  "البحث العلمي والتوثيق الأكاديمي",
  "القيادة وإدارة المشاريع",
  "تحليل البيانات",
  "العمل ضمن فريق",
  "الكتابة الأكاديمية",
];

export const GPA_SCALES = [
  { value: 4, label: "من 4.00" },
  { value: 5, label: "من 5.00" },
  { value: 100, label: "نسبة مئوية (100)" },
];

export const TIMEZONES = [
  { value: "Asia/Riyadh", label: "توقيت السعودية (AST)" },
  { value: "Asia/Gaza", label: "توقيت فلسطين (EET)" },
  { value: "Africa/Cairo", label: "توقيت مصر (EET)" },
  { value: "Asia/Amman", label: "توقيت الأردن (EET)" },
  { value: "Asia/Dubai", label: "توقيت الإمارات (GST)" },
  { value: "Europe/Istanbul", label: "توقيت تركيا (TRT)" },
  { value: "Europe/Berlin", label: "توقيت وسط أوروبا (CET)" },
  { value: "Europe/London", label: "توقيت بريطانيا (GMT)" },
];

/** خطوات ويزرد السيرة الذاتية */
export const CV_STEPS = [
  { n: 1, label: "المعلومات الشخصية" },
  { n: 2, label: "التعليم والمؤهلات" },
  { n: 3, label: "الخبرات والأنشطة" },
  { n: 4, label: "المهارات والإنجازات" },
  { n: 5, label: "المراجعة والإرسال" },
];

export const CV_TIPS = {
  1: "النبذة الشخصية هي أول ما تقرأه لجنة التقييم — اجعلها محدّدة وموجّهة لهدفك الأكاديمي، لا عامة.",
  2: "لجان المنح العالمية تفضّل ذكر نظام الدرجات المعتمد بجانب المعدل (مثل 3.88 من 4.00) أو النسبة المئوية.",
  3: "ابدأ كل جملة بفعل قوي واذكر أرقاماً ونتائج ملموسة — «رفعت دقة النموذج من 82% إلى 94%» أقوى من «حسّنت الأداء».",
  4: "لجان المنح العالمية مثل DAAD و Chevening تولي أهمية مضاعفة للمهارات القيادية والمشاريع ذات الأثر المجتمعي الواضح.",
  5: "راجع بياناتك جيداً قبل الإرسال — الخبير سيصيغ سيرتك بناءً على ما أدخلته هنا بالضبط.",
};

/** ألوان وأيقونات أنواع الإشعارات */
export const NOTIFICATION_STYLES = {
  new_match: { icon: "GraduationCap", bar: "border-s-[color:var(--color-info)]", chip: "bg-info-soft text-[#1e40af]" },
  deadline_reminder: { icon: "Clock", bar: "border-s-[color:var(--color-warning)]", chip: "bg-warning-soft text-[#92400e]" },
  document_reviewed: { icon: "CircleCheck", bar: "border-s-[color:var(--color-success)]", chip: "bg-success-soft text-[#166534]" },
  saved_updated: { icon: "BookmarkCheck", bar: "border-s-ink-300", chip: "bg-ink-100 text-ink-600" },
  deadline_passed: { icon: "CalendarX", bar: "border-s-[color:var(--color-danger)]", chip: "bg-danger-soft text-[#991b1b]" },
  order_update: { icon: "Info", bar: "border-s-navy-500", chip: "bg-navy-50 text-navy-700" },
  system: { icon: "Bell", bar: "border-s-navy-400", chip: "bg-navy-50 text-navy-700" },
};

/** ألوان حالات المنح في لوحة الإدارة */
export const SCHOLARSHIP_STATUS_TONES = {
  published: "success",
  pending_review: "warning",
  draft: "neutral",
  expired: "danger",
  archived: "info",
};

export const USER_STATUS_TONES = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
};
