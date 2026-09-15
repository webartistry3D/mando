import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Customer, Invoice } from '@/types';

export default function DeliveryNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers?active=true'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get<Invoice[]>('/invoices'),
  });

  const [form, setForm] = useState({
    invoiceId: '',
    customerId: '',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    deliveryFee: 0,
    assignedPerson: '',
    trackingReference: '',
    notes: '',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/deliveries', {
      ...data,
      invoiceId: data.invoiceId || undefined,
      customerId: data.customerId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      navigate('/deliveries');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    create.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">New Delivery</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Invoice (optional)</label>
            <select value={form.invoiceId} onChange={(e) => update('invoiceId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
              <option value="">No invoice</option>
              {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.number}</option>)}
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
            <label className="text-sm font-medium">Delivery Address</label>
            <input type="text" value={form.deliveryAddress} onChange={(e) => update('deliveryAddress', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Recipient Name</label>
              <input type="text" value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Recipient Phone</label>
              <input type="tel" value={form.recipientPhone} onChange={(e) => update('recipientPhone', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Delivery Fee (₦)</label>
              <input type="number" step="0.01" min="0" value={form.deliveryFee} onChange={(e) => update('deliveryFee', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Assigned Person</label>
              <input type="text" value={form.assignedPerson} onChange={(e) => update('assignedPerson', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Tracking Reference</label>
            <input type="text" value={form.trackingReference} onChange={(e) => update('trackingReference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create Delivery'}
          </button>
          <button type="button" onClick={() => navigate('/deliveries')} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}
