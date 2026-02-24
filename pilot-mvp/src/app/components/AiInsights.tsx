'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Send, MapPin, RefreshCw, User, ChevronRight, Lightbulb,
  Search, Upload, Loader2, ChevronUp, UtensilsCrossed,
} from 'lucide-react';
import {
  getResponse,
  getWelcomeResponse,
  getSummary,
  runScan,
  type BrainResponse,
  type ResponseComponent,
  type MetricItem,
  type BarItem,
  type PriceBand,
  type SummaryResponse,
  type ScanProgress,
} from '../lib/aiInsightsBrain';
import { MenuUpload } from './MenuUpload';
import { MenuViewer } from './MenuViewer';

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
            <span className="text-sm font-semibold text-foreground whitespace-nowrap text-right shrink-0">
              {item.value}{item.unit ? ` ${item.unit}` : ''}
            </span>
          </div>
          {item.signal && (
            <p className="text-xs text-muted-foreground ml-44 pl-3">{item.signal}</p>
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

function PriceBands({ bands }: { bands: PriceBand[] }) {
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
                <div className="absolute inset-0 bg-linear-to-r from-emerald-300 via-slate-400 to-red-300 rounded-full opacity-40" />
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
    case 'bar-list': {
      const d = component.data as { items?: BarItem[]; title?: string } | BarItem[];
      if (Array.isArray(d)) return <BarList items={d} title={component.title} />;
      return <BarList items={d.items ?? []} title={d.title ?? component.title} />;
    }
    case 'data-table': {
      const d = component.data as { headers: string[]; rows: { cells: (string | number)[] }[]; title?: string };
      return <DataTable headers={d.headers} rows={d.rows} title={d.title ?? component.title} />;
    }
    case 'price-bands':
      return <PriceBands bands={component.data as PriceBand[]} />;
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
  clientId: string;
  clientName?: string;
  clientAddress?: string;
}

const STORAGE_KEY_PREFIX = 'aibi-chat-';

function loadCachedMessages(clientId: string): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + clientId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return parsed.map((m) => ({ ...m, isStreaming: false }));
  } catch { return []; }
}

function saveCachedMessages(clientId: string, messages: Message[]) {
  try {
    const finished = messages.filter((m) => !m.isStreaming);
    if (finished.length === 0) return;
    sessionStorage.setItem(STORAGE_KEY_PREFIX + clientId, JSON.stringify(finished));
  } catch { /* quota exceeded — ignore */ }
}

