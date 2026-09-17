import { useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, Send, User } from 'lucide-react';

const SUGGESTIONS = [
  'What do I need to follow up on today?',
  'Any overdue invoices?',
  'What is low in stock?',
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AssistantPanel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! Ask me about overdue invoices, low stock, pending estimates, active deliveries, payments, or expenses.',
    },
  ]);

  const submit = async (q: string) => {
    if (!q.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);
    try {
      const res = await api.post<{ query: string; answer: string }>('/dashboard/assistant', { query: q });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not process that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-3d flex flex-col h-full min-h-[240px]">
      <div className="border-b bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <span className="font-semibold text-sm">Business Assistant</span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`shrink-0 rounded-full p-1.5 ${
                  m.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.role === 'user' ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-muted/60 text-foreground rounded-bl-md'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
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
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(query); }}
        className="border-t p-4 flex items-center gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(query); } }}
          placeholder="Ask your Business Assistant…"
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          aria-label="Ask"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
