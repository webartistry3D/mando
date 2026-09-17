import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';
import Pagination, { usePagination } from '@/components/Pagination';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.get<Invoice[]>(`/invoices${status ? `?status=${status}` : ''}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(invoices);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button onClick={() => navigate('/invoices/new')} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          + New
        </button>
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

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12">#</th>
              <th className="px-4 py-2.5 font-medium">Number</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
              <th className="px-4 py-2.5 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((inv, i) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.customer?.name || 'Walk-in'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[inv.status]}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(inv.total)}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {inv.status === 'PAID' ? <span className="text-green-600">Paid</span> : formatCurrency(inv.balanceDue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No invoices found</p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={invoices.length} setPage={setPage} />
      </div>
    </div>
  );
}
