import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
}

export default function ExpenseNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get<Category[]>('/expenses/categories'),
  });

  const [form, setForm] = useState({
    categoryId: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: '' as '' | 'BANK_TRANSFER' | 'POS' | 'CASH' | 'CARD' | 'OTHER',
    reference: '',
    notes: '',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/expenses', {
      ...data,
      paymentMethod: data.paymentMethod || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigate('/expenses');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to record'),
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.categoryId) return setError('Select a category');
    if (!form.description) return setError('Enter a description');
    if (form.amount <= 0) return setError('Enter a valid amount');
    create.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">New Expense</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Category *</label>
            <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
              <option value="">Select...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="What was this expense for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Amount (₦) *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => update('amount', Number(e.target.value))} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Vendor</label>
            <input type="text" value={form.vendor} onChange={(e) => update('vendor', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as typeof form.paymentMethod)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
              <option value="">Select...</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Reference</label>
            <input type="text" value={form.reference} onChange={(e) => update('reference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Recording...' : 'Record Expense'}
          </button>
          <button type="button" onClick={() => navigate('/expenses')} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}
