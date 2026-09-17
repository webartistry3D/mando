import { formatCurrency } from '@/lib/utils';

interface Segment {
  value: number;
  label: string;
  color: string;
}

interface Props {
  title: string;
  segments: Segment[];
  size?: number;
  hideLegend?: boolean;
}

/** Reusable SVG donut chart with N segments. Handles negative values gracefully. */
export default function DonutChart({ title, segments, size = 140, hideLegend }: Props) {
  // Use absolute values for arc calculation so negatives don't break rendering
  const absSegments = segments.map((s) => ({ ...s, absValue: Math.max(0, s.value) }));
  const total = absSegments.reduce((sum, s) => sum + s.absValue, 0);
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = absSegments
    .filter((s) => s.absValue > 0)
    .map((s) => {
      const len = total > 0 ? circumference * (s.absValue / total) : 0;
      const arc = { ...s, len, offset };
      offset += len;
      return arc;
    });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {total > 0 && arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.len} ${circumference - arc.len}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 600 }}>
          {title}
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-foreground font-mono" style={{ fontSize: 12, fontWeight: 700 }}>
          {total > 0 ? formatCurrency(total) : '—'}
        </text>
      </svg>
      {!hideLegend && (
        <div className="space-y-1.5 text-xs w-full">
          {segments.map((s) => {
            const pct = total > 0 ? Math.round((Math.max(0, s.value) / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto font-mono font-medium">{formatCurrency(s.value)}</span>
                <span className="text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
