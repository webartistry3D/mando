import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Customer } from '@/types';
import NewCustomerModal from './NewCustomerModal';
import Pagination, { usePagination } from '@/components/Pagination';
import { Plus } from 'lucide-react';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === '1');
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const { page, totalPages, pagedItems, setPage } = usePagination(customers);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers..."
        className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-4"
      />

      <div className="rounded-xl border bg-card overflow-x-auto shadow-3d">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium w-12 whitespace-nowrap">#</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Name</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Phone</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Email</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Type</th>
              <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagedItems.map((c, i) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">{(page - 1) * 10 + i + 1}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.email || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.customerType ? c.customerType.toLowerCase() : '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {c.isActive
                    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                    : <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Inactive</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {search ? 'No customers match your search' : 'No customers yet. Create your first one.'}
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={customers.length} setPage={setPage} />
      </div>

      <NewCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
