import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCompactCurrency, formatDate } from '@/lib/utils';
import { exportReportCSV, exportReportPDF } from '@/lib/reportExport';
import Pagination, { usePagination } from '@/components/Pagination';
import { Download, FileText } from 'lucide-react';

type Tab = 'sales' | 'expenses' | 'profit' | 'products' | 'customers' | 'deliveries';

function localISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

const tabQueryKey: Record<Tab, string> = {
  sales: 'report-sales',
  expenses: 'report-expenses',
  profit: 'report-profit',
  products: 'report-products',
  customers: 'report-customers',
  deliveries: 'report-deliveries',
};

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState(localISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [dateTo, setDateTo] = useState(localISODate(new Date()));
  const queryClient = useQueryClient();

  const params = new URLSearchParams({ dateFrom, dateTo });

  function handleExportCSV() {
    const data = queryClient.getQueryData([tabQueryKey[tab], params.toString()]);
    if (data) exportReportCSV(tab, data, dateFrom, dateTo);
  }

  function handleExportPDF() {
    const data = queryClient.getQueryData([tabQueryKey[tab], params.toString()]);
    if (data) exportReportPDF(tab, data, dateFrom, dateTo);
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <span className="self-center text-muted-foreground text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {(['sales', 'expenses', 'profit', 'products', 'customers', 'deliveries'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
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
      {tab === 'deliveries' && <DeliveryReport params={params} />}
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportCard label="Invoices" value={data.summary.invoiceCount} />
        <ReportCard label="Invoiced" value={formatCompactCurrency(data.summary.totalInvoiced)} />
        <ReportCard label="Collected" value={formatCompactCurrency(data.summary.totalCollected)} />
        <ReportCard label="Outstanding" value={formatCompactCurrency(data.summary.totalOutstanding)} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Daily Breakdown</div>
        <div className="divide-y">
          {data.byDay.map((d) => (
            <div key={d.date} className="px-4 py-3 text-sm">
              <div className="flex justify-between items-center">
                <span>{formatDate(d.date)}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Invoiced: <span className="font-mono">{formatCompactCurrency(d.invoiced)}</span></span>
                  <span>Collected: <span className="font-mono">{formatCompactCurrency(d.collected)}</span></span>
                </div>
              </div>
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
        <ReportCard label="Total Expenses" value={formatCompactCurrency(data.summary.total)} />
        <ReportCard label="Count" value={data.summary.expenseCount} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">By Category</div>
        <div className="divide-y">
          {data.byCategory.map((c) => (
            <div key={c.category} className="px-4 py-3 sm:flex sm:justify-between text-sm">
              <span>{c.category} ({c.count})</span>
              <span className="text-muted-foreground sm:text-foreground font-medium font-mono text-xs sm:text-sm">{formatCompactCurrency(c.total)}</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ReportCard label="Revenue" value={formatCompactCurrency(data.summary.revenue)} />
        <ReportCard label="Expenses" value={formatCompactCurrency(data.summary.expenses)} />
        <ReportCard label="Profit" value={formatCompactCurrency(data.summary.profit)} />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-base">Monthly Breakdown</div>
        <div className="divide-y">
          {data.byMonth.map((m) => (
            <div key={m.month} className="px-4 py-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">{m.month}</span>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Rev: <span className="font-mono">{formatCompactCurrency(m.revenue)}</span></span>
                  <span>Exp: <span className="font-mono">{formatCompactCurrency(m.expenses)}</span></span>
                  <span className={m.profit >= 0 ? 'text-green-600' : 'text-red-600'}>Profit: <span className="font-mono">{formatCompactCurrency(m.profit)}</span></span>
                </div>
              </div>
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
    <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
      <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Product Performance</div>
      <div className="divide-y">
        {data.products.map((p) => (
          <div key={p.name} className="px-4 py-3 text-sm">
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium">{p.name} <span className="text-xs text-muted-foreground">({p.type})</span></span>
              <span className="text-right font-medium font-mono whitespace-nowrap">{formatCompactCurrency(p.revenue)}</span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>Sold: <span className="font-mono">{p.quantity}</span></span>
              <span>Cost: <span className="font-mono">{formatCompactCurrency(p.cost)}</span></span>
              <span>Profit: <span className="font-mono">{formatCompactCurrency(p.profit)}</span></span>
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
    <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
      <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Customer Revenue</div>
      <div className="divide-y">
        {data.customers.map((c) => (
          <div key={c.name} className="px-4 py-3 flex justify-between items-start text-sm">
            <span>{c.name} ({c.count} payments)</span>
            <span className="text-right font-medium font-mono text-xs sm:text-sm whitespace-nowrap">{formatCompactCurrency(c.totalPaid)}</span>
          </div>
        ))}
        {data.customers.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground text-sm">No customer data for this period</p>}
      </div>
    </div>
  );
}

function DeliveryReport({ params }: { params: URLSearchParams }) {
  const { data } = useQuery({
    queryKey: ['report-deliveries', params.toString()],
    queryFn: () => api.get<{
      summary: { deliveryCount: number; totalFees: number };
      byStatus: Array<{ status: string; count: number; fees: number }>;
      deliveries: Array<{ id: string; number: string; status: string; deliveryFee: number; customerName: string | null; invoiceNumber: string | null; createdAt: string }>;
    }>(`/reports/deliveries?${params}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(data?.deliveries ?? []);
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ReportCard label="Deliveries" value={data.summary.deliveryCount} />
        <ReportCard label="Total Fees" value={formatCompactCurrency(data.summary.totalFees)} />
      </div>
      {data.byStatus.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">By Status</div>
          <div className="divide-y">
            {data.byStatus.map((s) => (
              <div key={s.status} className="px-4 py-3 flex justify-between items-start text-sm">
                <span className="font-medium">{s.status.replace('_', ' ')} ({s.count})</span>
                <span className="text-right font-mono text-xs sm:text-sm whitespace-nowrap">{formatCompactCurrency(s.fees)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">All Deliveries</div>
        <div className="divide-y">
          {pagedItems.map((d) => (
            <div key={d.id} className="px-4 py-3 text-sm">
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium">{d.number}</span>
                <span className="text-right font-mono whitespace-nowrap">{formatCompactCurrency(d.deliveryFee)}</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{d.status.replace('_', ' ')}</span>
                <span>{formatDate(d.createdAt)}</span>
              </div>
              {(d.customerName || d.invoiceNumber) && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {d.customerName && <span>{d.customerName}</span>}
                  {d.customerName && d.invoiceNumber && <span> · </span>}
                  {d.invoiceNumber && <span>Invoice {d.invoiceNumber}</span>}
                </div>
              )}
            </div>
          ))}
          {data.deliveries.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground text-sm">No deliveries for this period</p>}
        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={data.deliveries.length} setPage={setPage} />
      </div>
    </div>
  );
}

function ReportCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-3d-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl sm:text-4xl font-bold font-mono ${color || ''}`}>{value}</p>
    </div>
  );
}

function Loading() {
  return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
}
