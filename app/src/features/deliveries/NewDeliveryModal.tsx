import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';
import type { Customer, Invoice } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewDeliveryModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers?active=true'),
    enabled: open,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get<Invoice[]>('/invoices'),
    enabled: open,
  });

  const [form, setForm] = useState({
    invoiceId: '',
    customerId: '',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    deliveryFee: 0,
    assignedPerson: '',
    trackingReference: '',
    notes: '',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/deliveries', {
      ...data,
      invoiceId: data.invoiceId || undefined,
      customerId: data.customerId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      handleClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  });

  function handleClose() {
    setForm({
      invoiceId: '', customerId: '', deliveryAddress: '', recipientName: '',
      recipientPhone: '', deliveryFee: 0, assignedPerson: '', trackingReference: '', notes: '',
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
              <h2 className="font-semibold">New Delivery</h2>
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
                      <option value="">No invoice</option>
                      {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.number}</option>)}
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
                    <label className="text-sm font-medium">Delivery Address</label>
                    <input type="text" value={form.deliveryAddress} onChange={(e) => update('deliveryAddress', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Recipient Name</label>
                      <input type="text" value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Recipient Phone</label>
                      <input type="tel" value={form.recipientPhone} onChange={(e) => update('recipientPhone', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Delivery Fee (₦)</label>
                      <MoneyInput value={form.deliveryFee} onChange={(v) => update('deliveryFee', v)} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Assigned Person</label>
                      <input type="text" value={form.assignedPerson} onChange={(e) => update('assignedPerson', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tracking Reference</label>
                    <input type="text" value={form.trackingReference} onChange={(e) => update('trackingReference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
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
                  {create.isPending ? 'Creating...' : 'Create Delivery'}
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
