import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Delivery } from '@/types';
import Pagination, { usePagination } from '@/components/Pagination';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-yellow-50 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function DeliveryListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries', status],
    queryFn: () => api.get<Delivery[]>(`/deliveries${status ? `?status=${status}` : ''}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(deliveries);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Deliveries</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['', 'PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12 whitespace-nowrap">#</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Number</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Customer</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Fee</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((d, i) => (
              <tr
                key={d.id}
                onClick={() => navigate(`/deliveries/${d.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{d.number}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {d.customer?.name || 'Walk-in'}{d.deliveryAddress ? ` · ${d.deliveryAddress}` : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[d.status]}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{formatCurrency(d.deliveryFee)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveries.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No deliveries found</p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={deliveries.length} setPage={setPage} />
      </div>

    </div>
  );
}
