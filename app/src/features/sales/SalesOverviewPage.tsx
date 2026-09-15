import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface SalesOverview {
  recentEstimates: Array<{ id: string; number: string; status: string; total: number; createdAt: string; customer?: { name: string } | null }>;
  recentInvoices: Array<{ id: string; number: string; status: string; total: number; balanceDue: number; createdAt: string; customer?: { name: string } | null }>;
  recentPayments: Array<{ id: string; amount: number; paymentMethod: string; paymentDate: string; customer?: { name: string } | null; invoice?: { number: string } | null }>;
  outstandingInvoices: { count: number; total: number };
  summary: { monthRevenue: number; monthExpenses: number; monthProfit: number };
}

export default function SalesOverviewPage() {
  const { data } = useQuery({
    queryKey: ['sales-overview'],
    queryFn: () => api.get<SalesOverview>('/sales/overview'),
  });

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Sales Overview</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link to="/estimates/new" className="rounded-lg border bg-card p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-2xl mb-1">📄</p>
          <p className="text-sm font-medium">New Estimate</p>
        </Link>
        <Link to="/invoices/new" className="rounded-lg border bg-card p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-2xl mb-1">🧾</p>
          <p className="text-sm font-medium">New Invoice</p>
        </Link>
        <Link to="/payments/new" className="rounded-lg border bg-card p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-sm font-medium">Record Payment</p>
        </Link>
        <Link to="/deliveries/new" className="rounded-lg border bg-card p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-2xl mb-1">🚚</p>
          <p className="text-sm font-medium">New Delivery</p>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">This Month Revenue</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(data.summary.monthRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">This Month Expenses</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(data.summary.monthExpenses)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(data.outstandingInvoices.total)}</p>
          <p className="text-xs text-muted-foreground">{data.outstandingInvoices.count} invoices</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Profit</p>
          <p className={`text-lg font-bold ${data.summary.monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.summary.monthProfit)}
          </p>
        </div>
      </div>

      {/* Recent estimates */}
      {data.recentEstimates.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Recent Estimates</div>
          <div className="divide-y">
            {data.recentEstimates.map((e) => (
              <Link key={e.id} to={`/estimates/${e.id}`} className="px-4 py-3 flex justify-between text-sm hover:bg-accent/30">
                <span>{e.number} — {e.customer?.name || 'Unknown'}</span>
                <span className="font-medium">{formatCurrency(e.total)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      {data.recentInvoices.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Recent Invoices</div>
          <div className="divide-y">
            {data.recentInvoices.map((i) => (
              <Link key={i.id} to={`/invoices/${i.id}`} className="px-4 py-3 flex justify-between text-sm hover:bg-accent/30">
                <span>{i.number} — {i.customer?.name || 'Walk-in'}</span>
                <span className={`font-medium ${i.balanceDue > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {i.balanceDue > 0 ? `${formatCurrency(i.balanceDue)} due` : 'Paid'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {data.recentPayments.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Recent Payments</div>
          <div className="divide-y">
            {data.recentPayments.map((p) => (
              <Link key={p.id} to={`/payments/${p.id}`} className="px-4 py-3 flex justify-between text-sm hover:bg-accent/30">
                <span>{p.invoice?.number || 'Standalone'} — {p.customer?.name || 'Walk-in'}</span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
