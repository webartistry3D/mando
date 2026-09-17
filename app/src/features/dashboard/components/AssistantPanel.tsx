import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Sparkles, AlertTriangle, Package, FileText, Truck,
  TrendingUp, Banknote, CheckCircle2, Send,
} from 'lucide-react';

interface Insight {
  icon: string;
  text: string;
  link?: string;
  severity: 'info' | 'warning' | 'success';
}

const iconMap: Record<string, typeof Sparkles> = {
  alert: AlertTriangle,
  package: Package,
  file: FileText,
  truck: Truck,
  trending: TrendingUp,
  cash: Banknote,
  check: CheckCircle2,
};

const severityClass: Record<string, string> = {
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200',
  info: 'border-border bg-muted/50 text-foreground',
};

const SUGGESTIONS = [
  'What do I need to follow up on today?',
  'Any overdue invoices?',
  'What is low in stock?',
];

export default function AssistantPanel() {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState(false);

  const { data: insights = [] } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: () => api.get<Insight[]>('/dashboard/insights'),
  });

  const submit = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setAsked(true);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-3d">
      <div className="border-b bg-gradient-to-r from-violet-500/10 via-transparent to-transparent px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <span className="font-semibold text-sm">Business Assistant</span>
      </div>

      <div className="p-4 space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); submit(query); }}
          className="flex items-center gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your Business Assistant…"
            className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 p-2.5 text-white hover:bg-violet-700 transition-colors"
            aria-label="Ask"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {!asked && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {asked && (
          <p className="text-xs text-muted-foreground italic">"{query}" — here's what needs attention:</p>
        )}

        <div className="space-y-2">
          {insights.map((ins, i) => {
            const Icon = iconMap[ins.icon] || Sparkles;
            const inner = (
              <div className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${severityClass[ins.severity]}`}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="flex-1">{ins.text}</span>
              </div>
            );
            return ins.link ? (
              <Link key={i} to={ins.link} className="block hover:opacity-80 transition-opacity">{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
