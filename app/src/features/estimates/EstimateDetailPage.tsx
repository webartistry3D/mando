import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateEstimatePDF } from '@/lib/pdf';
import type { Estimate, Business } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-50 text-blue-700',
  VIEWED: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-orange-50 text-orange-700',
  CONVERTED: 'bg-purple-50 text-purple-700',
};

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: estimate } = useQuery({
    queryKey: ['estimate', id],
    queryFn: () => api.get<Estimate>(`/estimates/${id}`),
    enabled: !!id,
  });

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<Business>('/business'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/estimates/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estimate', id] }),
  });

  const convertToInvoice = useMutation({
    mutationFn: () => api.post(`/estimates/${id}/convert`, {}),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      navigate(`/invoices/${(invoice as { id: string }).id}`);
    },
  });

  if (!estimate) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const isDraft = estimate.status === 'DRAFT';
  const isAccepted = estimate.status === 'ACCEPTED';
  const canConvert = isAccepted && !(estimate.invoices && estimate.invoices.length > 0);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{estimate.number}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[estimate.status]}`}>
              {estimate.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {estimate.customer?.name} · {formatDate(estimate.issueDate)}
            {estimate.expiryDate && ` · Expires ${formatDate(estimate.expiryDate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => business && estimate && generateEstimatePDF(estimate, business)}
            className="rounded-md border px-3 py-2 text-sm font-medium"
          >
            Download PDF
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Estimate ${estimate.number}\nTotal: ₦${Number(estimate.total).toLocaleString()}\n${estimate.customer?.name || ''}\n${estimate.expiryDate ? `Valid until ${formatDate(estimate.expiryDate)}` : ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
          >
            WhatsApp
          </a>
          {isDraft && (
            <button onClick={() => updateStatus.mutate('SENT')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Mark Sent
            </button>
          )}
          {estimate.status === 'SENT' && (
            <>
              <button onClick={() => updateStatus.mutate('ACCEPTED')} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white">
                Accept
              </button>
              <button onClick={() => updateStatus.mutate('REJECTED')} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white">
                Reject
              </button>
            </>
          )}
          {canConvert && (
            <button onClick={() => convertToInvoice.mutate()} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white">
              Convert to Invoice
            </button>
          )}
        </div>
      </div>

      {estimate.invoices && estimate.invoices.length > 0 && (
        <div className="rounded-md bg-purple-50 p-3 text-sm text-purple-700">
          Converted to invoice: {estimate.invoices.map((i) => (
            <a key={i.id} href={`/invoices/${i.id}`} className="font-medium underline">{i.number}</a>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Items</div>
        <div className="divide-y">
          {estimate.items?.map((item, i) => (
            <div key={i} className="px-4 py-3 flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(item.lineTotal ?? (item.quantity * item.unitPrice - item.discount + item.tax))}</p>
                {(item.discount > 0 || item.tax > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {item.discount > 0 && `-${formatCurrency(item.discount)} `}
                    {item.tax > 0 && `+${formatCurrency(item.tax)}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(estimate.subtotal)}</span></div>
          {estimate.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(estimate.discount)}</span></div>}
          {estimate.tax > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>+{formatCurrency(estimate.tax)}</span></div>}
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(estimate.total)}</span></div>
        </div>
      </div>

      {estimate.notes && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground">{estimate.notes}</p>
        </div>
      )}
      {estimate.terms && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Terms</h2>
          <p className="text-sm text-muted-foreground">{estimate.terms}</p>
        </div>
      )}
    </div>
  );
}
