import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export interface ChartDay {
  date: string;
  revenue: number;
  expenses: number;
}

interface Props {
  days: ChartDay[];
}

const W = 720;
const H = 220;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;

function shortLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function compact(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

export default function RevenueChart({ days }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(
    () => Math.max(1, ...days.flatMap((d) => [d.revenue, d.expenses])),
    [days]
  );

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const groupW = innerW / Math.max(1, days.length);
  const barW = Math.min(18, (groupW - 8) / 2);

  const yFor = (v: number) => PAD_T + innerH - (v / max) * innerH;

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_T + innerH - f * innerH,
    label: compact(max * f),
  }));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines */}
        {gridLines.map((g) => (
          <g key={g.y}>
            <line x1={PAD_L} x2={W - PAD_R} y1={g.y} y2={g.y} className="stroke-border" strokeDasharray="3 4" strokeWidth={1} />
            <text x={W - PAD_R} y={g.y - 3} textAnchor="end" className="fill-muted-foreground" fontSize={9}>
              {g.label}
            </text>
          </g>
        ))}

        {days.map((d, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const rH = Math.max(2, innerH - (d.revenue / max) * innerH);
          const eH = Math.max(2, innerH - (d.expenses / max) * innerH);
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHover(i)}
              className="cursor-pointer"
            >
              <rect
                x={PAD_L + groupW * i}
                y={PAD_T}
                width={groupW}
                height={innerH}
                fill="transparent"
              />
              {hover === i && (
                <rect
                  x={PAD_L + groupW * i + 1}
                  y={PAD_T}
                  width={groupW - 2}
                  height={innerH}
                  rx={4}
                  className="fill-accent/60"
                />
              )}
              <rect
                x={cx - barW - 1}
                y={yFor(d.revenue)}
                width={barW}
                height={rH}
                rx={2}
                className="fill-emerald-500"
              />
              <rect
                x={cx + 1}
                y={yFor(d.expenses)}
                width={barW}
                height={eH}
                rx={2}
                className="fill-rose-400"
              />
              {(days.length <= 12 || i % Math.ceil(days.length / 10) === 0) && (
                <text
                  x={cx}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {shortLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && days[hover] && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
          <p className="font-semibold mb-1">{shortLabel(days[hover].date)}</p>
          <p className="text-emerald-600">Revenue: {formatCurrency(days[hover].revenue)}</p>
          <p className="text-rose-500">Expenses: {formatCurrency(days[hover].expenses)}</p>
        </div>
      )}
    </div>
  );
}
