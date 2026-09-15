import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function InvoiceListPage() {
  const [status, setStatus] = useState('');
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.get<Invoice[]>(`/invoices${status ? `?status=${status}` : ''}`),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link to="/invoices/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New Invoice
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['', 'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => (
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
        {invoices.map((inv) => (
          <Link key={inv.id} to={`/invoices/${inv.id}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{inv.number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status]}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{inv.customer?.name || 'Walk-in'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold font-mono">{formatCurrency(inv.total)}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.status === 'PAID' ? 'Paid' : <span className="font-mono">{`Due: ${formatCurrency(inv.balanceDue)}`}</span>}
                </p>
              </div>
            </div>
          </Link>
        ))}
        {invoices.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No invoices found</p>
        )}
      </div>
    </div>
  );
}
