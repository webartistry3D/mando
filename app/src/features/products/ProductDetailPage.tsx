import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';
import NumberInput from '@/components/NumberInput';
import type { Product, InventoryTransaction } from '@/types';

interface ProductDetail extends Product {
  stock: number;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductDetail>(`/products/${id}`),
    enabled: !!id,
  });

  const { data: inventory } = useQuery({
    queryKey: ['product-inventory', id],
    queryFn: () => api.get<{ stock: number; transactions: InventoryTransaction[] }>(`/products/${id}/inventory`),
    enabled: !!id,
  });

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

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        type: product.type || 'PRODUCT',
        sku: product.sku || '',
        description: product.description || '',
        sellingPrice: product.sellingPrice || 0,
        costPrice: product.costPrice || 0,
        unit: product.unit || '',
        taxEnabled: product.taxEnabled || false,
        inventoryTracking: product.inventoryTracking || false,
        openingStock: product.openingStock || 0,
        lowStockThreshold: product.lowStockThreshold || 0,
      });
    }
  }, [product]);

  const updateProduct = useMutation({
    mutationFn: (data: typeof form) => api.patch(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setIsEditing(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Update failed'),
  });

  const deactivate = useMutation({
    mutationFn: () => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to deactivate'),
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    updateProduct.mutate(form);
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              {product.type === 'PRODUCT' ? 'Product' : 'Service'} {product.sku ? `· SKU: ${product.sku}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="rounded-md border px-4 py-2 text-sm font-medium">
                Edit
              </button>
              {product.isActive && (
                <button onClick={() => deactivate.mutate()} className="rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive">
                  Deactivate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!product.isActive && (
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          This {product.type === 'PRODUCT' ? 'product' : 'service'} is inactive.
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 shadow-3d">
          <h2 className="font-semibold">Edit {product.type === 'PRODUCT' ? 'Product' : 'Service'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={form.type} onChange={(e) => update('type', e.target.value as 'PRODUCT' | 'SERVICE')} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">SKU</label>
                <input type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Unit</label>
                <input type="text" value={form.unit} onChange={(e) => update('unit', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Selling Price (₦)</label>
                <MoneyInput value={form.sellingPrice} onChange={(v) => update('sellingPrice', v)} required placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium">Cost Price (₦)</label>
                <MoneyInput value={form.costPrice} onChange={(v) => update('costPrice', v)} placeholder="0.00" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.taxEnabled} onChange={(e) => update('taxEnabled', e.target.checked)} className="rounded" />
              Enable VAT/Tax
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
          <div className="flex gap-3">
            <button type="submit" disabled={updateProduct.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {updateProduct.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-md border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-2 shadow-3d-sm">
            <p className="text-sm"><span className="font-medium">Selling Price:</span> <span className="font-mono">{formatCurrency(product.sellingPrice)}</span></p>
            <p className="text-sm"><span className="font-medium">Cost Price:</span> <span className="font-mono">{formatCurrency(product.costPrice)}</span></p>
            {product.unit && <p className="text-sm"><span className="font-medium">Unit:</span> {product.unit}</p>}
            <p className="text-sm"><span className="font-medium">Tax:</span> {product.taxEnabled ? 'Enabled' : 'Disabled'}</p>
            {product.description && <p className="text-sm"><span className="font-medium">Description:</span> {product.description}</p>}
            {product.inventoryTracking && (
              <p className="text-sm"><span className="font-medium">Stock:</span> <span className="font-mono">{product.stock}</span> units</p>
            )}
          </div>
        </div>
      )}

      {product.inventoryTracking && inventory && (
        <div className="rounded-lg border bg-card overflow-hidden shadow-3d">
          <div className="px-4 py-3 border-b bg-muted/50 font-semibold text-sm">
            Inventory History
          </div>
          <div className="divide-y">
            {inventory.transactions.map((t) => (
              <div key={t.id} className="px-4 py-3 flex justify-between text-sm">
                <div>
                  <span className={`font-medium ${t.type === 'STOCK_IN' ? 'text-green-600' : t.type === 'STOCK_OUT' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {t.type.replace('_', ' ')}
                  </span>
                  {t.reason && <span className="text-muted-foreground ml-2">— {t.reason}</span>}
                </div>
                <div className="text-right">
                  <span className="font-medium font-mono">{t.type === 'STOCK_OUT' ? '-' : '+'}{t.quantity}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
            {inventory.transactions.length === 0 && (
              <p className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
