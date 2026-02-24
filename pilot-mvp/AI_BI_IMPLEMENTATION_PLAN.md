# AI BI Implementation Plan — Workstream 4

Full implementation plan to replace the hardcoded demo AI BI engine with a real, API-driven system.

**Branch:** `koushik-overtime-aibi`
**APIs:** Google Maps Places (key set), BestTime (key set), Gemini (key needed)
**Database:** MongoDB Atlas (connected)

---

## Codebase Audit — What We're Working With

Before any implementation, here's the reality check against the existing stack:

| Concern | Current State | Implication |
|---------|--------------|-------------|
| Next.js version | **16.1.1** with Turbopack | Route params are `Promise<{}>` — all new API routes must `await params` |
| Mongoose version | **9.1.2** | Latest major — schema patterns differ from older tutorials; `Schema.Types.Mixed` OK, no `useCreateIndex` |
| TypeScript | **strict: true** | Every type must be explicit — no implicit `any`, no untyped catch blocks |
| DB connection | TWO patterns exist: `connectToDB()` (Mongoose) and `clientPromise` (native MongoClient) | Our BiSnapshot model uses Mongoose → always use `connectToDB()` |
| Vercel deploy | **Hobby tier, no `maxDuration`** in vercel.json | Default function timeout = **10 seconds**. The scan pipeline takes 30-60s. Critical blocker. |
| Client model | No `address` field on `IClient` | BiSnapshot needs lat/lng. Scan endpoint must accept address as a parameter, not pull from client. |
| clientId type | URL param is a `string`, can be ObjectId, businessName, or seed id | BiSnapshot uses `Types.ObjectId`. Must resolve string→ObjectId before storing. |
| AiInsights component | Takes `clientName?: string` only, calls `getResponse()` synchronously | Must become async, must add `clientId` prop |
| Installed packages | No `@google/generative-ai`, no Google Maps SDK | Use raw `fetch()` for Google Maps. Need to install `@google/generative-ai` for Gemini. |
| Env keys | `GEMINI_API_KEY` is empty | Must guard every Gemini call. Scan still works without it — just skips analysis. |
| Zod | `zod ^4.3.5` installed but unused in API routes | Use it for input validation in new endpoints to prevent runtime errors from bad payloads. |
| Error pattern | Routes use try/catch + JSON error responses. GET /clients returns 200 even on error to prevent crashes. | Follow same pattern: summary endpoint returns 200 with `{ status: 'error', message }` instead of 500. |

---

## Critical Fix #1: Vercel Function Timeout

The scan pipeline (Google Maps → BestTime → RevPASH → Gemini) takes 30-60 seconds. Vercel hobby tier kills functions at 10 seconds.

**Solution: Split the scan into separate sequential API calls triggered by the client.**

```
UI calls POST /api/ai-insights/scan         →  starts scan, returns immediately
UI polls  GET  /api/ai-insights/scan/status  →  returns progress %
Backend runs each stage as a separate DB write
```

Each stage does ONE thing, writes to DB, and returns. The client-side orchestrator calls them in sequence:

```
Stage 1: POST /scan/geocode       → geocodes address, creates BiSnapshot      (~1s)
Stage 2: POST /scan/competitors   → Google Maps Nearby Search                 (~3-5s)
Stage 3: POST /scan/details       → Place Details for each competitor         (~5-8s)
Stage 4: POST /scan/traffic       → BestTime for each competitor              (~5-8s)
Stage 5: POST /scan/revenue       → RevPASH calculation (local, no API)       (~1s)
Stage 6: POST /scan/analyze       → Gemini analysis                           (~3-5s)
```

Each stage is under 10 seconds. Each writes its results to the BiSnapshot document. If any stage fails, the previous stages' data is still persisted. The UI shows progress after each stage completes.

**Fallback if a stage fails:** Mark that stage as `'failed'` in `collectionStatus`, continue to the next stage. Revenue estimation works without BestTime (uses industry defaults). Gemini analysis works without complete data (it gets whatever we have). The UI shows what we have, warns about what's missing.

---

## Critical Fix #2: clientId Resolution

The `clientId` in URL params can be a MongoDB ObjectId string, a businessName, or a legacy seed id. The existing `[clientsId]/route.ts` resolves this with a 3-step lookup. Our BI endpoints need the same resolution.

**Solution: Shared helper function.**

