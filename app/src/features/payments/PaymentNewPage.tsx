import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, Customer } from '@/types';

export default function PaymentNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers?active=true'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', 'unpaid'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=ISSUED'),
  });
  const { data: partialInvoices = [] } = useQuery({
    queryKey: ['invoices', 'partial'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=PARTIALLY_PAID'),
  });
  const { data: overdueInvoices = [] } = useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=OVERDUE'),
  });

  const unpaidInvoices = [...invoices, ...partialInvoices, ...overdueInvoices];

  const [searchParams] = useSearchParams();
  const preselectInvoice = searchParams.get('invoice') || '';

  const [form, setForm] = useState({
    invoiceId: preselectInvoice,
    customerId: '',
    amount: 0,
    paymentMethod: 'BANK_TRANSFER' as const,
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: '',
  });

  // Pre-fill amount with the invoice balance when preselected or picked
  useEffect(() => {
    const inv = unpaidInvoices.find((i) => i.id === form.invoiceId);
    if (inv && form.amount <= 0) {
      setForm((prev) => ({ ...prev, amount: Number(inv.balanceDue) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.invoiceId, unpaidInvoices.length]);

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/payments', {
      ...data,
      invoiceId: data.invoiceId || undefined,
      customerId: data.customerId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/payments');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to record'),
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.amount <= 0) return setError('Enter a valid amount');
    create.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Record Payment</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Invoice (optional)</label>
            <select value={form.invoiceId} onChange={(e) => update('invoiceId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
              <option value="">Standalone income</option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} — <span className="font-mono">{formatCurrency(inv.balanceDue)}</span> due
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Customer (optional)</label>
            <select value={form.customerId} onChange={(e) => update('customerId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
              <option value="">No customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Amount (₦) *</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => update('amount', Number(e.target.value))} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Payment Method *</label>
              <select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as typeof form.paymentMethod)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="POS">POS</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <input type="date" value={form.paymentDate} onChange={(e) => update('paymentDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Reference</label>
            <input type="text" value={form.reference} onChange={(e) => update('reference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="Transfer ref, cheque no..." />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="What is this payment for?" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Recording...' : 'Record Payment'}
          </button>
          <button type="button" onClick={() => navigate('/payments')} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}
