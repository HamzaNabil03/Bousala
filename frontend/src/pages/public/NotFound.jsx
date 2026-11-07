import { ArrowRight, Search } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="text-center">
        <svg viewBox="0 0 320 170" className="mx-auto w-full max-w-sm" role="presentation" aria-hidden="true">
          <text
            x="160"
            y="120"
            textAnchor="middle"
            fontSize="120"
            fontWeight="800"
            fill="#14306b"
            opacity="0.12"
          >
            404
          </text>
          <g transform="translate(110 34)">
            <polygon points="50,0 100,22 50,44 0,22" fill="#14306b" />
            <path d="M20 30v22c0 7 13 12 30 12s30-5 30-12V30L50 44z" fill="#2b52ab" />
            <path d="M94 25v29" stroke="#f6c445" strokeWidth="4" strokeLinecap="round" />
            <circle cx="94" cy="58" r="6" fill="#f6c445" />
          </g>
        </svg>

        <h1 className="mt-4 font-display text-2xl text-navy-800 sm:text-3xl">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-8 text-ink-600">
          الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. جرّب البحث عن منحة أو العودة للصفحة الرئيسية.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" size="lg">
            <ArrowRight className="size-4" />
            الصفحة الرئيسية
          </ButtonLink>
          <ButtonLink to="/scholarships" variant="outline" size="lg">
            <Search className="size-4" />
            ابحث عن منحة
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
