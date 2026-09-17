import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE = 10;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when the items array changes (e.g. filter/search)
  useEffect(() => { setPage(1); }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedItems = items.slice(start, end);

  return { page: currentPage, totalPages, pagedItems, setPage, start, end };
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  setPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  setPage: (p: number) => void;
}) {
  const isDisabled = totalPages <= 1;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {totalItems} record{totalItems !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={isDisabled || page <= 1}
          className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={isDisabled || page >= totalPages}
          className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
