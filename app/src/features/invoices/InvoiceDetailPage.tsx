import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });

  const issue = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/issue`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/invoices/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const recordPayment = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string }) =>
      api.post('/payments', { ...data, invoiceId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const isDraft = invoice.status === 'DRAFT';
  const canPay = ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);
  const canCancel = ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.number}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[invoice.status]}`}>
              {invoice.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {invoice.customer?.name || 'Walk-in'} · {formatDate(invoice.issueDate)}
            {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <button onClick={() => issue.mutate()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Issue Invoice
            </button>
          )}
          {canPay && (
            <button
              onClick={() => recordPayment.mutate({ amount: invoice.balanceDue, paymentMethod: 'BANK_TRANSFER' })}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Record Payment
            </button>
          )}
          {canCancel && (
            <button onClick={() => updateStatus.mutate('CANCELLED')} className="rounded-md border px-4 py-2 text-sm font-medium text-destructive">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Payment summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{formatCurrency(invoice.total)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.amountPaid)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Balance Due</p>
          <p className={`text-lg font-bold ${invoice.balanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(invoice.balanceDue)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Items</div>
        <div className="divide-y">
          {invoice.items?.map((item, i) => (
            <div key={i} className="px-4 py-3 flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="font-medium">{formatCurrency(item.lineTotal ?? (item.quantity * item.unitPrice - item.discount + item.tax))}</p>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          {invoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(invoice.discount)}</span></div>}
          {invoice.tax > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>+{formatCurrency(invoice.tax)}</span></div>}
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Payments</div>
          <div className="divide-y">
            {invoice.payments.map((p) => (
              <div key={p.id} className="px-4 py-3 flex justify-between text-sm">
                <div>
                  <p className="font-medium">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{p.paymentMethod.replace('_', ' ')}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.paymentInstructions && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Payment Instructions</h2>
          <p className="text-sm text-muted-foreground">{invoice.paymentInstructions}</p>
        </div>
      )}
      {invoice.notes && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
