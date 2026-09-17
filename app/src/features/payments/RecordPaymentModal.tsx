import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';
import type { Invoice, Customer } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function RecordPaymentModal({ open, onClose, invoiceId }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers?active=true'),
    enabled: open,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', 'unpaid'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=ISSUED'),
    enabled: open,
  });
  const { data: partialInvoices = [] } = useQuery({
    queryKey: ['invoices', 'partial'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=PARTIALLY_PAID'),
    enabled: open,
  });
  const { data: overdueInvoices = [] } = useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => api.get<Invoice[]>('/invoices?status=OVERDUE'),
    enabled: open,
  });

  const unpaidInvoices = [...invoices, ...partialInvoices, ...overdueInvoices];

  const [form, setForm] = useState({
    invoiceId: invoiceId || '',
    customerId: '',
    amount: 0,
    paymentMethod: 'BANK_TRANSFER' as const,
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (invoiceId) setForm((prev) => ({ ...prev, invoiceId }));
  }, [invoiceId]);

  useEffect(() => {
    const inv = unpaidInvoices.find((i) => i.id === form.invoiceId);
    if (inv && form.amount <= 0) {
      setForm((prev) => ({ ...prev, amount: Number(inv.balanceDue) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.invoiceId, unpaidInvoices.length]);

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/payments', {
      ...data,
      invoiceId: data.invoiceId || undefined,
      customerId: data.customerId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      handleClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to record'),
  });

  function handleClose() {
    setForm({
      invoiceId: '', customerId: '', amount: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '', description: '', notes: '',
    });
    setError('');
    onClose();
  }

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.amount <= 0) return setError('Enter a valid amount');
    create.mutate(form);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex max-h-[75vh] w-full max-w-lg flex-col rounded-xl border bg-card shadow-3d"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
              <h2 className="font-semibold">Record Payment</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="overflow-y-auto p-5 space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-sm font-medium">Invoice (optional)</label>
                    <select value={form.invoiceId} onChange={(e) => update('invoiceId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="">Standalone income</option>
                      {unpaidInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.number} — {formatCurrency(inv.balanceDue)} due
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer (optional)</label>
                    <select value={form.customerId} onChange={(e) => update('customerId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="">No customer</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount (₦) *</label>
                    <MoneyInput value={form.amount} onChange={(v) => update('amount', v)} required placeholder="0.00" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Payment Method *</label>
                      <select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as typeof form.paymentMethod)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="POS">POS</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <input type="date" value={form.paymentDate} onChange={(e) => update('paymentDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reference</label>
                    <input type="text" value={form.reference} onChange={(e) => update('reference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="Transfer ref, cheque no..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="What is this payment for?" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
                  </div>
                </motion.div>
              </div>

              <div className="flex shrink-0 gap-3 border-t p-5 pt-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={create.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {create.isPending ? 'Recording...' : 'Record Payment'}
                </motion.button>
                <button type="button" onClick={handleClose} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
