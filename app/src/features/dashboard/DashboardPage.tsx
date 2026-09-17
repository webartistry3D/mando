import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatCompactCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import RevenueChart, { type ChartDay } from './components/RevenueChart';
import DonutChart from './components/DonutChart';
import AssistantPanel from './components/AssistantPanel';
import {
  Plus, FileText, Receipt, TrendingDown, UserPlus, Banknote,
  ArrowUpRight, ArrowDownRight, Clock, Truck, PackageOpen, Package,
  ChevronRight, Wallet, PiggyBank, CreditCard,
} from 'lucide-react';

interface DashboardSummary {
  revenue: { amount: number; count: number };
  expenses: { amount: number; count: number };
  profit: number;
  outstanding: { amount: number; count: number };
  overdueCount: number;
  pendingDeliveries: number;
}

interface Activity {
  type: 'invoice' | 'payment' | 'delivery' | 'expense';
  date: string;
  label: string;
  detail: string;
  amount: number | null;
  link: string;
}

interface OutstandingData {
  invoices: {
    id: string; number: string; customer: string; total: number;
    balanceDue: number; status: string; dueDate: string | null; daysOverdue: number;
  }[];
  totalDue: number;
  overdueCount: number;
}

interface OperationsData {
  pendingEstimates: number;
  activeDeliveries: { id: string; number: string; customer: string; status: string }[];
  lowStock: { id: string; name: string; sku: string | null; stock: number; threshold: number }[];
  recentPayments: { id: string; amount: number; customer: string; invoice: string | null; method: string; date: string }[];
}

type Range = 'today' | '7d' | '30d' | 'custom';

const statusBadge: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  OVERDUE: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusBadge[status] || 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const quickActions = [
  { to: '/invoices/new', icon: Receipt, label: 'New Sale', accent: 'text-emerald-600 bg-emerald-500/10' },
  { to: '/products?new=1', icon: Package, label: 'Product', accent: 'text-sky-600 bg-sky-500/10' },
  { to: '/invoices/new', icon: FileText, label: 'Invoice', accent: 'text-blue-600 bg-blue-500/10' },
  { to: '/estimates/new', icon: FileText, label: 'Estimate', accent: 'text-violet-600 bg-violet-500/10' },
  { to: '/expenses?new=1', icon: TrendingDown, label: 'Expense', accent: 'text-rose-600 bg-rose-500/10' },
  { to: '/customers?new=1', icon: UserPlus, label: 'Customer', accent: 'text-amber-600 bg-amber-500/10' },
];

const EXPENSE_COLORS = ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#6b0d2a', '#4c071d', '#2e0412'];

