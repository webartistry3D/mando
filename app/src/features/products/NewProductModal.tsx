import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';
import NumberInput from '@/components/NumberInput';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewProductModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    sku: '',
    description: '',
    sellingPrice: 0,
    costPrice: 0,
    unit: '',
    taxEnabled: false,
    inventoryTracking: false,
    openingStock: 0,
    lowStockThreshold: 0,
  });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  });

  function handleClose() {
    setForm({
      name: '', type: 'PRODUCT', sku: '', description: '',
      sellingPrice: 0, costPrice: 0, unit: '',
      taxEnabled: false, inventoryTracking: false,
      openingStock: 0, lowStockThreshold: 0,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative flex max-h-[75vh] w-full max-w-lg flex-col rounded-xl border bg-card shadow-3d">
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-semibold">New Product / Service</h2>
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
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Type *</label>
                <select value={form.type} onChange={(e) => update('type', e.target.value as 'PRODUCT' | 'SERVICE')} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => update('unit', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" placeholder="e.g. kg, piece" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Selling Price (₦) *</label>
                  <MoneyInput value={form.sellingPrice} onChange={(v) => update('sellingPrice', v)} required placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost Price (₦)</label>
                  <MoneyInput value={form.costPrice} onChange={(v) => update('costPrice', v)} placeholder="0.00" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.taxEnabled} onChange={(e) => update('taxEnabled', e.target.checked)} className="rounded" />
                Enable VAT/Tax on this item
              </label>

              {form.type === 'PRODUCT' && (
                <>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={form.inventoryTracking} onChange={(e) => update('inventoryTracking', e.target.checked)} className="rounded" />
                    Track inventory
                  </label>
                  {form.inventoryTracking && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="text-sm font-medium">Opening Stock</label>
                        <NumberInput value={form.openingStock} onChange={(v) => update('openingStock', v)} placeholder="0" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Low Stock Threshold</label>
                        <NumberInput value={form.lowStockThreshold} onChange={(v) => update('lowStockThreshold', v)} placeholder="0" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t p-5 pt-4">
            <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {create.isPending ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={handleClose} className="rounded-md border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
