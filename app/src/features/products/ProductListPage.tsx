import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import NewProductModal from './NewProductModal';
import Pagination, { usePagination } from '@/components/Pagination';
import { Plus } from 'lucide-react';

export default function ProductListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'PRODUCT' | 'SERVICE'>('');
  const [modalOpen, setModalOpen] = useState(false);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (typeFilter) params.set('type', typeFilter);

  const { data: products = [] } = useQuery({
    queryKey: ['products', search, typeFilter],
    queryFn: () => api.get<Product[]>(`/products?${params.toString()}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(products);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products & Services</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
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

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12 whitespace-nowrap">#</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Name</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Type</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">SKU</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Price</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Stock</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.type === 'PRODUCT' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'}`}>
                    {p.type === 'PRODUCT' ? 'Product' : 'Service'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.sku || '—'}</td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{formatCurrency(p.sellingPrice)}{p.unit ? `/${p.unit}` : ''}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {p.type === 'PRODUCT' && p.inventoryTracking ? (
                    <span className={p.stock !== undefined && p.stock <= p.lowStockThreshold ? 'text-rose-600 font-medium font-mono' : 'font-mono'}>
                      {p.stock ?? 0}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {p.isActive
                    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                    : <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Inactive</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {search ? 'No products match your search' : 'No products yet. Create your first one.'}
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={products.length} setPage={setPage} />
      </div>

      <NewProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