const activityTypeClasses: Record<Activity['type'], string> = {
  invoice: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  payment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  delivery: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  expense: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['dashboard-expenses-by-category'],
    queryFn: () => api.get<{ name: string; amount: number }[]>('/dashboard/expenses-by-category'),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get<Activity[]>('/dashboard/activity'),
  });

  const { data: outstanding } = useQuery({
    queryKey: ['dashboard-outstanding'],
    queryFn: () => api.get<OutstandingData>('/dashboard/outstanding'),
  });

  const { data: ops } = useQuery({
    queryKey: ['dashboard-operations'],
    queryFn: () => api.get<OperationsData>('/dashboard/operations'),
  });

  const chartQuery = range === 'custom' && customFrom && customTo
    ? `range=custom&from=${customFrom}&to=${customTo}`
    : `range=${range}`;

  const { data: chart } = useQuery({
    queryKey: ['dashboard-chart', chartQuery],
    queryFn: () => api.get<{ days: ChartDay[] }>(`/dashboard/chart?${chartQuery}`),
    enabled: range !== 'custom' || Boolean(customFrom && customTo),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = summary ? [
    { label: 'Revenue', sub: `${summary.revenue.count} payments this month`, value: summary.revenue.amount, icon: Banknote, cls: 'text-emerald-600 bg-emerald-500/10', trend: 'up' as const },
    { label: 'Expenses', sub: `${summary.expenses.count} recorded this month`, value: summary.expenses.amount, icon: CreditCard, cls: 'text-rose-600 bg-rose-500/10', trend: 'down' as const },
    { label: 'Outstanding', sub: `${summary.outstanding.count} unpaid invoices`, value: summary.outstanding.amount, icon: Clock, cls: 'text-amber-600 bg-amber-500/10', trend: 'flat' as const },
    { label: 'Profit', sub: 'Revenue minus expenses', value: summary.profit, icon: PiggyBank, cls: summary.profit >= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10', trend: summary.profit >= 0 ? 'up' as const : 'down' as const },
  ] : [];

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">Here's your business update for today.</p>
      </div>

      {/* 1. KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, sub, value, icon: Icon, cls, trend }) => (
          <div key={label} className="rounded-xl border bg-card p-4 space-y-2 shadow-3d-sm transition-shadow hover:shadow-3d">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
              <span className={`rounded-lg p-1.5 ${cls}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">{formatCompactCurrency(value)}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-500" />}
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* 2. Sales & Expenses chart */}
      <div className="rounded-xl border bg-card shadow-3d">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">Sales &amp; Expenses</span>
            <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Expenses</span>
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            {(['today', '7d', '30d', 'custom'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${range === r ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Custom'}
              </button>
            ))}
          </div>
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border bg-background px-2 py-1" />
            <span className="text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border bg-background px-2 py-1" />
          </div>
        )}
        <div className="p-4">
          {chart && chart.days.length > 0 ? (
            <RevenueChart days={chart.days} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {range === 'custom' && !(customFrom && customTo) ? 'Pick a start and end date' : 'No data for this period'}
            </p>
          )}
        </div>
      </div>

      {/* 2b. Sales & Expenses donut charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sales donut */}
        <div className="rounded-xl border bg-card shadow-3d">
          <div className="border-b px-4 py-3">
            <span className="font-semibold text-sm">Sales Breakdown</span>
          </div>
          <div className="p-4 flex justify-center">
            {summary ? (
              <DonutChart
                title="Sales"
                segments={[
                  { label: 'Revenue', value: summary.revenue.amount, color: '#10b981' },
                  { label: 'Outstanding', value: summary.outstanding.amount, color: '#f59e0b' },
                ]}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        </div>

        {/* Expenses donut */}
        <div className="rounded-xl border bg-card shadow-3d">
          <div className="border-b px-4 py-3">
            <span className="font-semibold text-sm">Expenses by Category</span>
          </div>
          <div className="p-4 flex justify-center">
            {expenseCategories.length > 0 ? (
              <DonutChart
                title="Expenses"
                segments={expenseCategories.map((c, i) => ({
                  label: c.name,
                  value: c.amount,
                  color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
                }))}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No expenses this month</p>
            )}
          </div>
        </div>
      </div>

      {/* 4 + 5. Outstanding & Operations side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Outstanding */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-3d-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-500" /> Outstanding
            </span>
            {outstanding && (
              <span className="text-sm font-bold text-amber-600 font-mono">{formatCurrency(outstanding.totalDue)}</span>
            )}
          </div>
          <div className="divide-y">
            {outstanding?.invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{inv.number} · {inv.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : inv.dueDate ? `Due ${formatDate(inv.dueDate)}` : 'No due date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold font-mono">{formatCurrency(inv.balanceDue)}</p>
                  <Badge status={inv.status} />
                </div>
                <Link
                  to={`/payments?invoice=${inv.id}`}
                  className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 whitespace-nowrap"
                >
                  Record
                </Link>
              </div>
            ))}
            {(!outstanding || outstanding.invoices.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No unpaid invoices</p>
            )}
          </div>
          {outstanding && outstanding.invoices.length > 0 && (
            <Link to="/invoices" className="flex items-center justify-center gap-1 border-t px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50">
              View all invoices <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Operations */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-3d-sm">
          <div className="border-b px-4 py-3 font-semibold text-sm">Operations</div>
          <div className="grid grid-cols-2 gap-px bg-border">
            <Link to="/estimates" className="bg-card p-4 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Pending estimates</div>
              <p className="mt-1 text-2xl font-bold font-mono">{ops?.pendingEstimates ?? '—'}</p>
            </Link>
            <Link to="/deliveries" className="bg-card p-4 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck className="h-3.5 w-3.5" /> Active deliveries</div>
              <p className="mt-1 text-2xl font-bold font-mono">{ops?.activeDeliveries.length ?? '—'}</p>
            </Link>
            <Link to="/products" className="bg-card p-4 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><PackageOpen className="h-3.5 w-3.5" /> Low-stock items</div>
              <p className={`mt-1 text-2xl font-bold font-mono ${ops && ops.lowStock.length > 0 ? 'text-rose-600' : ''}`}>{ops?.lowStock.length ?? '—'}</p>
            </Link>
            <Link to="/payments" className="bg-card p-4 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="h-3.5 w-3.5" /> Recent payments</div>
              <p className="mt-1 text-2xl font-bold font-mono">{ops?.recentPayments.length ?? '—'}</p>
            </Link>
          </div>
          {ops && ops.lowStock.length > 0 && (
            <div className="border-t px-4 py-2.5">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Low stock</p>
              <div className="flex flex-wrap gap-1.5">
                {ops.lowStock.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    {p.name} · {p.stock} left
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent activity table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-3d">
        <div className="border-b px-4 py-3 font-semibold text-sm">Recent Activity</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Transaction</th>
                <th className="px-4 py-2 font-medium">Detail</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activities.slice(0, 10).map((a, i) => (
                <tr key={i} className="hover:bg-accent/30">
                  <td className="px-4 py-2.5">
                    <Link to={a.link} className="font-medium hover:underline">{a.label}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.detail}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${activityTypeClasses[a.type]}`}>
                      {a.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                    {a.amount !== null ? formatCurrency(a.amount) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">{formatDate(a.date)}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Quick actions + Assistant */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3">
            {quickActions.map(({ to, icon: Icon, label, accent }) => (
              <Link
                key={label}
                to={to}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3.5 shadow-3d-sm transition-all hover:shadow-3d hover:-translate-y-0.5"
              >
                <span className={`relative rounded-lg p-2 ${accent}`}>
                  <Icon className="h-5 w-5" />
                  <Plus className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-card" />
                </span>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 7. Assistant */}
        <AssistantPanel />
      </div>
    </div>
  );
}
