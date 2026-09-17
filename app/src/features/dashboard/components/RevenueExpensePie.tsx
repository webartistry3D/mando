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
  const circumference = 2 * Math.PI * radius;

  // Revenue arc
  const revenueLen = circumference * revenuePct;
  // Expenses arc starts where revenue ends
  const expensesLen = circumference * expensesPct;

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
        {/* Revenue arc (emerald) */}
        {revenuePct > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={stroke}
            initial={{ strokeDasharray: [0, circumference] }}
            animate={{ strokeDasharray: [revenueLen, circumference - revenueLen] }}
            transition={{ duration: 2.7, ease: 'easeOut' }}
            strokeDashoffset={0}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        )}
        {/* Expenses arc (rose) */}
        {expensesPct > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={stroke}
            initial={{ strokeDasharray: [0, circumference] }}
            animate={{ strokeDasharray: [expensesLen, circumference - expensesLen] }}
            transition={{ duration: 2.7, delay: 0.15, ease: 'easeOut' }}
            strokeDashoffset={-revenueLen}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
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
