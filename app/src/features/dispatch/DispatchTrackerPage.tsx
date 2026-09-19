import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCompactCurrency, formatCurrency, formatDate } from '@/lib/utils';
import type { Delivery } from '@/types';
import Pagination, { usePagination } from '@/components/Pagination';
import { Clock3, MapPinned, PackageCheck, Search, Truck } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-yellow-50 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function DispatchTrackerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const { data: deliveries = [] } = useQuery({
    queryKey: ['dispatch-deliveries', status],
    queryFn: () => api.get<Delivery[]>(`/deliveries${status ? `?status=${status}` : ''}`),
  });

  const filteredDeliveries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return deliveries;

    return deliveries.filter((delivery) => {
      const haystack = [
        delivery.number,
        delivery.customer?.name,
        delivery.deliveryAddress,
        delivery.recipientName,
        delivery.assignedPerson,
        delivery.trackingReference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [deliveries, query]);

  const { page, totalPages, pagedItems, setPage } = usePagination(filteredDeliveries);

  const summary = useMemo(() => {
    const active = filteredDeliveries.filter((d) => ['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY'].includes(d.status));
    const delivered = filteredDeliveries.filter((d) => d.status === 'DELIVERED');
    const failed = filteredDeliveries.filter((d) => ['FAILED', 'CANCELLED'].includes(d.status));
    const value = filteredDeliveries.reduce((sum, d) => sum + Number(d.deliveryFee || 0), 0);

    return [
      { label: 'Total', value: String(filteredDeliveries.length), icon: Truck, accent: 'bg-blue-500/10 text-blue-600' },
      { label: 'In transit', value: String(active.length), icon: Clock3, accent: 'bg-amber-500/10 text-amber-600' },
      { label: 'Delivered', value: String(delivered.length), icon: PackageCheck, accent: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'Value', value: formatCompactCurrency(value), icon: MapPinned, accent: 'bg-violet-500/10 text-violet-600' },
      { label: 'Failed', value: String(failed.length), icon: Search, accent: 'bg-rose-500/10 text-rose-600' },
    ];
  }, [filteredDeliveries]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deliveries</h1>
          {/*<p className="text-sm text-muted-foreground">Track active and completed deliveries across the operation.</p>  */}
        </div>
        <button
          onClick={() => navigate('/deliveries?new=1')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + New
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {summary.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border bg-card p-4 shadow-3d-sm"
          >
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-3d-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search delivery, customer, address, tracking..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {['', 'OUT FOR DELIVERY', 'DELIVERED', 'FAILED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12 whitespace-nowrap">#</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Number</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Customer</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Address</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Assigned</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Fee</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Tracking</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((delivery, index) => (
              <tr
                key={delivery.id}
                onClick={() => navigate(`/deliveries/${delivery.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + index + 1}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{delivery.number}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{delivery.customer?.name || 'Walk-in'}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{delivery.deliveryAddress || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{delivery.assignedPerson || 'Unassigned'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[delivery.status]}`}>
                    {delivery.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{formatCurrency(delivery.deliveryFee || 0)}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{delivery.trackingReference || '—'}</td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(delivery.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDeliveries.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No dispatch records found.</p>
        )}

        <Pagination page={page} totalPages={totalPages} totalItems={filteredDeliveries.length} setPage={setPage} />
      </div>
    </div>
  );
}
