import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ProductNewPage() {
  const navigate = useNavigate();
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
      navigate('/products');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    create.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">New Product / Service</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
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
              <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => update('sellingPrice', Number(e.target.value))} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Price (₦)</label>
              <input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => update('costPrice', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
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
                    <input type="number" min="0" value={form.openingStock} onChange={(e) => update('openingStock', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Low Stock Threshold</label>
                    <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => update('lowStockThreshold', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="rounded-md border px-4 py-2 text-sm font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