```typescript
// src/app/lib/resolveClientId.ts
import { ObjectId } from 'mongodb';
import connectToDB from './mongodb';
import ClientModel from '../models/client';

export async function resolveClientId(clientParam: string): Promise<string | null> {
  await connectToDB();

  if (ObjectId.isValid(clientParam)) {
    const client = await ClientModel.findById(clientParam).select('_id').lean();
    if (client) return client._id.toString();
  }

  const byName = await ClientModel.findOne({ businessName: clientParam }).select('_id').lean();
  if (byName) return byName._id.toString();

  const bySeedId = await ClientModel.findOne({ id: clientParam }).select('_id').lean();
  if (bySeedId) return bySeedId._id.toString();

  return null;
}
```

Every BI endpoint starts with:
```typescript
const resolvedId = await resolveClientId(body.clientId);
if (!resolvedId) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
```

---

## Critical Fix #3: `getResponse` Sync → Async

Currently `AiInsights.tsx` calls `getResponse(text)` synchronously on line 263. Changing to async means:

**Current (sync, inside setTimeout):**
```typescript
setTimeout(() => {
  const response = getResponse(text);  // sync call to pattern matcher
  ...
}, 800);
```

**New (async, with real loading state):**
```typescript
setIsThinking(true);
try {
  const response = await getResponse(clientId, text);  // async API call
  // stream the response
} catch (err) {
  // show error message in chat, don't crash
} finally {
  setIsThinking(false);
}
```

The `setTimeout` is replaced by the actual network latency. The thinking indicator already exists and works.

**Fallback if API fails:** Show an inline error message in the chat: "Sorry, I couldn't process that request. Please try again." Never crash the UI. Never show a blank screen.

---

## Critical Fix #4: Missing Gemini Package

`@google/generative-ai` is not in `package.json`. Must install it before building Step 5.

```bash
npm install @google/generative-ai
```

**Fallback if `GEMINI_API_KEY` is empty:** The query endpoint returns a structured error response that the UI can render:

```typescript
if (!process.env.GEMINI_API_KEY) {
  return NextResponse.json({
    sentences: [
      "AI analysis is not configured yet.",
      "Your competitive data has been collected — connect a Gemini API key to unlock conversational insights."
    ],
    components: [{
      type: 'callout',
      data: { text: 'Ask your administrator to add GEMINI_API_KEY to the environment variables.' }
    }],
    followUps: [],
  });
}
```

The chatbot degrades gracefully — all the data collection still works, the data is still in the DB, only the conversational layer is missing.

---

## Critical Fix #5: `queryCache` Unbounded Growth

Same issue you caught with `versionHistory`. The `queryCache[]` array grows with every unique question.

**Solution: Cap at 50 entries, evict oldest on write.**

Queries are evicted by `cachedAt` (oldest first). 50 entries × ~2KB average = ~100KB max.

Additionally, add TTL-based eviction at read time: if `cachedAt + ttlSeconds < now`, skip the cache hit and re-query Gemini.

---

## Critical Fix #6: Client Model Has No Address

`IClient` has `businessName`, `jurisdiction`, `contactInfo` — but no address, no lat/lng.

**Two options:**

A. **Add address to Client model** (schema migration) — risky, touches existing clients.
B. **Store address only in BiSnapshot** — the scan endpoint accepts address as input, geocodes it, stores it in `BiSnapshot.location`.

**Decision: Option B.** The address is only needed for BI, not for core permit management. Keeps the Client model unchanged. The consultant enters the address when they first initialize AI Insights — the UI prompts for it.

---

## Step 1: BiSnapshot Schema + TypeScript Types

**File:** `src/app/lib/biSnapshot/schema.ts` (DONE)

Schema is written and linted clean. Includes:
- `VERSION_HISTORY_CAP = 20` with `$push + $slice` helper
- Compound index on `clientId + version`
- Geospatial index on `location.lat + location.lng`
- Collection status tracking for each pipeline stage

`queryCache` capped at 50 entries with `pushQueryCache()` helper (same pattern as versionHistory). ✓

---

## Step 2: Google Maps Places API — Service Layer

**Files to create:**
- `src/app/lib/googleMaps/client.ts` — low-level API wrapper
- `src/app/lib/googleMaps/competitorDiscovery.ts` — orchestration logic

**What it does:**

