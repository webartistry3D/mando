import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';
import RecordPaymentModal from './RecordPaymentModal';
import Pagination, { usePagination } from '@/components/Pagination';
import { Plus } from 'lucide-react';

export default function PaymentListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceParam = searchParams.get('invoice') || undefined;
  const [modalOpen, setModalOpen] = useState(!!invoiceParam);
  const [modalInvoiceId, setModalInvoiceId] = useState(invoiceParam);

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get<Payment[]>('/payments'),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(payments);

  function openModal(invoiceId?: string) {
    setModalInvoiceId(invoiceId);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12 whitespace-nowrap">#</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Amount</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Method</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Linked To</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/payments/${p.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-semibold font-mono whitespace-nowrap">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                    {p.paymentMethod.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {p.invoice?.number ? `Invoice ${p.invoice.number}` : 'Standalone income'}
                  {p.customer?.name ? ` · ${p.customer.name}` : ''}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(p.paymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No payments recorded yet</p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={payments.length} setPage={setPage} />
      </div>

      <RecordPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} invoiceId={modalInvoiceId} />
    </div>
  );
}
