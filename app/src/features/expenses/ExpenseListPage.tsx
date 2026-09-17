import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import NewExpenseModal from './NewExpenseModal';
import Pagination, { usePagination } from '@/components/Pagination';
import { Plus } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  category: { id: string; name: string };
}

export default function ExpenseListPage() {
  const [searchParams] = useSearchParams();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === '1');

  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo],
    queryFn: () => api.get<{ expenses: Expense[]; total: number }>(`/expenses?${params.toString()}`),
  });

  const expenses = data?.expenses ?? [];
  const total = data?.total ?? 0;

  const { page, totalPages, pagedItems, setPage } = usePagination(expenses);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="flex items-stretch gap-3 mb-4">
        <div className="rounded-lg border bg-card p-4 shadow-3d-sm w-64">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-3xl sm:text-4xl font-bold font-mono">{formatCurrency(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12">#</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Vendor</th>
              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              <th className="px-4 py-2.5 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((e, i) => (
              <tr key={e.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium">{e.description}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    {e.category.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.vendor || '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No expenses found</p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={expenses.length} setPage={setPage} />
      </div>

      <NewExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
