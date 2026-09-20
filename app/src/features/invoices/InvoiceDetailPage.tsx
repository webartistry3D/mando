import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateInvoicePDFBlob, generateInvoicePDF } from '@/lib/pdf';
import { buildInvoiceWhatsAppMessage } from '@/lib/whatsapp';
import { ArrowLeft } from 'lucide-react';
import type { Invoice, Business } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<Business>('/business'),
  });

  const issue = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/issue`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/invoices/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const recordPayment = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string }) =>
      api.post('/payments', { ...data, invoiceId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setShowPaymentSuccess(true);
    },
  });

  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const isDraft = invoice.status === 'DRAFT';
  const canPay = ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);
  const canCancel = ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);

  const grossSubtotal = invoice.items?.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0) || 0;
  const itemDiscount = invoice.items?.reduce((s, i) => s + Number(i.discount), 0) || 0;
  const itemTax = invoice.items?.reduce((s, i) => s + Number(i.tax), 0) || 0;
  const deliveryFee = Number(invoice.deliveryFee) || 0;
  const displaySubtotal = Number(invoice.subtotal) || grossSubtotal;
  const displayDiscount = Number(invoice.discount) > 0 ? Number(invoice.discount) : itemDiscount;
  const displayTax = Number(invoice.tax) > 0 ? Number(invoice.tax) : itemTax;
  const displayTotal = displaySubtotal - displayDiscount + displayTax + deliveryFee;

  const handleShareWhatsApp = () => {
    if (!invoice || !business) return;
    const pdfBlob = generateInvoicePDFBlob(invoice, business);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const shareUrl = `https://wa.me/${invoice.customer?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(buildInvoiceWhatsAppMessage(invoice, pdfUrl))}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Back to invoices"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.number}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[invoice.status]}`}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.customer?.name || 'Walk-in'} · {formatDate(invoice.issueDate)}
              {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              onClick={() => business && invoice && generateInvoicePDF(invoice, business)}
              className="rounded-md border px-3 py-2 text-sm font-medium w-full"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 w-full text-center"
            >
              WhatsApp
            </button>
          </div>
          {isDraft && (
            <button onClick={() => issue.mutate()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white w-full sm:w-auto">
              Issue Invoice
            </button>
          )}
          {canPay && (
            <button
              onClick={() => recordPayment.mutate({ amount: Number(invoice.balanceDue), paymentMethod: 'BANK_TRANSFER' })}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white w-full sm:w-auto"
            >
              Record Payment
            </button>
          )}
          {canCancel && (
            <button onClick={() => updateStatus.mutate('CANCELLED')} className="rounded-md border px-4 py-2 text-sm font-medium text-destructive w-full sm:w-auto">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Payment summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-bold font-mono">{formatCurrency(displayTotal)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-lg font-bold text-green-600 font-mono">{formatCurrency(invoice.amountPaid)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-3d-sm">
          <p className="text-sm text-muted-foreground">Balance Due</p>
          <p className={`text-lg font-bold font-mono ${invoice.balanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(invoice.balanceDue)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
        <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Items</div>
        <div className="divide-y">
          {invoice.items?.map((item, i) => (
            <div key={i} className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground font-mono">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="font-medium font-mono sm:text-right">{formatCurrency(item.lineTotal ?? (item.quantity * item.unitPrice - item.discount + item.tax))}</p>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatCurrency(displaySubtotal)}</span></div>
          {displayDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-mono">-{formatCurrency(displayDiscount)}</span></div>}
          {displayTax > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span className="font-mono">+{formatCurrency(displayTax)}</span></div>}
          {deliveryFee > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery Fee</span><span className="font-mono">+{formatCurrency(deliveryFee)}</span></div>}
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="font-mono">{formatCurrency(displayTotal)}</span></div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">Payments</div>
          <div className="divide-y">
            {invoice.payments.map((p) => (
              <div key={p.id} className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <div>
                  <p className="font-medium font-mono">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{p.paymentMethod.replace('_', ' ')}</p>
                </div>
                <p className="text-xs text-muted-foreground sm:text-right">{formatDate(p.paymentDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.paymentInstructions && (
        <div className="rounded-lg border bg-card p-4 shadow-3d-sm">
          <h2 className="font-semibold text-sm mb-2">Payment Instructions</h2>
          <p className="text-sm text-muted-foreground">{invoice.paymentInstructions}</p>
        </div>
      )}
      {invoice.notes && (
        <div className="rounded-lg border bg-card p-4 shadow-3d-sm">
          <h2 className="font-semibold text-sm mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </div>
      )}

      <AnimatePresence>
        {showPaymentSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowPaymentSuccess(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div
                className="w-full max-w-xs rounded-xl border bg-card p-5 shadow-3d pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-center">Payment Recorded</h3>
                <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                  The payment has been recorded successfully.
                </p>
                <button
                  onClick={() => setShowPaymentSuccess(false)}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
