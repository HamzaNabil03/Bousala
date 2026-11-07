/** مشاهد SVG للصفحات العامة — بديل الصور الفوتوغرافية في ملف التصميم */

export function HeroScene({ className }) {
  return (
    <svg viewBox="0 0 520 420" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="hero-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef3fb" />
        </linearGradient>
        <linearGradient id="hero-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd25f" />
          <stop offset="100%" stopColor="#e5ac1c" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="205" r="185" fill="#1e3f8c" opacity="0.35" />
      <circle cx="260" cy="205" r="140" fill="#2b52ab" opacity="0.35" />

      <g transform="translate(118 86)">
        <rect width="250" height="150" rx="20" fill="url(#hero-card)" />
        <rect x="20" y="22" width="120" height="12" rx="6" fill="#14306b" />
        <rect x="20" y="46" width="180" height="9" rx="4.5" fill="#cbd3df" />
        <rect x="20" y="64" width="150" height="9" rx="4.5" fill="#cbd3df" />
        <rect x="20" y="94" width="74" height="26" rx="13" fill="#14306b" />
        <rect x="102" y="94" width="64" height="26" rx="13" fill="#dcfce7" />
        <circle cx="214" cy="34" r="16" fill="url(#hero-gold)" />
        <path
          d="M208 34l4 4 8-8"
          stroke="#14306b"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g transform="translate(60 246)">
        <rect width="190" height="86" rx="16" fill="#ffffff" />
        <circle cx="42" cy="43" r="26" fill="none" stroke="#e2e7ee" strokeWidth="8" />
        <circle
          cx="42"
          cy="43"
          r="26"
          fill="none"
          stroke="#16a34a"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="163"
          strokeDashoffset="33"
          transform="rotate(-90 42 43)"
        />
        <text x="42" y="49" textAnchor="middle" fontSize="16" fontWeight="700" fill="#14306b">
          80%
        </text>
        <rect x="82" y="28" width="86" height="10" rx="5" fill="#14306b" />
        <rect x="82" y="48" width="64" height="8" rx="4" fill="#cbd3df" />
      </g>

      <g transform="translate(330 254)">
        <polygon points="60,0 120,26 60,52 0,26" fill="#14306b" />
        <path d="M24 36v26c0 8 16 14 36 14s36-6 36-14V36l-36 16z" fill="#1e3f8c" />
        <path d="M112 30v34" stroke="url(#hero-gold)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="112" cy="68" r="7" fill="url(#hero-gold)" />
      </g>
    </svg>
  );
}

/** مشهد فريق العمل — صفحة "من نحن" */
export function TeamScene({ className }) {
  return (
    <svg viewBox="0 0 480 300" className={className} role="presentation" aria-hidden="true">
      <rect width="480" height="300" rx="24" fill="#eef3fb" />
      <rect x="40" y="176" width="400" height="14" rx="7" fill="#cbd3df" />

      {[
        { x: 86, color: "#14306b" },
        { x: 196, color: "#f6c445" },
        { x: 306, color: "#2b52ab" },
      ].map((person) => (
        <g key={person.x} transform={`translate(${person.x} 66)`}>
          <circle cx="44" cy="34" r="28" fill="#f4c9a8" />
          <path d="M16 24a28 28 0 0 1 56 0z" fill="#1e293b" />
          <path d="M8 110a36 36 0 0 1 72 0z" fill={person.color} />
        </g>
      ))}

      <g transform="translate(300 26)">
        <rect width="140" height="80" rx="14" fill="#ffffff" />
        <rect x="18" y="20" width="80" height="9" rx="4.5" fill="#14306b" />
        <rect x="18" y="38" width="104" height="7" rx="3.5" fill="#cbd3df" />
        <rect x="18" y="52" width="62" height="7" rx="3.5" fill="#cbd3df" />
      </g>
    </svg>
  );
}
