import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

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
  link: string;
}

const activityIcons: Record<string, string> = {
  invoice: '🧾',
  payment: '💰',
  delivery: '🚚',
  expense: '📉',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get<Activity[]>('/dashboard/activity'),
  });

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back{user?.name ? `, ${user.name}` : ''}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <Link to="/invoices/new" className="rounded-lg border bg-card p-3 text-center hover:bg-accent/50 transition-colors">
          <p className="text-xl mb-1">🧾</p>
          <p className="text-xs font-medium">Invoice</p>
        </Link>
        <Link to="/estimates/new" className="rounded-lg border bg-card p-3 text-center hover:bg-accent/50 transition-colors">
          <p className="text-xl mb-1">📄</p>
          <p className="text-xs font-medium">Estimate</p>
        </Link>
        <Link to="/payments/new" className="rounded-lg border bg-card p-3 text-center hover:bg-accent/50 transition-colors">
          <p className="text-xl mb-1">💰</p>
          <p className="text-xs font-medium">Payment</p>
        </Link>
        <Link to="/expenses/new" className="rounded-lg border bg-card p-3 text-center hover:bg-accent/50 transition-colors">
          <p className="text-xl mb-1">📉</p>
          <p className="text-xs font-medium">Expense</p>
        </Link>
        <Link to="/deliveries/new" className="rounded-lg border bg-card p-3 text-center hover:bg-accent/50 transition-colors">
          <p className="text-xl mb-1">🚚</p>
          <p className="text-xs font-medium">Delivery</p>
        </Link>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Revenue (Month)</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.revenue.amount)}</p>
            <p className="text-xs text-muted-foreground">{summary.revenue.count} payments</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Expenses (Month)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.expenses.amount)}</p>
            <p className="text-xs text-muted-foreground">{summary.expenses.count} expenses</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Profit</p>
            <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.profit)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(summary.outstanding.amount)}</p>
            <p className="text-xs text-muted-foreground">{summary.outstanding.count} invoices</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className={`text-xl font-bold ${summary.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.overdueCount}
            </p>
            <p className="text-xs text-muted-foreground">invoices</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Deliveries</p>
            <p className="text-xl font-bold">{summary.pendingDeliveries}</p>
            <p className="text-xs text-muted-foreground">pending</p>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Recent Activity</div>
        <div className="divide-y">
          {activities.map((a, i) => (
            <Link key={i} to={a.link} className="px-4 py-3 flex items-center gap-3 text-sm hover:bg-accent/30">
              <span className="text-lg">{activityIcons[a.type] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.date)}</p>
            </Link>
          ))}
          {activities.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
