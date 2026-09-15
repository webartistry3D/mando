import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo],
    queryFn: () => api.get<{ expenses: Expense[]; total: number }>(`/expenses?${params.toString()}`),
  });

  const expenses = data?.expenses ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link to="/expenses/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New Expense
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="To" />
      </div>

      <div className="rounded-lg border bg-card p-4 mb-4">
        <p className="text-sm text-muted-foreground">Total Expenses</p>
        <p className="text-2xl font-bold font-mono">{formatCurrency(total)}</p>
      </div>

      <div className="space-y-2">
        {expenses.map((e) => (
          <div key={e.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{e.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {e.category.name}{e.vendor ? ` · ${e.vendor}` : ''}{e.paymentMethod ? ` · ${e.paymentMethod.replace('_', ' ')}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg font-mono">{formatCurrency(e.amount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
              </div>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No expenses found</p>
        )}
      </div>
    </div>
  );
}
