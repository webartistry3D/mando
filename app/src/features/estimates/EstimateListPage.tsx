import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Estimate } from '@/types';
import Pagination, { usePagination } from '@/components/Pagination';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-50 text-blue-700',
  VIEWED: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-orange-50 text-orange-700',
  CONVERTED: 'bg-purple-50 text-purple-700',
};

export default function EstimateListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates', status],
    queryFn: () => api.get<Estimate[]>(`/estimates${status ? `?status=${status}` : ''}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(estimates);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Estimates</h1>
        <button onClick={() => navigate('/estimates/new')} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['', 'DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {s || 'All'}
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
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Total</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((e, i) => (
              <tr
                key={e.id}
                onClick={() => navigate(`/estimates/${e.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{e.number}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{e.customer?.name || 'Unknown'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{formatCurrency(e.total)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(e.issueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {estimates.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No estimates found</p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={estimates.length} setPage={setPage} />
      </div>
    </div>
  );
}