1. **Nearby Search** — Given lat/lng + radius, find restaurants/bars/cafes
   - Endpoint: `https://places.googleapis.com/v1/places:searchNearby`
   - Uses Places API (New), NOT legacy. Uses field masks for cost control.
   - Request body: `{ includedTypes: ["restaurant","bar","cafe"], locationRestriction: { circle: { center: { latitude, longitude }, radius } }, maxResultCount: 20 }`
   - Header: `X-Goog-Api-Key`, `X-Goog-FieldMask`
   - Returns max 20 results per call (no pagination in Nearby Search New).

2. **Place Details** — For each competitor, fetch reviews + extended data
   - Endpoint: `https://places.googleapis.com/v1/places/{placeId}`
   - Reviews: up to 5 per place (API limit).

**Error handling per call:**

```typescript
async function searchNearby(lat: number, lng: number, radius: number): Promise<Competitor[] | null> {
  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Google Maps Nearby Search failed:', res.status, err);
      return null;  // null = failed, empty array = no results
    }
    const data = await res.json();
    return (data.places ?? []).map(mapPlaceToCompetitor);
  } catch (err) {
    console.error('Google Maps Nearby Search network error:', err);
    return null;
  }
}
```

**Fallback chain:**
- API key invalid → return `null`, set `collectionStatus.googleMaps.status = 'failed'`, skip to next stage
- No results found → return `[]`, set `collectionStatus.googleMaps.placesFound = 0`, continue
- Network timeout → retry once with exponential backoff, then fail gracefully

**Alignment check:**
- Uses raw `fetch()` — no external SDK needed ✓
- `GOOGLE_MAPS_API_KEY` is set in `.env.local` ✓
- No CORS issues (server-side only, runs in API route) ✓

---

## Step 3: BestTime API — Foot Traffic Layer

**Files to create:**
- `src/app/lib/bestTime/client.ts` — API wrapper
- `src/app/lib/bestTime/trafficAnalysis.ts` — processing logic

**What it does:**

1. **New Forecast** — For each competitor, request a foot traffic forecast
   - Endpoint: `POST https://besttime.app/api/v1/forecasts`
   - Body: `{ api_key_private, venue_name, venue_address }`
   - Returns: `venue_id`, hourly data for 7 days, peak/quiet hours, dwell time

**Error handling:**
```typescript
async function getForecast(name: string, address: string): Promise<FootTrafficData | null> {
  try {
    const res = await fetch('https://besttime.app/api/v1/forecasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key_private: process.env.BESTTIME_API_KEY_PRIVATE,
        venue_name: name,
        venue_address: address,
      }),
    });

    if (!res.ok) {
      console.error(`BestTime forecast failed for "${name}":`, res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 'OK' || !data.analysis) {
      console.warn(`BestTime: no data for "${name}" (status: ${data.status})`);
      return null;
    }

    return mapBestTimeResponse(data);
  } catch (err) {
    console.error(`BestTime network error for "${name}":`, err);
    return null;
  }
}
```

**Fallback chain:**
- API key missing → skip entire BestTime stage, log warning, set status to `'failed'`
- Venue not found (BestTime returns `status !== 'OK'`) → set `footTraffic: undefined` for that competitor, continue to next
- Rate limit exceeded → stop processing remaining competitors, mark as `'failed'`, save what we have
- All venues fail → RevPASH engine uses industry defaults for dwell time and occupancy

**Alignment check:**
- `BESTTIME_API_KEY_PRIVATE` is set in `.env.local` ✓
- Raw `fetch()`, no SDK needed ✓
- BestTime free tier: 50 calls/month. 20 competitors = 20 calls per scan. Monitor usage. ✓

---

## Step 4: Revenue Estimation Engine (RevPASH) — DONE

**Files created:**
- `src/app/lib/revenue/revpash.ts` — production algorithm (350 lines)
- `src/app/lib/revenue/benchmarks.ts` — industry lookup tables (310 lines)

**Schema updated:**
- `IRevenueEstimate` replaced with daypart-level breakdown, sourced values, confidence scoring

### How the algorithm works

This is a **daypart × day-of-week matrix model** based on the Cornell CHR RevPASH methodology, adapted for the Canadian market with BestTime foot-traffic integration.

**The core formula per cell (1 daypart × 1 day):**

