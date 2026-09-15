import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Customer } from '@/types';

interface CustomerDetail extends Customer {
  estimates?: Array<{ id: string; number: string; status: string; total: number; createdAt: string }>;
  invoices?: Array<{ id: string; number: string; status: string; total: number; balanceDue: number; createdAt: string }>;
  payments?: Array<{ id: string; amount: number; paymentMethod: string; paymentDate: string }>;
  deliveries?: Array<{ id: string; number: string; status: string; createdAt: string }>;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get<CustomerDetail>(`/customers/${id}`),
    enabled: !!id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['customer-transactions', id],
    queryFn: () => api.get<{
      estimates: Array<{ id: string; number: string; status: string; total: number; createdAt: string }>;
      invoices: Array<{ id: string; number: string; status: string; total: number; balanceDue: number; createdAt: string }>;
      payments: Array<{ id: string; amount: number; paymentMethod: string; paymentDate: string }>;
      deliveries: Array<{ id: string; number: string; status: string; createdAt: string }>;
      summary: { totalInvoiced: number; totalPaid: number; outstanding: number };
    }>(`/customers/${id}/transactions`),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: '',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        customerType: customer.customerType || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const updateCustomer = useMutation({
    mutationFn: (data: typeof form) => api.patch(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setIsEditing(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Update failed'),
  });

  const deactivate = useMutation({
    mutationFn: () => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to deactivate'),
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    updateCustomer.mutate(form);
  }

  if (!customer) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Edit
              </button>
              {customer.isActive && (
                <button
                  onClick={() => deactivate.mutate()}
                  className="rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive"
                >
                  Deactivate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!customer.isActive && (
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          This customer is inactive.
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold">Edit Customer</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Type</label>
              <select value={form.customerType} onChange={(e) => update('customerType', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select...</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={3} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={updateCustomer.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {updateCustomer.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-md border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-sm"><span className="font-medium">Phone:</span> {customer.phone || '—'}</p>
          <p className="text-sm"><span className="font-medium">Email:</span> {customer.email || '—'}</p>
          <p className="text-sm"><span className="font-medium">Address:</span> {customer.address || '—'}</p>
          <p className="text-sm"><span className="font-medium">Type:</span> {customer.customerType || '—'}</p>
          {customer.notes && <p className="text-sm"><span className="font-medium">Notes:</span> {customer.notes}</p>}
        </div>
      )}

      {transactions && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Invoiced</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(transactions.summary.totalInvoiced)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(transactions.summary.totalPaid)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(transactions.summary.outstanding)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {transactions.invoices.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Invoices</div>
                <div className="divide-y">
                  {transactions.invoices.map((i) => (
                    <div key={i.id} className="px-4 py-3 flex justify-between text-sm">
                      <span>{i.number}</span>
                      <span className="font-medium font-mono">{formatCurrency(i.total)}</span>
                      <span className={i.status === 'PAID' ? 'text-green-600' : i.status === 'OVERDUE' ? 'text-destructive' : 'text-muted-foreground'}>{i.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transactions.payments.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Payments</div>
                <div className="divide-y">
                  {transactions.payments.map((p) => (
                    <div key={p.id} className="px-4 py-3 flex justify-between text-sm">
                      <span className="font-mono">{formatCurrency(p.amount)}</span>
                      <span className="text-muted-foreground">{p.paymentMethod}</span>
                      <span className="text-muted-foreground">{formatDate(p.paymentDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transactions.deliveries.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Deliveries</div>
                <div className="divide-y">
                  {transactions.deliveries.map((d) => (
                    <div key={d.id} className="px-4 py-3 flex justify-between text-sm">
                      <span>{d.number}</span>
                      <span className="text-muted-foreground">{d.status}</span>
                      <span className="text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
