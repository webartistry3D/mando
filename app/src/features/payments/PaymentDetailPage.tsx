import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import type { Payment } from '@/types';

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: payment } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.get<Payment>(`/payments/${id}`),
    enabled: !!id,
  });

  if (!payment) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/payments')}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Back to payments"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Payment Details</h1>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-3d-sm">
        <div className="flex justify-between items-center">
          <span className="text-3xl font-bold font-mono">{formatCurrency(payment.amount)}</span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {payment.paymentMethod.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2 text-sm shadow-3d-sm">
        {payment.invoice && (
          <p><span className="font-medium">Invoice:</span> <Link to={`/invoices/${payment.invoice.id}`} className="text-primary underline">{payment.invoice.number}</Link> (<span className="font-mono">{formatCurrency(payment.invoice.total)}</span>)</p>
        )}
        {payment.customer && (
          <p><span className="font-medium">Customer:</span> {payment.customer.name}</p>
        )}
        {payment.reference && (
          <p><span className="font-medium">Reference:</span> {payment.reference}</p>
        )}
        {payment.description && (
          <p><span className="font-medium">Description:</span> {payment.description}</p>
        )}
        {payment.notes && (
          <p><span className="font-medium">Notes:</span> {payment.notes}</p>
        )}
      </div>
    </div>
  );
}
