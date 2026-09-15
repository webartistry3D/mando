import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Estimate } from '@/types';

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
  const [status, setStatus] = useState('');
  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates', status],
    queryFn: () => api.get<Estimate[]>(`/estimates${status ? `?status=${status}` : ''}`),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Estimates</h1>
        <Link to="/estimates/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New Estimate
        </Link>
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

      <div className="space-y-2">
        {estimates.map((e) => (
          <Link key={e.id} to={`/estimates/${e.id}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{e.number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[e.status]}`}>
                    {e.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{e.customer?.name || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold font-mono">{formatCurrency(e.total)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(e.issueDate)}</p>
              </div>
            </div>
          </Link>
        ))}
        {estimates.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No estimates found</p>
        )}
      </div>
    </div>
  );
}
