import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Delivery } from '@/types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-yellow-50 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const nextActions: Record<string, { label: string; status: string; color: string }[]> = {
  PENDING: [{ label: 'Start Processing', status: 'PROCESSING', color: 'bg-yellow-600' }],
  PROCESSING: [{ label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY', color: 'bg-blue-600' }],
  OUT_FOR_DELIVERY: [
    { label: 'Delivered', status: 'DELIVERED', color: 'bg-green-600' },
    { label: 'Failed', status: 'FAILED', color: 'bg-red-600' },
  ],
};

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: delivery } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => api.get<Delivery>(`/deliveries/${id}`),
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/deliveries/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery', id] }),
  });

  if (!delivery) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{delivery.number}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[delivery.status]}`}>
              {delivery.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {delivery.customer?.name || 'Walk-in'} · {formatDate(delivery.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {nextActions[delivery.status]?.map((a) => (
            <button
              key={a.status}
              onClick={() => updateStatus.mutate(a.status)}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${a.color}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
        {delivery.deliveryAddress && <p><span className="font-medium">Address:</span> {delivery.deliveryAddress}</p>}
        {delivery.recipientName && <p><span className="font-medium">Recipient:</span> {delivery.recipientName} {delivery.recipientPhone && `(${delivery.recipientPhone})`}</p>}
        {delivery.deliveryFee > 0 && <p><span className="font-medium">Delivery Fee:</span> {formatCurrency(delivery.deliveryFee)}</p>}
        {delivery.assignedPerson && <p><span className="font-medium">Assigned to:</span> {delivery.assignedPerson}</p>}
        {delivery.trackingReference && <p><span className="font-medium">Tracking:</span> {delivery.trackingReference}</p>}
        {delivery.invoice && <p><span className="font-medium">Invoice:</span> <Link to={`/invoices/${delivery.invoice.id}`} className="text-primary underline">{delivery.invoice.number}</Link></p>}
        {delivery.deliveredAt && <p><span className="font-medium">Delivered:</span> {formatDate(delivery.deliveredAt)}</p>}
        {delivery.recipientConfirmation && <p><span className="font-medium">Confirmation:</span> {delivery.recipientConfirmation}</p>}
      </div>

      {delivery.items && delivery.items.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Items</div>
          <div className="divide-y">
            {delivery.items.map((item, i) => (
              <div key={i} className="px-4 py-3 flex justify-between text-sm">
                <span>{item.description}</span>
                <span className="font-medium">{item.quantity}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
