import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Customer, Product } from '@/types';

interface LineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

export default function InvoiceNewPage() {
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
    dueDate: '',
    discount: 0,
    tax: 0,
    notes: '',
    paymentInstructions: '',
  });

  const [items, setItems] = useState<LineItem[]>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 },
  ]);

  const create = useMutation({
    mutationFn: (data: typeof form & { items: LineItem[] }) => api.post('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
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

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice - i.discount + i.tax, 0);
  const total = subtotal - form.discount + form.tax;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (items.length === 0 || items.some((i) => !i.description)) return setError('Add at least one item');
    create.mutate({ ...form, items });
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold mb-6">New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <select value={form.customerId} onChange={(e) => updateForm('customerId', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1">
                <option value="">Walk-in (no customer)</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Issue Date</label>
              <input type="date" value={form.issueDate} onChange={(e) => updateForm('issueDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => updateForm('dueDate', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Line Items</h2>
            <button type="button" onClick={addItem} className="text-sm font-medium text-primary">+ Add Item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={item.productId}
                  onChange={(e) => selectProduct(i, e.target.value)}
                  className="w-40 rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Manual entry</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description" className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm" required />
                <button type="button" onClick={() => removeItem(i)} className="text-destructive" aria-label="Remove item"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} placeholder="Qty" className="rounded-md border bg-background px-2 py-1.5 text-sm" />
                <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} placeholder="Unit Price" className="rounded-md border bg-background px-2 py-1.5 text-sm" />
                <input type="number" step="0.01" min="0" value={item.discount} onChange={(e) => updateItem(i, 'discount', Number(e.target.value))} placeholder="Discount" className="rounded-md border bg-background px-2 py-1.5 text-sm" />
                <input type="number" step="0.01" min="0" value={item.tax} onChange={(e) => updateItem(i, 'tax', Number(e.target.value))} placeholder="Tax" className="rounded-md border bg-background px-2 py-1.5 text-sm" />
                <span className="text-sm font-medium self-center text-right">{formatCurrency(item.quantity * item.unitPrice - item.discount + item.tax)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Document Discount (₦)</label>
              <input type="number" step="0.01" min="0" value={form.discount} onChange={(e) => updateForm('discount', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Document Tax (₦)</label>
              <input type="number" step="0.01" min="0" value={form.tax} onChange={(e) => updateForm('tax', Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Discount:</span><span>-{formatCurrency(form.discount)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax:</span><span>+{formatCurrency(form.tax)}</span></div>
            <div className="flex justify-between font-bold text-lg mt-2"><span>Total:</span><span>{formatCurrency(total)}</span></div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Payment Instructions</label>
            <textarea value={form.paymentInstructions} onChange={(e) => updateForm('paymentInstructions', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1" rows={2} placeholder="Bank name, account number..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
          <button type="button" onClick={() => navigate('/invoices')} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}
