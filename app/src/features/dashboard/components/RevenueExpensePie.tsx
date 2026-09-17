import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface Props {
  revenue: number;
  expenses: number;
}

/** Simple SVG donut chart showing revenue vs expenses split. */
export default function RevenueExpensePie({ revenue, expenses }: Props) {
  const total = revenue + expenses;
  const revenuePct = total > 0 ? revenue / total : 0;
  const expensesPct = total > 0 ? expenses / total : 0;

  const size = 160;
  const stroke = 28;
  const radius = (size - stroke) / 2;

  function arcPath(startAngle: number, arcAngle: number) {
    const cx = size / 2;
    const cy = size / 2;
    const sx = cx + radius * Math.cos(startAngle);
    const sy = cy + radius * Math.sin(startAngle);
    const ex = cx + radius * Math.cos(startAngle + arcAngle);
    const ey = cy + radius * Math.sin(startAngle + arcAngle);
    if (arcAngle >= 2 * Math.PI - 0.01) {
      const mx = cx + radius * Math.cos(startAngle + Math.PI);
      const my = cy + radius * Math.sin(startAngle + Math.PI);
      return `M ${sx} ${sy} A ${radius} ${radius} 0 1 1 ${mx} ${my} A ${radius} ${radius} 0 1 1 ${sx} ${sy}`;
    }
    const largeArc = arcAngle > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
        />
        {revenuePct > 0 && (
          <motion.path
            d={arcPath(-Math.PI / 2, revenuePct * 2 * Math.PI)}
            fill="none"
            stroke="#10b981"
            strokeWidth={stroke}
            strokeLinecap="butt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.7, ease: 'easeOut' }}
          />
        )}
        {expensesPct > 0 && (
          <motion.path
            d={arcPath(-Math.PI / 2 + revenuePct * 2 * Math.PI, expensesPct * 2 * Math.PI)}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={stroke}
            strokeLinecap="butt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.7, delay: 0.15, ease: 'easeOut' }}
          />
        )}
        {/* Center text */}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
          Total
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-foreground" style={{ fontSize: 13, fontWeight: 700 }}>
          {total > 0 ? formatCurrency(total) : '—'}
        </text>
      </svg>

      {/* Legend */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Revenue</span>
          <span className="ml-auto font-mono font-medium">{formatCurrency(revenue)}</span>
          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(revenuePct * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="text-muted-foreground">Expenses</span>
          <span className="ml-auto font-mono font-medium">{formatCurrency(expenses)}</span>
          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(expensesPct * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
