import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';

export default function PaymentListPage() {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get<Payment[]>('/payments'),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link to="/payments/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + Record Payment
        </Link>
      </div>

      <div className="space-y-2">
        {payments.map((p) => (
          <Link key={p.id} to={`/payments/${p.id}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-mono">{formatCurrency(p.amount)}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {p.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.invoice?.number ? `Invoice ${p.invoice.number}` : 'Standalone income'}
                  {p.customer?.name ? ` · ${p.customer.name}` : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
            </div>
          </Link>
        ))}
        {payments.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No payments recorded yet</p>
        )}
      </div>
    </div>
  );
}