export function AiInsights({ clientId, clientName, clientAddress }: AiInsightsProps) {
  const [messages, setMessages] = useState<Message[]>(() => loadCachedMessages(clientId));
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [scanAddress, setScanAddress] = useState('');
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showMenuUpload, setShowMenuUpload] = useState(false);
  const [showMenuViewer, setShowMenuViewer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    saveCachedMessages(clientId, messages);
  }, [clientId, messages]);

  const streamMessage = useCallback((id: string, response: BrainResponse) => {
    const { sentences, components, followUps } = response;
    let index = 0;

    const tick = () => {
      if (index >= sentences.length) {
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
    async (text: string) => {
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

      try {
        const response = await getResponse(clientId, text);
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
        streamMessage(assistantId, response);
      } catch {
        const errorMsg: Message = {
          id: `e-${Date.now()}`,
          role: 'assistant',
          visibleText: 'Sorry, something went wrong. Please try again.',
          fullSentences: ['Sorry, something went wrong. Please try again.'],
          sentenceIndex: 1,
          components: [],
          followUps: ["What's the competitive landscape?"],
          isStreaming: false,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsThinking(false);
      }
    },
    [clientId, isThinking, streamMessage]
  );

  // Load summary + welcome on mount — single API call
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const summary = await getSummary(clientId);
      if (cancelled) return;
      setSummaryData(summary);

      // If we have address and not started, auto-start will run — don't show "click Initialize"
      let welcome: Awaited<ReturnType<typeof getWelcomeResponse>>;
      if (summary.status === 'not_started' && clientAddress) {
        welcome = {
          sentences: [
            'Loading AI Insights for your location...',
            'Scanning the competitive landscape — this may take a moment.',
          ],
          components: [],
          followUps: [],
        };
      } else {
        welcome = await getWelcomeResponse(summary);
      }
      if (cancelled) return;

      const welcomeId = 'welcome';
      const welcomeMsg: Message = {
        id: welcomeId,
        role: 'assistant',
        visibleText: '',
        fullSentences: welcome.sentences,
        sentenceIndex: 0,
        components: [],
        followUps: [],
        isStreaming: true,
      };
      setMessages([welcomeMsg]);
      streamMessage(welcomeId, welcome);
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, clientAddress]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const autoStarted = useRef(false);
  useEffect(() => {
    if (
      clientAddress &&
      summaryData?.status === 'not_started' &&
      !isScanning &&
      !autoStarted.current
    ) {
      autoStarted.current = true;
      setScanAddress(clientAddress);
      const startScan = async () => {
        setIsScanning(true);
        setScanProgress({ stage: 'Starting scan...', progress: 0 });
        const result = await runScan(clientId, clientAddress, (p) => setScanProgress(p));
        setIsScanning(false);
        if (result.success) {
          setScanProgress({ stage: 'Complete!', progress: 100 });
          const summary = await getSummary(clientId);
          setSummaryData(summary);
          const welcome = await getWelcomeResponse(summary);
          const id = `scan-done-${Date.now()}`;
          const msg: Message = {
            id,
            role: 'assistant',
            visibleText: '',
            fullSentences: welcome.sentences,
            sentenceIndex: 0,
            components: [],
            followUps: [],
            isStreaming: true,
          };
          setMessages([msg]);
          streamMessage(id, welcome);
          setTimeout(() => setScanProgress(null), 2000);
        } else {
          setScanProgress({ stage: 'Failed', progress: 0, error: result.error });
        }
      };
      startScan();
    }
  }, [clientAddress, summaryData?.status, isScanning, clientId, streamMessage]);

  const handleInitialize = async () => {
    if (!scanAddress.trim() || isScanning) return;
    setIsScanning(true);
    setScanProgress({ stage: 'Starting scan...', progress: 0 });

    const result = await runScan(clientId, scanAddress, (p) => {
      setScanProgress(p);
    });

    setIsScanning(false);

    if (result.success) {
      setScanProgress({ stage: 'Complete!', progress: 100 });
      const summary = await getSummary(clientId);
      setSummaryData(summary);
      const welcome = await getWelcomeResponse(clientId);
      const id = `scan-done-${Date.now()}`;
      const msg: Message = {
        id,
        role: 'assistant',
        visibleText: '',
        fullSentences: welcome.sentences,
        sentenceIndex: 0,
        components: [],
        followUps: [],
        isStreaming: true,
      };
      setMessages((prev) => [...prev, msg]);
      streamMessage(id, welcome);
      setTimeout(() => setScanProgress(null), 2000);
    } else {
      setScanProgress({ stage: 'Failed', progress: 0, error: result.error });
    }
  };

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

  const isLoading = summaryData === null;
  const isNotStarted = summaryData?.status === 'not_started';
  const isReady = summaryData?.status === 'ready';
  const headerLocation = summaryData?.location?.neighborhood ?? summaryData?.location?.city ?? clientName ?? 'Location';
  const headerStats = isReady && summaryData?.summary
    ? `${summaryData.summary.totalCompetitors} competitors · ${summaryData.summary.menusFound} menus analyzed`
    : '';

  // Show a clean loading state while fetching summary
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-page-bg">
        <div className="bg-surface border-b border-border px-6 py-4 shrink-0">
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
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm">Loading AI Insights...</p>
          </div>
        </div>
      </div>
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
                <span>{headerLocation}</span>
                {isReady && headerStats && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{headerStats}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isReady && (
              <>
                <button
                  onClick={() => { setShowMenuViewer(!showMenuViewer); if (!showMenuViewer) setShowMenuUpload(false); }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    showMenuViewer
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {showMenuViewer ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide Menus
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-3 h-3" />
                      View Menus
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowMenuUpload(!showMenuUpload); if (!showMenuUpload) setShowMenuViewer(false); }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    showMenuUpload
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {showMenuUpload ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide Upload
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      Upload Menu
                    </>
                  )}
                </button>
              </>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Scan progress bar */}
        {scanProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                {scanProgress.progress < 100 && <Loader2 className="w-3 h-3 animate-spin" />}
                {scanProgress.stage}
              </span>
              <span className="text-muted-foreground">{scanProgress.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${scanProgress.progress}%` }}
              />
            </div>
            {scanProgress.error && (
              <p className="text-xs text-red-500 mt-1">{scanProgress.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Menu upload panel */}
      {showMenuUpload && summaryData?.snapshotId && (
        <div className="border-b border-border bg-surface px-6 py-4 max-h-[45vh] overflow-y-auto">
          <MenuUpload
            clientId={clientId}
            competitorNames={summaryData?.competitorNames}
            onClose={() => setShowMenuUpload(false)}
          />
        </div>
      )}

      {/* Menu viewer panel */}
      {showMenuViewer && summaryData?.snapshotId && (
        <div className="border-b border-border bg-surface px-6 py-4 max-h-[45vh] overflow-y-auto">
          <MenuViewer clientId={clientId} />
        </div>
      )}

      {/* ── Initialization flow ── */}
      {isNotStarted && !isScanning && !clientAddress && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="p-3 rounded-2xl bg-primary/10 w-fit mx-auto">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Set up AI Insights</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the business address to scan the competitive landscape, foot traffic, and pricing.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanAddress}
                onChange={(e) => setScanAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInitialize()}
                placeholder="e.g. 123 King St W, Toronto, ON"
                className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50"
              />
              <button
                onClick={handleInitialize}
                disabled={!scanAddress.trim()}
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Initialize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      {(!isNotStarted || isScanning) && (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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

                <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                      {msg.visibleText}
                    </div>
                  ) : (
                    <div>
                      {msg.visibleText && (
                        <p className="text-sm text-foreground leading-relaxed">
                          {renderText(msg.visibleText)}
                          {msg.isStreaming && (
                            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                          )}
                        </p>
                      )}

                      {!msg.isStreaming &&
                        msg.components.map((comp, i) => (
                          <InlineComponent key={i} component={comp} />
                        ))}

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
                disabled={isThinking || isScanning}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking || isScanning}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {isReady && summaryData?.summary && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Based on {summaryData.summary.totalCompetitors} competitors · {summaryData.summary.menusFound} menus · ~{summaryData.summary.reviewsAnalyzed} reviews · {headerLocation}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
