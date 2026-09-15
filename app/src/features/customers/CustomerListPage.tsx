import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Customer } from '@/types';

export default function CustomerListPage() {
  const [search, setSearch] = useState('');
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link
          to="/customers/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + New Customer
        </Link>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers..."
        className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-4"
      />

      <div className="space-y-2">
        {customers.map((c) => (
          <Link
            key={c.id}
            to={`/customers/${c.id}`}
            className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.phone || 'No phone'} {c.email ? `· ${c.email}` : ''}
                </p>
              </div>
              {!c.isActive && (
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
          </Link>
        ))}
        {customers.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {search ? 'No customers match your search' : 'No customers yet. Create your first one.'}
          </p>
        )}
      </div>
    </div>
  );
}
