import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCompactCurrency, formatDate } from '@/lib/utils';
import Pagination, { usePagination } from '@/components/Pagination';

function localISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

interface TaxInvoice {
  id: string;
  number: string;
  customerName: string | null;
  tax: number;
  taxRemitted: number;
  taxRemittedAt: string | null;
  outstanding: number;
  issueDate: string;
}

interface TaxReport {
  summary: { taxCollected: number; taxRemitted: number; taxOutstanding: number };
  byMonth: Array<{ month: string; collected: number; remitted: number; outstanding: number }>;
  invoices: TaxInvoice[];
}

export default function TaxPage() {
  const [dateFrom, setDateFrom] = useState(localISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [dateTo, setDateTo] = useState(localISODate(new Date()));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const params = new URLSearchParams({ dateFrom, dateTo });

  const { data } = useQuery({
    queryKey: ['tax-report', params.toString()],
    queryFn: () => api.get<TaxReport>(`/reports/tax?${params}`),
  });

  const remitMutation = useMutation({
    mutationFn: (invoiceIds: string[]) => api.post('/reports/tax/remit', { invoiceIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-report'] });
      setSelected(new Set());
    },
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function remitSelected() {
    if (selected.size === 0) return;
    remitMutation.mutate([...selected]);
  }

  function remitMonth(month: string) {
    if (!data) return;
    const ids = data.invoices
      .filter((i) => i.issueDate.startsWith(month) && i.outstanding > 0)
      .map((i) => i.id);
    if (ids.length === 0) return;
    remitMutation.mutate(ids);
  }

  const { page, totalPages, pagedItems, setPage } = usePagination(data?.invoices ?? []);

  if (!data) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Tax</h1>

      {/* Date filters */}
      <div className="flex gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <span className="self-center text-muted-foreground text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Tax Collected" value={formatCompactCurrency(data.summary.taxCollected)} />
        <KpiCard label="Tax Remitted" value={formatCompactCurrency(data.summary.taxRemitted)} />
        <KpiCard label="Tax Outstanding" value={formatCompactCurrency(data.summary.taxOutstanding)} />
      </div>

      {/* Monthly breakdown */}
      {data.byMonth.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-base">Monthly Breakdown</div>
          <div className="divide-y">
            {data.byMonth.map((m) => (
              <div key={m.month} className="px-4 py-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">{m.month}</span>
                  {m.outstanding > 0 && (
                    <button
                      onClick={() => remitMonth(m.month)}
                      disabled={remitMutation.isPending}
                      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      Mark All Remitted
                    </button>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <span>Collected: <span className="font-mono">{formatCompactCurrency(m.collected)}</span></span>
                  <span>Remitted: <span className="font-mono">{formatCompactCurrency(m.remitted)}</span></span>
                  <span className={m.outstanding > 0 ? 'text-orange-600' : 'text-green-600'}>
                    Outstanding: <span className="font-mono">{formatCompactCurrency(m.outstanding)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm flex items-center justify-between">
          <span>Invoices</span>
          {selected.size > 0 && (
            <button
              onClick={remitSelected}
              disabled={remitMutation.isPending}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              Remit Selected ({selected.size})
            </button>
          )}
        </div>
        <div className="divide-y">
          {pagedItems.map((inv) => (
            <div key={inv.id} className="px-4 py-3 text-sm flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(inv.id)}
                onChange={() => toggleSelect(inv.id)}
                disabled={inv.outstanding <= 0}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium whitespace-nowrap">{inv.number}</span>
                  <span className="text-right font-mono whitespace-nowrap">{formatCompactCurrency(inv.tax)}</span>
                </div>
                <div className="mt-0.5 flex justify-between items-start gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{inv.customerName || '—'} · {formatDate(inv.issueDate)}</span>
                  <span className={`whitespace-nowrap ${inv.outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {inv.outstanding > 0 ? 'Not Remitted' : 'Remitted'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {data.invoices.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground text-sm">No tax data for this period</p>}
        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={data.invoices.length} setPage={setPage} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-3d-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl sm:text-4xl font-bold font-mono">{value}</p>
    </div>
  );
}
