'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Send, MapPin, RefreshCw, User, ChevronRight, Lightbulb,
} from 'lucide-react';
import {
  getResponse,
  WELCOME_RESPONSE,
  type BrainResponse,
  type ResponseComponent,
  type MetricItem,
  type BarItem,
  type PriceBand,
} from '../lib/aiInsightsBrain';

// ─── inline component renderers ─────────────────────────────────────────────

function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
      {items.map((m, i) => (
        <div
          key={i}
          className={`rounded-lg border p-3 ${
            m.highlight
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-muted/40'
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
          <p className={`text-lg font-bold ${m.highlight ? 'text-primary' : 'text-foreground'}`}>
            {m.value}
          </p>
          {m.sub && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{m.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function BarList({ items, title }: { items: BarItem[]; title?: string }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4 space-y-3">
      {title && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>}
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground w-44 shrink-0 leading-tight">{item.label}</span>
            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-primary/70 transition-all duration-700"
                style={{ width: `${(item.value / (item.max ?? 100)) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground w-10 text-right shrink-0">
              {item.value}{item.unit ?? ''}
            </span>
          </div>
          {item.signal && (
            <p className="text-xs text-muted-foreground pl-46">{item.signal}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DataTable({ headers, rows, title }: { headers: string[]; rows: { cells: (string | number)[] }[]; title?: string }) {
  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((h, i) => (
              <th key={i} className="text-left text-xs font-medium text-muted-foreground px-4 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              {row.cells.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-sm text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceBands({ bands, title }: { bands: PriceBand[]; title?: string }) {
  return (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {bands.map((b, i) => {
        const range = b.p75 - b.p25 || 1;
        const pct = Math.min(100, Math.max(0, ((b.yours - b.p25) / range) * 100));
        return (
          <div key={i} className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">{b.category}</p>
            <div className="flex bg-muted rounded overflow-hidden text-center">
              <div className="flex-1 py-1.5 px-1">
                <p className="text-[10px] text-muted-foreground">25th</p>
                <p className="text-sm font-semibold text-foreground">${b.p25}</p>
              </div>
              <div className="flex-1 py-1.5 px-1 bg-primary/10 border-x border-primary/20">
                <p className="text-[10px] text-primary">Median</p>
                <p className="text-sm font-bold text-primary">${b.median}</p>
              </div>
              <div className="flex-1 py-1.5 px-1">
                <p className="text-[10px] text-muted-foreground">75th</p>
                <p className="text-sm font-semibold text-foreground">${b.p75}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="relative h-1.5 bg-muted rounded-full">
                <div className="absolute inset-0 bg-linear-to-r from-emerald-300 via-amber-300 to-red-300 rounded-full opacity-40" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-surface shadow-sm z-10"
                  style={{ left: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Yours: <span className="font-semibold text-foreground">${b.yours}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Callout({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
      <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function InlineComponent({ component }: { component: ResponseComponent }) {
  switch (component.type) {
    case 'metric-grid':
      return <MetricGrid items={component.data as MetricItem[]} />;
    case 'bar-list':
      return <BarList items={component.data as BarItem[]} title={component.title} />;
    case 'data-table': {
      const d = component.data as { headers: string[]; rows: { cells: (string | number)[] }[] };
      return <DataTable headers={d.headers} rows={d.rows} title={component.title} />;
    }
    case 'price-bands':
      return <PriceBands bands={component.data as PriceBand[]} title={component.title} />;
    case 'callout':
      return <Callout text={(component.data as { text: string }).text} />;
    default:
      return null;
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  visibleText: string;
  fullSentences: string[];
  sentenceIndex: number;
  components: ResponseComponent[];
  followUps: string[];
  isStreaming: boolean;
}

// ─── main component ──────────────────────────────────────────────────────────

interface AiInsightsProps {
  clientName?: string;
}

export function AiInsights({ clientName = 'King West Kitchen & Bar' }: AiInsightsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stream sentences into a message
  const streamMessage = useCallback((id: string, response: BrainResponse) => {
    const { sentences, components, followUps } = response;

    let index = 0;

    const tick = () => {
      if (index >= sentences.length) {
        // Done streaming — attach components and follow-ups
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, isStreaming: false, components, followUps, sentenceIndex: sentences.length }
              : m
          )
        );
        return;
      }

      const nextIndex = index + 1;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                visibleText: sentences.slice(0, nextIndex).join(' '),
                sentenceIndex: nextIndex,
              }
            : m
        )
      );
      index = nextIndex;
      setTimeout(tick, 420);
    };

    setTimeout(tick, 0);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isThinking) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        visibleText: text,
        fullSentences: [text],
        sentenceIndex: 1,
        components: [],
        followUps: [],
        isStreaming: false,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);

      // Simulate thinking delay
      setTimeout(() => {
        const response = getResponse(text);
        const assistantId = `a-${Date.now()}`;

        const assistantMsg: Message = {
          id: assistantId,
          role: 'assistant',
          visibleText: '',
          fullSentences: response.sentences,
          sentenceIndex: 0,
          components: [],
          followUps: [],
          isStreaming: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsThinking(false);
        streamMessage(assistantId, response);
      }, 800);
    },
    [isThinking, streamMessage]
  );

  // Mount the welcome message
  useEffect(() => {
    const welcomeId = 'welcome';
    const welcome: Message = {
      id: welcomeId,
      role: 'assistant',
      visibleText: '',
      fullSentences: WELCOME_RESPONSE.sentences,
      sentenceIndex: 0,
      components: [],
      followUps: [],
      isStreaming: true,
    };
    setMessages([welcome]);
    streamMessage(welcomeId, WELCOME_RESPONSE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Bold **text** helper
  function renderText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div className="flex flex-col h-full bg-page-bg">
      {/* ── Header ── */}
      <div className="bg-surface border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-foreground">AI Insights</h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>King West, Toronto</span>
                <span className="mx-1">·</span>
                <span>18 competitors · 14 menus analyzed</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>Feb 2026</span>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'assistant'
                  ? 'bg-primary/10'
                  : 'bg-muted border border-border'
              }`}
            >
              {msg.role === 'assistant' ? (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              ) : (
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>

            {/* Bubble */}
            <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              {msg.role === 'user' ? (
                <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.visibleText}
                </div>
              ) : (
                <div>
                  {/* Text */}
                  {msg.visibleText && (
                    <p className="text-sm text-foreground leading-relaxed">
                      {renderText(msg.visibleText)}
                      {msg.isStreaming && (
                        <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                      )}
                    </p>
                  )}

                  {/* Inline components — only show when streaming is done */}
                  {!msg.isStreaming &&
                    msg.components.map((comp, i) => (
                      <InlineComponent key={i} component={comp} />
                    ))}

                  {/* Follow-up suggestions */}
                  {!msg.isStreaming && msg.followUps.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.followUps.map((fu, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(fu)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          {fu}
                          <ChevronRight className="w-3 h-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 shrink-0 flex items-center justify-center mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1 pt-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5 border border-border focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about competitors, pricing, menu gaps, customer feedback…"
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Based on 18 competitors · 14 menus · ~340 reviews within 500m · Feb 2026
        </p>
      </div>
    </div>
  );
}