```
daypartRevenue = seats
  × seatUtilization          (0.62-0.82, accounts for party/table mismatch)
  × avgOccupancy             (from BestTime calibrated data or benchmark)
  × hoursInDaypart           (overlap of venue hours with daypart window)
  × turnsPerHour             (from BestTime dwell time or benchmark)
  × (avgFoodCheck + avgBevCheck)  (daypart-specific, from menu or benchmark)
```

**The full computation:**

```
weeklyRevenue = Σ over 7 days (
    Σ over active dayparts (
        daypartRevenue × dayMultiplier(if no BestTime data)
    )
)

annualRevenue = weeklyRevenue × 52
annualSeasonAdjusted = annualRevenue × seasonalityFactor (Toronto monthly curve)
```

### What makes this production-grade

1. **5 dayparts, not 1 flat rate.** Breakfast, lunch, happy hour, dinner, and late-night each have their own check size, turn rate, and occupancy — because a $16 lunch check at 1.1 turns/hr is completely different from a $32 dinner check at 0.6 turns/hr.

2. **BestTime calibration, not raw percentages.** BestTime reports 0-100 "busyness" relative to a venue's own peak. A score of 80 does NOT mean 80% occupied. We calibrate using venue-type-specific peak occupancy rates (e.g., a bar at peak is ~92% full, fine dining at peak is ~80% full). `calibratedOccupancy = busyScore/100 × peakOccupancyRate`.

3. **Seat utilization factor.** A 4-top with a party of 2 = 50% seat utilization for that table. Industry average is 62-82% depending on venue type (Cornell research). The naive algorithm assumed 100%.

4. **Source-tagged every input.** Every single number in the estimate carries a `{ value, source }` tuple — `'menu_median'`, `'besttime_dwell'`, `'industry_avg'`, etc. The UI can show exactly what's real data vs. estimated, and the confidence score computes automatically.

5. **Confidence scoring.** Weighted score (0-100) based on which inputs are from real data vs. defaults. Grades A-D. Menu pricing (25%), foot traffic (30%), seat count (20%), dwell time (10%), operating hours (10%), seasonality (5%).

6. **Toronto seasonality curve.** Monthly multipliers from Restaurants Canada + StatCan data. Jan/Feb = 0.80-0.82 (winter slump), Jun-Aug = 1.15-1.18 (patio season), Dec = 0.97 (holiday lift minus NYE closures).

7. **Automatic scenario projections.** If a venue doesn't have late-night kitchen, the engine automatically projects what adding one would do. Same for brunch. Also computes an 8% price-increase scenario using NRA price elasticity data (-0.3 to -0.5 for casual dining).

8. **Beverage split.** Food and beverage revenue are computed separately per daypart because bev attachment varies wildly (happy hour bev is 2x lunch bev). Venue-type-specific ratios: bars at 60% bev, casual dining at 28%, fine dining at 32%.

9. **Ramp-up curve.** New venues don't hit steady state immediately. Month 1 = 35% of steady state, month 6 = 85%, month 12 = 100%. Based on industry consensus.

10. **Never crashes.** Every input has a fallback. No division by zero. Every competitor gets an estimate even with zero data (just with a confidence grade of D). The `estimateCorridorRevenue()` wrapper catches errors per-competitor so one bad venue doesn't kill the batch.

### Fallback chain (production)

| Input | Source Priority | Fallback |
|-------|----------------|----------|
| Seat count | Consultant input → Google Maps | Venue-type default (bar: 55, casual: 85, fine: 50) |
| Food check | Menu median × daypart ratio → Price level lookup | Venue-type × daypart benchmark |
| Bev check | (no venue-specific source) | Venue-type × daypart benchmark |
| Turn rate | BestTime dwell time (capped per daypart) | Venue-type × daypart benchmark |
| Occupancy | BestTime hourly data (calibrated) | Peak occupancy × 0.55 |
| Day multiplier | BestTime weekly pattern | Venue-type benchmark (Mon=0.75, Sat=1.35, etc.) |
| Operating hours | Google Maps | 11AM-11PM default |
| Seasonality | (no venue-specific) | Toronto monthly curve |
| Seat utilization | (no venue-specific) | Venue-type benchmark (0.62-0.82) |

---

## Step 5: Gemini API — Synthesis & Chatbot Layer

