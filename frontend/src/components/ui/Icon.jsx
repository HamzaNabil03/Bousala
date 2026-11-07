import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  CalendarX,
  CircleCheck,
  ClipboardList,
  Clock,
  Coins,
  FileText,
  FileCheck2,
  FileUser,
  Globe2,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  PenLine,
  Plane,
  Settings,
  Sparkles,
  Star,
  Target,
  UserRound,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";

/**
 * سجل الأيقونات المسموح بها بالاسم.
 * الثوابت والـ API يخزّنان اسم الأيقونة كنص، ولا نستورد الحزمة كاملة
 * حتى لا تتضخّم حزمة البناء.
 */
const REGISTRY = {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  CalendarX,
  CircleCheck,
  ClipboardList,
  Clock,
  Coins,
  FileText,
  FileCheck2,
  FileUser,
  Globe2,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  PenLine,
  Plane,
  Settings,
  Sparkles,
  Star,
  Target,
  UserRound,
  Users,
  Wallet,
  Wand2,
};

export function Icon({ name, className, fallback = "Sparkles" }) {
  const Component = REGISTRY[name] ?? REGISTRY[fallback] ?? LayoutGrid;
  return <Component className={className} />;
}

/** أيقونات المنصات الاجتماعية — لم تعد ضمن حزمة lucide */
export function LinkedinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.45h3.5V21H3.2V8.45Zm5.7 0h3.35v1.71h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.18 2.2 4.18 5.06V21h-3.5v-6.05c0-1.44-.03-3.3-2.05-3.3-2.06 0-2.37 1.57-2.37 3.2V21H8.9V8.45Z" />
    </svg>
  );
}

export function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14 9V7.2c0-.8.2-1.2 1.4-1.2H17V3h-2.6C11.2 3 10.2 4.6 10.2 7v2H8v3h2.2v9h3.8v-9h2.6l.4-3H14Z" />
    </svg>
  );
}

export function GithubIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.88c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.82a9.5 9.5 0 0 1 2.5.34c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" clipRule="evenodd" />
    </svg>
  );
}
