import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { X, ArrowLeft } from 'lucide-react';
import MoneyInput from '@/components/MoneyInput';
import type { Customer, Product } from '@/types';

interface LineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

export default function EstimateNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers?active=true'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products?active=true'),
  });

  const [form, setForm] = useState({
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    discount: 0,
    tax: 0,
    deliveryFee: 0,
    notes: '',
    terms: '',
  });

  const [items, setItems] = useState<LineItem[]>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 },
  ]);

  const create = useMutation({
    mutationFn: (data: typeof form & { items: LineItem[]; discount: number; tax: number }) => api.post('/estimates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      navigate('/estimates');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  });

  function updateForm<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, key: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(index, 'productId', productId);
      updateItem(index, 'description', product.description || product.name);
      updateItem(index, 'unitPrice', product.sellingPrice);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const grossSubtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalDiscount = items.reduce((sum, i) => {
    const base = i.quantity * i.unitPrice;
    return sum + base * (i.discount / 100);
  }, 0);
  const totalTax = items.reduce((sum, i) => {
    const base = i.quantity * i.unitPrice;
    const itemDiscount = base * (i.discount / 100);
    return sum + (base - itemDiscount) * (i.tax / 100);
  }, 0);
  const subtotal = grossSubtotal - totalDiscount + totalTax;
  const total = subtotal + Number(form.deliveryFee || 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.customerId) return setError('Select a customer');
    if (items.length === 0 || items.some((i) => !i.description.trim())) return setError('Add at least one item with a description');
    if (items.some((i) => !i.quantity || i.quantity < 1)) return setError('Quantity must be at least 1');
    const payloadItems = items.map((i) => {
      const quantity = Math.max(1, Math.floor(Number(i.quantity) || 1));
      const unitPrice = Number(i.unitPrice) || 0;
      const base = quantity * unitPrice;
      const discountPct = Math.max(0, Number(i.discount) || 0);
      const taxPct = Math.max(0, Number(i.tax) || 0);
      const discountAmount = Math.round(base * (discountPct / 100) * 100) / 100;
      const taxAmount = Math.round((base - discountAmount) * (taxPct / 100) * 100) / 100;
      return {
        productId: i.productId || undefined,
        description: i.description.trim(),
        quantity,
        unitPrice,
        discount: discountAmount,
        tax: taxAmount,
      } as LineItem;
    });
    create.mutate({ ...form, discount: 0, tax: 0, items: payloadItems });
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/estimates')}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Back to estimates"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">New Estimate</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-3d-sm">
          <h2 className="font-semibold">Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Customer *</label>
              <select value={form.customerId} onChange={(e) => updateForm('customerId', e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Issue Date</label>
              <input type="date" value={form.issueDate} onChange={(e) => updateForm('issueDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={(e) => updateForm('expiryDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-3d-sm">
          <h2 className="font-semibold">Delivery</h2>
          <div>
            <label className="text-sm font-medium">Delivery Fee (₦)</label>
            <MoneyInput value={form.deliveryFee} onChange={(v) => updateForm('deliveryFee', v)} placeholder="0.00" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-3d-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Line Items</h2>
            <button type="button" onClick={addItem} className="text-sm font-medium text-primary">+ Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => selectProduct(i, e.target.value)}
                    className="w-full sm:w-40 rounded-md border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">Manual entry</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground"
                    required
                  />
                  <button type="button" onClick={() => removeItem(i)} className="text-destructive self-start sm:self-center" aria-label="Remove item"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Unit Price</label>
                    <MoneyInput value={item.unitPrice} onChange={(v) => updateItem(i, 'unitPrice', v)} placeholder="0.00" className="!mt-0 px-2 py-1.5" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Discount (%)</label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" value={item.discount || ''} onChange={(e) => updateItem(i, 'discount', Number(e.target.value))} placeholder="0" className="w-full rounded-md border bg-background px-2 py-1.5 pr-6 text-sm placeholder:text-muted-foreground" />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tax (7.5%)</label>
                    <label className="flex h-[34px] items-center gap-2 rounded-md border bg-background px-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.tax > 0}
                        onChange={(e) => updateItem(i, 'tax', e.target.checked ? 7.5 : 0)}
                        className="rounded"
                      />
                      <span className="text-muted-foreground">Add</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-3d-sm">
          <div className="space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-mono">{formatCurrency(grossSubtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Discount:</span><span className="font-mono">-{formatCurrency(totalDiscount)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax:</span><span className="font-mono">+{formatCurrency(totalTax)}</span></div>
            {form.deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Delivery Fee:</span><span className="font-mono">+{formatCurrency(form.deliveryFee)}</span></div>}
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span>Total:</span><span className="font-mono">{formatCurrency(total)}</span></div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-3d-sm">
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Terms</label>
            <textarea value={form.terms} onChange={(e) => updateForm('terms', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} placeholder="Payment terms, delivery details..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create Estimate'}
          </button>
          <button type="button" onClick={() => navigate('/estimates')} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}