**Files to create:**
- `src/app/lib/gemini/client.ts` — API wrapper
- `src/app/lib/gemini/prompts.ts` — system prompts
- `src/app/lib/gemini/insights.ts` — structured extraction

**Package to install:**
```bash
npm install @google/generative-ai
```

**What it does:**

1. **Query endpoint** — Takes user question + BiSnapshot context, returns `BrainResponse`
2. **Batch analysis** — Extracts review themes, executive summary, opportunities, threats

**Structured output approach:**

```typescript
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        sentences: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        components: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT } },
        followUps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['sentences', 'components', 'followUps'],
    },
  },
});
```

**Context window management:**

A full BiSnapshot with 20 competitors could be 50K+ tokens. We MUST compress:

```typescript
function buildContext(snapshot: IBiSnapshot, query: string): string {
  // Always include: aggregates, collection status
  // Conditionally include: top 5 most relevant competitors (by query topic)
  // Never include: raw weekRaw arrays, full review text, queryCache
  const summary = {
    location: snapshot.location,
    totalCompetitors: snapshot.aggregates?.totalCompetitors,
    menusFound: snapshot.aggregates?.menusFound,
    avgRating: snapshot.aggregates?.avgCorridorRating,
    pricingBands: snapshot.aggregates?.pricingBands,
    topThemes: snapshot.aggregates?.topReviewThemes?.slice(0, 6),
    gaps: snapshot.aggregates?.underservedCategories,
    corridorInsights: snapshot.aggregates?.corridorInsights,
    executiveSummary: snapshot.aggregates?.executiveSummary,
  };
  // ~3-5K tokens instead of 50K
  return JSON.stringify(summary, null, 0);
}
```

**Error handling:**
```typescript
async function queryGemini(prompt: string): Promise<BrainResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      sentences: ['AI analysis is not configured yet. Your competitive data has been collected.'],
      components: [{ type: 'callout', data: { text: 'Connect a Gemini API key to unlock conversational insights.' } }],
      followUps: [],
    };
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Validate structure matches BrainResponse
    if (!Array.isArray(parsed.sentences) || !Array.isArray(parsed.followUps)) {
      throw new Error('Gemini returned invalid structure');
    }

    return parsed as BrainResponse;
  } catch (err) {
    console.error('Gemini query failed:', err);

    // Fallback: return a safe error response the UI can render
    return {
      sentences: ['I ran into an issue processing that question. Please try rephrasing or ask something else.'],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
        'How does my pricing compare?',
      ],
    };
  }
}
```

**Fallback chain:**
- `GEMINI_API_KEY` empty → return "not configured" message (not an error, just informational)
- Gemini returns non-JSON → catch parse error, return safe fallback message
- Gemini returns JSON with wrong shape → validate fields, return fallback
- Gemini rate limited (429) → return "try again in a moment" message
- Network error → return "connection issue" message

**NEVER** throw an unhandled error from the Gemini layer. Always return a valid `BrainResponse`.

**Alignment check:**
- `@google/generative-ai` must be installed (not yet in package.json) ✓
- Uses `gemini-2.0-flash` (fast, cheap, structured output support) ✓
- Response format matches existing `BrainResponse` type exactly ✓
- All component types (`metric-grid`, `bar-list`, `data-table`, `price-bands`, `callout`) are documented in the system prompt for Gemini ✓

---

## Step 6: API Endpoints

**Files to create:**
- `src/app/api/ai-insights/summary/route.ts`
- `src/app/api/ai-insights/query/route.ts`
- `src/app/api/ai-insights/scan/route.ts`
- `src/app/api/ai-insights/scan/geocode/route.ts`
- `src/app/api/ai-insights/scan/competitors/route.ts`
- `src/app/api/ai-insights/scan/details/route.ts`
- `src/app/api/ai-insights/scan/traffic/route.ts`
- `src/app/api/ai-insights/scan/revenue/route.ts`
- `src/app/api/ai-insights/scan/analyze/route.ts`
- `src/app/api/ai-insights/ingest/route.ts`
- `src/app/lib/resolveClientId.ts`

### Route pattern (matching existing codebase conventions):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';      // Mongoose connection (NOT clientPromise)
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { z } from 'zod';

