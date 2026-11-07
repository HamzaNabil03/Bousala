import { FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/Icon";
import { useMeta } from "@/context/MetaContext";
import { cn } from "@/lib/utils";

const NETWORKS = [
  ["linkedin", "لينكد إن", LinkedinIcon],
  ["instagram", "إنستغرام", InstagramIcon],
  ["facebook", "فيسبوك", FacebookIcon],
  ["youtube", "يوتيوب", YouTubeIcon],
  ["tiktok", "تيك توك", TikTokIcon],
  ["telegram", "تيليغرام", TelegramIcon],
  ["x", "إكس", XIcon],
];

export function SiteSocialLinks({ className, linkClassName }) {
  const { site } = useMeta();
  const links = NETWORKS.filter(([key]) => site.social?.[key]);
  if (!links.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map(([key, label, NetworkIcon]) => (
        <a key={key} href={site.social[key]} target="_blank" rel="noreferrer noopener" aria-label={label} className={cn("flex size-10 items-center justify-center rounded-lg bg-white/12 text-white transition-colors hover:bg-gold-400 hover:text-navy-900", linkClassName)}>
          <NetworkIcon className="size-4" />
        </a>
      ))}
    </div>
  );
}

function YouTubeIcon({ className }) { return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.5v-7l6.1 3.5-6.1 3.5Z" /></svg>; }
function TikTokIcon({ className }) { return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M15.5 3c.3 2.2 1.5 3.6 3.5 3.8v3.1a8.6 8.6 0 0 1-3.5-1v6.2a6.1 6.1 0 1 1-5.3-6v3.2a3 3 0 1 0 2.1 2.8V3h3.2Z" /></svg>; }
function TelegramIcon({ className }) { return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="m21.7 3.4-3.2 16c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.4-.1-.6-.6-.2L6.1 13.1 1.3 11.6c-1-.3-1-1 .2-1.5l18.7-7.2c.9-.3 1.7.2 1.5.5Z" /></svg>; }
function XIcon({ className }) { return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M18.9 3H22l-6.8 7.8L23.2 21H17l-4.9-6.4L6.5 21H3.4l7.2-8.3L2.9 3h6.3l4.4 5.8L18.9 3Zm-1.1 16.2h1.7L8.3 4.7H6.5l11.3 14.5Z" /></svg>; }
