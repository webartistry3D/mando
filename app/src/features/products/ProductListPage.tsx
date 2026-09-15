import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductListPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'PRODUCT' | 'SERVICE'>('');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (typeFilter) params.set('type', typeFilter);

  const { data: products = [] } = useQuery({
    queryKey: ['products', search, typeFilter],
    queryFn: () => api.get<Product[]>(`/products?${params.toString()}`),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products & Services</h1>
        <Link
          to="/products/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + New Product
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as '' | 'PRODUCT' | 'SERVICE')}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="PRODUCT">Products</option>
          <option value="SERVICE">Services</option>
        </select>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.id}`}
            className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.type === 'PRODUCT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {p.type === 'PRODUCT' ? 'Product' : 'Service'}
                  </span>
                  {!p.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                  {p.inventoryTracking && p.stock !== undefined && p.stock <= p.lowStockThreshold && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Low stock ({p.stock})
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.sku && `SKU: ${p.sku} · `}<span className="font-mono">{formatCurrency(p.sellingPrice)}</span>{p.unit ? `/${p.unit}` : ''}
                </p>
              </div>
              {p.type === 'PRODUCT' && p.inventoryTracking && (
                <div className="text-right text-sm">
                  <span className="font-medium">{p.stock ?? 0}</span>
                  <span className="text-muted-foreground"> in stock</span>
                </div>
              )}
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {search ? 'No products match your search' : 'No products yet. Create your first one.'}
          </p>
        )}
      </div>
    </div>
  );
}