const RequestSchema = z.object({
  clientId: z.string().min(1),
  // ... other fields
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDB();

    const resolvedId = await resolveClientId(parsed.data.clientId);
    if (!resolvedId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ... business logic ...

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/... error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Key conventions followed from existing codebase:**
- `import connectToDB from '@/app/lib/mongodb'` — using the `@/` path alias ✓
- `try/catch` around everything ✓
- `console.error` with route name prefix ✓
- `err: unknown` type (TypeScript strict) ✓
- `NextRequest` / `NextResponse` from `next/server` ✓
- No `params` as Promise needed (these are non-dynamic routes) ✓
- Zod validation on input (new — but `zod` is already in `package.json`) ✓

### `GET /api/ai-insights/summary?clientId=xxx`

Returns BI summary. **Must return 200 even on error** (follows GET /clients pattern to prevent page crashes).

```typescript
Response (200): {
  status: 'ready' | 'collecting' | 'initializing' | 'not_started' | 'error';
  readinessPercent: number;
  summary: { ... } | null;
  location: { ... } | null;
  error?: string;
}
```

If no BiSnapshot exists for this client → `{ status: 'not_started', readinessPercent: 0, summary: null }`.
Never 500. Never crash the page.

### `POST /api/ai-insights/query`

Chatbot query. Response always matches `BrainResponse`.

```typescript
Request:  { clientId: string; query: string }
Response: { sentences: string[]; components: ResponseComponent[]; followUps: string[] }
```

**Logic:**
1. Resolve clientId → ObjectId
2. Load BiSnapshot (`.lean()` for performance)
3. Check queryCache — if hit and `cachedAt + ttlSeconds > now`, return cached
4. Build compressed context from snapshot
5. Call Gemini
6. Validate response shape
7. Cache the response (with `$push + $slice` to cap at 50)
8. Return

If BiSnapshot doesn't exist → return a message telling the user to initialize AI Insights first.
If Gemini fails → return fallback message (never throw).

### Scan sub-endpoints

Each `POST /api/ai-insights/scan/{stage}` follows the same pattern:

```typescript
Request:  { clientId: string, snapshotId?: string }
Response: { success: boolean; snapshotId: string; progress: number; error?: string }
```

The client-side orchestrator:
```typescript
async function runScan(clientId: string, address: string) {
  setProgress(0);
  // Stage 1
  const geo = await fetch('/api/ai-insights/scan/geocode', {
    method: 'POST',
    body: JSON.stringify({ clientId, address }),
  }).then(r => r.json());

  if (!geo.success) { setError(geo.error); return; }
  setProgress(15);

  // Stage 2
  const comp = await fetch('/api/ai-insights/scan/competitors', {
    method: 'POST',
    body: JSON.stringify({ clientId, snapshotId: geo.snapshotId }),
  }).then(r => r.json());

  if (!comp.success) { /* show warning, continue */ }
  setProgress(35);

  // ... stages 3-6 ...
  setProgress(100);
}
```

If any stage fails, the UI shows a warning but continues. Partial data is better than no data.

---

## Step 7: Wire Up the UI — Replace Hardcoded Files

### 7a. Replace `aiInsightsBrain.ts`

**Current:** 651 lines of hardcoded pattern matching.
**New:** ~50 lines — async API calls.

```typescript
// src/app/lib/aiInsightsBrain.ts (rewritten)
export type ComponentType = 'metric-grid' | 'bar-list' | 'data-table' | 'callout' | 'price-bands';

// Keep ALL existing type exports — the UI depends on them
export interface MetricItem { ... }   // unchanged
export interface BarItem { ... }      // unchanged
export interface TableRow { ... }     // unchanged
export interface ResponseComponent { ... }  // unchanged
export interface PriceBand { ... }    // unchanged
export interface BrainResponse { ... }      // unchanged

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

export async function getWelcomeResponse(clientId: string): Promise<BrainResponse> {
  try {
    const res = await fetch(`/api/ai-insights/summary?clientId=${encodeURIComponent(clientId)}`);
    const data = await res.json();
    if (data.status === 'not_started') {
      return {
        sentences: ['AI Insights hasn\'t been set up for this client yet.', 'Click "Initialize" below to scan the competitive landscape.'],
        components: [],
        followUps: [],
      };
    }
    return buildWelcomeFromSummary(data);
  } catch {
    return {
      sentences: ['Welcome to AI Insights. Ask me anything about the competitive landscape.'],
      components: [],
      followUps: ["What's the competitive landscape?", 'Where are the biggest gaps?'],
    };
  }
}
```

**Critical: Keep all type exports.** The `AiInsights.tsx` component imports `MetricItem`, `BarItem`, `PriceBand`, `ResponseComponent`, `BrainResponse`, `ComponentType` from this file. Removing any of them breaks the build.

### 7b. Delete `mockAiInsights.ts`

Only after all API endpoints are working and returning real data. **Do not delete prematurely** — keep it as a reference until Step 8 testing is complete.

### 7c. Update `AiInsights.tsx`

Changes required:

1. **Props:** `AiInsightsProps` gains `clientId: string` (required)
2. **Import change:** `getResponse` and `WELCOME_RESPONSE` become async imports
3. **sendMessage:** Becomes async — drop the `setTimeout`, use real `await`
4. **Welcome mount:** Calls `getWelcomeResponse(clientId)` instead of using `WELCOME_RESPONSE` constant
5. **Header:** Fetches summary data from API to replace hardcoded "18 competitors · 14 menus"
6. **Initialization:** If status is `'not_started'`, show an address input + "Initialize" button
7. **Progress:** While scan runs, show a progress bar (uses state from the scan orchestrator)
8. **Error boundary:** Wrap the component in an error boundary so a crash in AI Insights doesn't take down the whole client page

### 7d. Update `ClientPageClient.tsx`

Line 100 currently:
```typescript
return <AiInsights clientName={client?.businessName} />;
```

Changes to:
```typescript
return <AiInsights clientId={clientId} clientName={client?.businessName} />;
```

`clientId` is already available in scope (line 35). No other changes needed.

---

## Step 8: End-to-End Testing Checklist

### Happy path:
- [ ] Create a new client → go to AI Insights → see "not initialized" state
- [ ] Enter address → click Initialize → progress bar fills → data populates
- [ ] Ask "What's the competitive landscape?" → structured response with metrics
- [ ] Ask a follow-up → cache hit (fast) or new Gemini call
- [ ] Refresh the page → data persists from BiSnapshot

### Error paths:
- [ ] `GEMINI_API_KEY` empty → all stages work except Gemini analysis → chatbot shows "not configured" message
- [ ] `BESTTIME_API_KEY_PRIVATE` missing → traffic stage fails → RevPASH uses defaults → revenue estimates still show
- [ ] `GOOGLE_MAPS_API_KEY` invalid → competitor discovery fails → UI shows "failed to discover competitors" → manual ingest still works
- [ ] MongoDB connection fails → 500 response → UI shows "connection error" → no crash
- [ ] Invalid clientId → 404 response → UI shows "client not found"
- [ ] Gemini returns garbage → parse error caught → fallback message shown
- [ ] Network timeout on any API call → caught → error logged → partial data preserved
- [ ] Client has no address → UI prompts for address before allowing scan

### Edge cases:
- [ ] Client in a rural area with 0 competitors → empty competitors array → UI shows "No competitors found within radius"
- [ ] Client with mock/seed ID (not ObjectId) → `resolveClientId` handles the lookup
- [ ] Scan started but page navigated away → data still saves to DB → next visit shows partial data
- [ ] Same client scanned twice → upsert, not duplicate BiSnapshot
- [ ] 50+ queries asked → queryCache capped at 50, oldest evicted

---

## Dependency Graph (Updated)

```
Step 1: Schema (DONE)
  ↓
  ├── resolveClientId helper (needed by all endpoints)
  │
Step 2: Google Maps service ──┐
  ↓                           │
Step 3: BestTime service ─────┤
  ↓                           │
Step 4: RevPASH engine ←──────┘ (needs data from 2+3, but runs with defaults)
  ↓
Step 5: Gemini layer (needs data from 2-4, but works with partial data)
  ↓
Step 6: API endpoints (orchestrates 2-5, split into sub-routes for timeout)
  ↓
Step 7: UI swap (replace hardcoded files)
  ↓
Step 8: Testing
```

Steps 2 and 3 can be built in parallel.
Step 4 is pure math — can be built in parallel with 2+3.
Step 5 can start as soon as we have the package installed.
Step 6 ties everything together.
Step 7 is pure frontend.

---

## Files to Create (21 new files)

| File | Purpose | Status |
|------|---------|--------|
| `src/app/lib/biSnapshot/schema.ts` | Mongoose model | **DONE** |
| `src/app/lib/revenue/revpash.ts` | RevPASH daypart × day-of-week algorithm | **DONE** |
| `src/app/lib/revenue/benchmarks.ts` | Industry defaults + lookup tables | **DONE** |
| `src/app/lib/ingest/pdfParser.ts` | PDF menu parser (unpdf) | **DONE** |
| `src/app/lib/ingest/menuNormalizer.ts` | CSV/JSON/PDF normalizer + deduplication | **DONE** |
| `src/app/api/ai-insights/ingest/route.ts` | POST menu upload (CSV/JSON/PDF) | **DONE** |
| `src/app/components/MenuUpload.tsx` | Upload UI with drag-drop + PDF warning | **DONE** |
| `src/app/lib/resolveClientId.ts` | Shared clientId resolution helper | Planned |
| `src/app/lib/googleMaps/client.ts` | Google Maps API wrapper | Planned |
| `src/app/lib/googleMaps/competitorDiscovery.ts` | Nearby search + place details | Planned |
| `src/app/lib/bestTime/client.ts` | BestTime API wrapper | Planned |
| `src/app/lib/bestTime/trafficAnalysis.ts` | Traffic data processing | Planned |
| `src/app/lib/gemini/client.ts` | Gemini API wrapper | Planned |
| `src/app/lib/gemini/prompts.ts` | System prompts | Planned |
| `src/app/lib/gemini/insights.ts` | Structured extraction | Planned |
| `src/app/api/ai-insights/summary/route.ts` | GET summary | Planned |
| `src/app/api/ai-insights/query/route.ts` | POST chatbot | Planned |
| `src/app/api/ai-insights/scan/geocode/route.ts` | POST geocode stage | Planned |
| `src/app/api/ai-insights/scan/competitors/route.ts` | POST competitor discovery | Planned |
| `src/app/api/ai-insights/scan/details/route.ts` | POST place details stage | Planned |
| `src/app/api/ai-insights/scan/traffic/route.ts` | POST foot traffic stage | Planned |
| `src/app/api/ai-insights/scan/revenue/route.ts` | POST revenue calculation | Planned |
| `src/app/api/ai-insights/scan/analyze/route.ts` | POST Gemini analysis | Planned |

## Files to Modify (4 files)

| File | Change |
|------|--------|
| `src/app/lib/aiInsightsBrain.ts` | Replace pattern matching with async API calls. KEEP all type exports. |
| `src/app/components/AiInsights.tsx` | Add `clientId` prop, async queries, init flow, progress bar, upload button |
| `src/app/clients/[clientsId]/ClientPageClient.tsx` | Pass `clientId` to AiInsights (1-line change) |
| `next.config.ts` | Added `unpdf` to `serverExternalPackages` (**DONE**) |

## Files to Delete (1 file, deferred)

| File | When |
|------|------|
| `src/app/lib/mockAiInsights.ts` | After Step 8 testing confirms real data flows correctly |

---

## Blockers

| Blocker | Status | Action |
|---------|--------|--------|
| `GEMINI_API_KEY` empty | **Blocking Step 5** | Get key from https://aistudio.google.com/apikey |
| `@google/generative-ai` not installed | **Blocking Step 5** | `npm install @google/generative-ai` |
| Vercel 10s timeout | **Resolved** | Split scan into 6 sub-endpoints, each under 10s |
| No address on Client model | **Resolved** | Scan endpoint accepts address parameter |
| queryCache unbounded | **Resolved** | Added `QUERY_CACHE_CAP = 50` + `pushQueryCache()` helper |

---

## Estimated Build Order

| Step | Est. Time | Status |
|------|-----------|--------|
| 1. Schema | — | **DONE** |
| 4. RevPASH engine + benchmarks | — | **DONE** |
| Ingest: PDF parser + normalizer + endpoint + UI | — | **DONE** |
| 2. resolveClientId + Google Maps service | 2-3 hours | Not started |
| 3. BestTime service | 1-2 hours | Not started |
| 5. Gemini layer | 2-3 hours | Blocked: `GEMINI_API_KEY` |
| 6. Scan sub-endpoints | 2-3 hours | After 2-5 |
| 7. UI swap (aiInsightsBrain + AiInsights) | 2-3 hours | After 6 |
| 8. Testing | 1-2 hours | After 7 |
| **Remaining** | **~10-14 hours** | |
