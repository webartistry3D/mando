import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

export default function DeliveryListPage() {
  const [status, setStatus] = useState('');
  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries', status],
    queryFn: () => api.get<Delivery[]>(`/deliveries${status ? `?status=${status}` : ''}`),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Deliveries</h1>
        <Link to="/deliveries/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New Delivery
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['', 'PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {deliveries.map((d) => (
          <Link key={d.id} to={`/deliveries/${d.id}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{d.number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status]}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {d.customer?.name || 'Walk-in'}{d.deliveryAddress ? ` · ${d.deliveryAddress}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(d.deliveryFee)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
            </div>
          </Link>
        ))}
        {deliveries.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No deliveries found</p>
        )}
      </div>
    </div>
  );
}
