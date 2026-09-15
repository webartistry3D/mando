import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

type Tab = 'sales' | 'expenses' | 'profit' | 'products' | 'customers';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const params = new URLSearchParams({ dateFrom, dateTo });

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Date filters */}
      <div className="flex gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <span className="self-center text-muted-foreground text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['sales', 'expenses', 'profit', 'products', 'customers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'sales' && <SalesReport params={params} />}
      {tab === 'expenses' && <ExpenseReport params={params} />}
      {tab === 'profit' && <ProfitReport params={params} />}
      {tab === 'products' && <ProductReport params={params} />}
      {tab === 'customers' && <CustomerReport params={params} />}
    </div>
  );
}

function SalesReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-sales', params.toString()],
    queryFn: () => api.get<{ summary: { invoiceCount: number; totalInvoiced: number; paymentCount: number; totalCollected: number; totalOutstanding: number }; byDay: Array<{ date: string; invoiced: number; collected: number }> }>(`/reports/sales?${params}`),
  });

  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportCard label="Invoices" value={data.summary.invoiceCount} />
        <ReportCard label="Invoiced" value={formatCurrency(data.summary.totalInvoiced)} />
        <ReportCard label="Collected" value={formatCurrency(data.summary.totalCollected)} />
        <ReportCard label="Outstanding" value={formatCurrency(data.summary.totalOutstanding)} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Daily Breakdown</div>
        <div className="divide-y">
          {data.byDay.map((d) => (
            <div key={d.date} className="px-4 py-3 flex justify-between text-sm">
              <span>{formatDate(d.date)}</span>
              <span className="font-mono">Invoiced: {formatCurrency(d.invoiced)} · Collected: {formatCurrency(d.collected)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpenseReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-expenses', params.toString()],
    queryFn: () => api.get<{ summary: { expenseCount: number; total: number }; byCategory: Array<{ category: string; total: number; count: number }> }>(`/reports/expenses?${params}`),
  });

  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ReportCard label="Total Expenses" value={formatCurrency(data.summary.total)} />
        <ReportCard label="Count" value={data.summary.expenseCount} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">By Category</div>
        <div className="divide-y">
          {data.byCategory.map((c) => (
            <div key={c.category} className="px-4 py-3 flex justify-between text-sm">
              <span>{c.category} ({c.count})</span>
              <span className="font-medium font-mono">{formatCurrency(c.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfitReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-profit', params.toString()],
    queryFn: () => api.get<{ summary: { revenue: number; expenses: number; profit: number }; byMonth: Array<{ month: string; revenue: number; expenses: number; profit: number }> }>(`/reports/profit?${params}`),
  });

  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <ReportCard label="Revenue" value={formatCurrency(data.summary.revenue)} color="text-green-600" />
        <ReportCard label="Expenses" value={formatCurrency(data.summary.expenses)} color="text-red-600" />
        <ReportCard label="Profit" value={formatCurrency(data.summary.profit)} color={data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Monthly Breakdown</div>
        <div className="divide-y">
          {data.byMonth.map((m) => (
            <div key={m.month} className="px-4 py-3 flex justify-between text-sm">
              <span>{m.month}</span>
              <span className="font-mono">Rev: {formatCurrency(m.revenue)} · Exp: {formatCurrency(m.expenses)} · Profit: {formatCurrency(m.profit)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-products', params.toString()],
    queryFn: () => api.get<{ products: Array<{ name: string; type: string; quantity: number; revenue: number; cost: number; profit: number }> }>(`/reports/products?${params}`),
  });

  if (!data) return <Loading />;
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Product Performance</div>
      <div className="divide-y">
        {data.products.map((p) => (
          <div key={p.name} className="px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{p.name} <span className="text-xs text-muted-foreground">({p.type})</span></span>
              <span className="font-medium font-mono">{formatCurrency(p.revenue)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Sold: {p.quantity}</span>
              <span className="font-mono">Cost: {formatCurrency(p.cost)} · Profit: {formatCurrency(p.profit)}</span>
            </div>
          </div>
        ))}
        {data.products.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground text-sm">No product data for this period</p>}
      </div>
    </div>
  );
}

function CustomerReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-customers', params.toString()],
    queryFn: () => api.get<{ customers: Array<{ name: string; customerId: string | null; totalPaid: number; count: number }> }>(`/reports/customers?${params}`),
  });

  if (!data) return <Loading />;
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Customer Revenue</div>
      <div className="divide-y">
        {data.customers.map((c) => (
          <div key={c.name} className="px-4 py-3 flex justify-between text-sm">
            <span>{c.name} ({c.count} payments)</span>
            <span className="font-medium font-mono">{formatCurrency(c.totalPaid)}</span>
          </div>
        ))}
        {data.customers.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground text-sm">No customer data for this period</p>}
      </div>
    </div>
  );
}

function ReportCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono ${color || ''}`}>{value}</p>
    </div>
  );
}

function Loading() {
  return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
}
