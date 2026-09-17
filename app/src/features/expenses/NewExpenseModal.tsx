import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';

interface Category {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewExpenseModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get<Category[]>('/expenses/categories'),
    enabled: open,
  });

  const [form, setForm] = useState({
    categoryId: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: '' as '' | 'BANK_TRANSFER' | 'POS' | 'CASH' | 'CARD' | 'OTHER',
    reference: '',
    notes: '',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/expenses', {
      ...data,
      paymentMethod: data.paymentMethod || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      handleClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to record'),
  });

  function handleClose() {
    setForm({
      categoryId: '', description: '', amount: 0,
      date: new Date().toISOString().split('T')[0],
      vendor: '', paymentMethod: '', reference: '', notes: '',
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
    if (!form.categoryId) return setError('Select a category');
    if (!form.description) return setError('Enter a description');
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
              <h2 className="font-semibold">New Expense</h2>
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
                    <label className="text-sm font-medium">Category *</label>
                    <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="">Select...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} required autoFocus className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="What was this expense for?" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Amount (₦) *</label>
                      <MoneyInput value={form.amount} onChange={(v) => update('amount', v)} required placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor</label>
                    <input type="text" value={form.vendor} onChange={(e) => update('vendor', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as typeof form.paymentMethod)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                      <option value="">Select...</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="POS">POS</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reference</label>
                    <input type="text" value={form.reference} onChange={(e) => update('reference', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
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
                  {create.isPending ? 'Recording...' : 'Record Expense'}
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
