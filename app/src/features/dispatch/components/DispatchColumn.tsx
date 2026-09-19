import type { Delivery } from '@/types';
import { ArrowUpRight } from 'lucide-react';

const statusClassMap: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  CANCELLED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

interface DispatchColumnProps {
  title: string;
  deliveries: Delivery[];
  onOpen: (id: string) => void;
}

export default function DispatchColumn({ title, deliveries, onOpen }: DispatchColumnProps) {
  return (
    <div className="rounded-xl border bg-card shadow-3d-sm">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {deliveries.length}
        </span>
      </div>

      <div className="space-y-3 p-3">
        {deliveries.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            No deliveries in this stage.
          </div>
        ) : (
          deliveries.map((delivery) => (
            <button
              key={delivery.id}
              type="button"
              onClick={() => onOpen(delivery.id)}
              className="w-full rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{delivery.customer?.name || 'Walk-in'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{delivery.number}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClassMap[delivery.status] || 'bg-muted text-muted-foreground'}`}>
                  {delivery.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>{delivery.deliveryAddress || 'No delivery address provided'}</p>
                <p>{delivery.assignedPerson || 'Unassigned driver'}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{delivery.trackingReference || 'No tracking ref'}</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  Open <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
