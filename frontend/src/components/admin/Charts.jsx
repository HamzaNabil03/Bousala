import { cn, formatNumber } from "@/lib/utils";
import { CountryFlag } from "@/components/ui/CountryFlag";

/**
 * رسوم بيانية بـ SVG خالص — بلا مكتبات خارجية.
 * لوحة ألوان متباينة مع تسميات مباشرة على كل عنصر،
 * فلا يعتمد القارئ على اللون وحده لتمييز الفئات.
 */
export const CHART_COLORS = ["#2b52ab", "#15803d", "#b45309", "#b91c1c", "#6d28d9"];

/** شريط أفقي مرتّب — مناسب للتسميات العربية الطويلة */
export function BarList({ items, valueLabel = "", color = CHART_COLORS[0], className, max }) {
  const highest = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate font-medium text-ink-700">
              {item.countryCode ? <CountryFlag code={item.countryCode} className="me-1.5 text-base" /> : null}
              {!item.countryCode && item.prefix ? <span className="me-1.5">{item.prefix}</span> : null}
              {item.label}
            </span>
            <span className="num shrink-0 font-bold text-ink-800">
              {formatNumber(item.value)} {valueLabel}
            </span>
          </div>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-900/8">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / highest) * 100}%`, backgroundColor: item.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * مخطط خطي زمني.
 * الشبكة أفقية فقط، والفجوات بين الأعمدة 2px كترميز ثانوي إلى جانب اللون.
 */
export function TrendChart({ points, color = CHART_COLORS[0], height = 180, valueLabel = "" }) {
  const values = points.map((point) => point.value);
  const highest = Math.max(...values, 1);
  const width = 640;
  const padding = { top: 16, bottom: 28, start: 8, end: 8 };
  const innerWidth = width - padding.start - padding.end;
  const innerHeight = height - padding.top - padding.bottom;

  const x = (index) => padding.start + (index / Math.max(points.length - 1, 1)) * innerWidth;
  const y = (value) => padding.top + innerHeight - (value / highest) * innerHeight;

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${padding.top + innerHeight} L${x(0)},${padding.top + innerHeight} Z`;

  // نعرض أربع تسميات فقط على المحور حتى لا تتزاحم
  const tickEvery = Math.max(Math.ceil(points.length / 5), 1);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`مخطط زمني ${valueLabel}`}>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.start}
            x2={width - padding.end}
            y1={padding.top + innerHeight * ratio}
            y2={padding.top + innerHeight * ratio}
            stroke="#e2e7ee"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={color} fillOpacity="0.12" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((point, index) =>
          point.value > 0 ? <circle key={point.label} cx={x(index)} cy={y(point.value)} r="3.5" fill={color} /> : null,
        )}

        {points.map((point, index) =>
          index % tickEvery === 0 ? (
            <text
              key={`tick-${point.label}`}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#94a2b8"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>

      <figcaption className="mt-2 text-center text-[12px] text-ink-500">
        أعلى قيمة: <span className="num font-bold text-ink-700">{formatNumber(highest)}</span> {valueLabel}
      </figcaption>
    </figure>
  );
}

/** توزيع بحلقة — مع تسمية مباشرة لكل شريحة في وسيلة إيضاح نصية */
export function DonutChart({ segments, total, centerLabel, size = 168 }) {
  const sum = (total ?? segments.reduce((accumulator, segment) => accumulator + segment.value, 0)) || 1;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // إزاحة تراكمية لكل شريحة، تُحسب أثناء العرض بلا حالة قابلة للتغيّر
  const arcs = segments.reduce((accumulator, segment, index) => {
    const length = (segment.value / sum) * circumference;
    const start = index === 0 ? 0 : accumulator[index - 1].start + accumulator[index - 1].length;

    accumulator.push({ ...segment, length, start, index });
    return accumulator;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg width={size} height={size} className="shrink-0 -rotate-90" role="img" aria-label="توزيع الحالات">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f5" strokeWidth={strokeWidth} />

        {arcs.map((arc) => {
          // فجوة 2px بين الشرائح كترميز ثانوي يميّزها دون الاعتماد على اللون
          const visible = Math.max(arc.length - 2, 0);

          return (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color ?? CHART_COLORS[arc.index % CHART_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${visible} ${circumference - visible}`}
              strokeDashoffset={-arc.start}
            />
          );
        })}

        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill="#14306b"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {formatNumber(sum)}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((segment, index) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: segment.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate text-ink-700">{segment.label}</span>
            </span>
            <span className="num shrink-0 font-bold text-ink-800">
              {formatNumber(segment.value)}
              <span className="ms-1 font-normal text-ink-400">
                ({Math.round((segment.value / sum) * 100)}%)
              </span>
            </span>
          </li>
        ))}
        {centerLabel ? <li className="pt-1 text-[12px] text-ink-500">{centerLabel}</li> : null}
      </ul>
    </div>
  );
}
