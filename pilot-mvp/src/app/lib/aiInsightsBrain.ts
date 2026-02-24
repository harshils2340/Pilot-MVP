/**
 * AI Insights response engine.
 *
 * Async API calls to the AI BI backend, replacing the previous
 * hardcoded pattern-matching engine.
 *
 * All type exports are preserved — the AiInsights.tsx component
 * depends on them.
 */

export type ComponentType = 'metric-grid' | 'bar-list' | 'data-table' | 'callout' | 'price-bands';

export interface MetricItem {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export interface BarItem {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  signal?: string;
}

export interface TableRow {
  cells: (string | number)[];
}

export interface ResponseComponent {
  type: ComponentType;
  title?: string;
  data: MetricItem[] | BarItem[] | { headers: string[]; rows: TableRow[] } | { text: string } | PriceBand[];
}

export interface PriceBand {
  category: string;
  p25: number;
  median: number;
  p75: number;
  yours: number;
}

export interface BrainResponse {
  sentences: string[];
  components: ResponseComponent[];
  followUps: string[];
}

// ─── Summary response type (from GET /api/ai-insights/summary) ──────────────

export interface SummaryResponse {
  status: 'ready' | 'collecting' | 'initializing' | 'not_started' | 'error' | 'stale' | 'analyzing';
  readinessPercent: number;
  snapshotId?: string;
  location?: {
    address: string;
    city: string;
    neighborhood?: string;
  } | null;
  summary?: {
    totalCompetitors: number;
    menusFound: number;
    reviewsAnalyzed: number;
    avgCorridorRating: number;
    menuCoveragePercent: number;
    corridorInsights?: Record<string, unknown>;
    underservedCategories?: { category: string; competitorCoverage: number }[];
    topReviewThemes?: { theme: string; sentiment: string; frequency: number }[];
    pricingBands?: Record<string, unknown>[];
  } | null;
  competitorNames?: string[];
  error?: string;
}

// ─── API calls ──────────────────────────────────────────────────────────────

export async function getResponse(clientId: string, query: string): Promise<BrainResponse> {
  try {
    const res = await fetch('/api/ai-insights/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('AI query failed:', err);
    return {
      sentences: ['Sorry, I couldn\'t process that request. Please try again.'],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
        'How does my pricing compare?',
      ],
    };
  }
}

export async function getSummary(clientId: string): Promise<SummaryResponse> {
  try {
    const res = await fetch(`/api/ai-insights/summary?clientId=${encodeURIComponent(clientId)}`);
    return await res.json();
  } catch {
    return { status: 'error', readinessPercent: 0, summary: null, error: 'Failed to fetch summary' };
  }
}

/**
 * Build welcome message from an already-fetched summary.
 * Accepts either pre-fetched data or a clientId to fetch fresh.
 */
export async function getWelcomeResponse(
  clientIdOrData: string | SummaryResponse,
): Promise<BrainResponse> {
  try {
    const data = typeof clientIdOrData === 'string'
      ? await getSummary(clientIdOrData)
      : clientIdOrData;

    if (data.status === 'not_started') {
      return {
        sentences: [
          "AI Insights hasn't been set up for this client yet.",
          'Enter the business address and click **Initialize** to scan the competitive landscape.',
        ],
        components: [],
        followUps: [],
      };
    }

    if (data.status === 'collecting' || data.status === 'initializing' || data.status === 'analyzing') {
      return {
        sentences: [
          `The competitive scan is **${data.readinessPercent}% complete**.`,
          'Please wait while I finish analyzing the corridor...',
        ],
        components: [],
        followUps: [],
      };
    }

    if (data.summary) {
      const s = data.summary;
      const neighborhood = data.location?.neighborhood ?? data.location?.city ?? 'the corridor';
      const topGap = s.underservedCategories?.[0];
      const topComplaint = s.topReviewThemes?.find(t => t.sentiment === 'negative');

      return {
        sentences: [
          `I've analyzed **${s.totalCompetitors} competitors** and **${s.menusFound} menus** in ${neighborhood}.`,
          'Ask me anything about the competitive landscape, pricing, menu gaps, or what customers are saying about nearby venues.',
        ],
        components: [{
          type: 'metric-grid',
          data: [
            { label: 'Venues in radius', value: String(s.totalCompetitors), sub: neighborhood },
            { label: 'Menus analyzed', value: String(s.menusFound), sub: 'pricing & coverage data' },
            { label: 'Biggest gap', value: topGap?.category ?? 'N/A', sub: topGap ? `${topGap.competitorCoverage}% coverage` : '', highlight: true },
            { label: 'Top complaint', value: topComplaint?.theme ?? 'N/A', sub: topComplaint ? `${topComplaint.frequency} mentions` : '' },
          ],
        }],
        followUps: [
          "What's the competitive landscape?",
          'Where are the biggest gaps I can own?',
          'How does my pricing compare?',
          "What are customers complaining about?",
          "What's the late-night opportunity?",
        ],
      };
    }

    return {
      sentences: ['Welcome to AI Insights. Ask me anything about the competitive landscape.'],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
      ],
    };
  } catch {
    return {
      sentences: ['Welcome to AI Insights. Ask me anything about the competitive landscape.'],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
      ],
    };
  }
}

// ─── Scan orchestrator ──────────────────────────────────────────────────────

export interface ScanProgress {
  stage: string;
  progress: number;
  error?: string;
}

export async function runScan(
  clientId: string,
  address: string,
  onProgress: (p: ScanProgress) => void,
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  const stages = [
    { path: '/api/ai-insights/scan/geocode', label: 'Geocoding address...', body: { clientId, address } },
  ] as { path: string; label: string; body: Record<string, string> }[];

  onProgress({ stage: stages[0].label, progress: 5 });

  try {
    const geoRes = await fetch(stages[0].path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stages[0].body),
    });
    const geo = await geoRes.json();
    if (!geo.success) return { success: false, error: geo.error ?? 'Geocoding failed' };

    const snapshotId = geo.snapshotId;

    const remainingStages = [
      { path: '/api/ai-insights/scan/competitors', label: 'Discovering competitors...', progress: 25 },
      { path: '/api/ai-insights/scan/details', label: 'Fetching reviews & details...', progress: 40 },
      { path: '/api/ai-insights/scan/reviews', label: 'Deep-diving into reviews...', progress: 55 },
      { path: '/api/ai-insights/scan/traffic', label: 'Analyzing foot traffic...', progress: 70 },
      { path: '/api/ai-insights/scan/revenue', label: 'Calculating revenue estimates...', progress: 90 },
    ];

    for (const stage of remainingStages) {
      onProgress({ stage: stage.label, progress: stage.progress - 10 });

      const res = await fetch(stage.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, snapshotId }),
      });
      const data = await res.json();

      if (!data.success && stage.path.includes('competitors')) {
        return { success: false, snapshotId, error: data.error ?? 'Competitor discovery failed' };
      }

      onProgress({ stage: stage.label, progress: stage.progress });
    }

    onProgress({ stage: 'Complete!', progress: 100 });
    return { success: true, snapshotId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return { success: false, error: message };
  }
}
