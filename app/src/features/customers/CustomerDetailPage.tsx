import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import type { Customer } from '@/types';
import EditCustomerModal from './EditCustomerModal';

interface CustomerDetail extends Customer {
  estimates?: Array<{ id: string; number: string; status: string; total: number; createdAt: string }>;
  invoices?: Array<{ id: string; number: string; status: string; total: number; balanceDue: number; createdAt: string }>;
  payments?: Array<{ id: string; amount: number; paymentMethod: string; paymentDate: string }>;
  deliveries?: Array<{ id: string; number: string; status: string; createdAt: string }>;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const deactivate = useMutation({
    mutationFn: () => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to deactivate'),
  });

  if (!customer) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Back to customers"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={() => setIsEditOpen(true)}
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
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!customer.isActive && (
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          This customer is inactive.
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-3d-sm overflow-x-auto">
        <table className="w-full min-w-[300px] text-sm">
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-2.5 w-1/3 font-medium text-muted-foreground">Phone</td>
              <td className="px-4 py-2.5">{customer.phone || '—'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 w-1/3 font-medium text-muted-foreground">Email</td>
              <td className="px-4 py-2.5">{customer.email || '—'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 w-1/3 font-medium text-muted-foreground">Address</td>
              <td className="px-4 py-2.5">{customer.address || '—'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 w-1/3 font-medium text-muted-foreground">Type</td>
              <td className="px-4 py-2.5">{customer.customerType || '—'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 w-1/3 font-medium text-muted-foreground">Notes</td>
              <td className="px-4 py-2.5">{customer.notes || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EditCustomerModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={customer || null}
        customerId={id || ''}
      />

      {transactions && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
              <p className="text-sm text-muted-foreground">Invoiced</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono">{formatCurrency(transactions.summary.totalInvoiced)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono">{formatCurrency(transactions.summary.totalPaid)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono">{formatCurrency(transactions.summary.outstanding)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {transactions.invoices.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
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
              <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
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
              <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
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
