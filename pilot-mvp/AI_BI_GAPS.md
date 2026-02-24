# AI BI — Known Gaps & Deferred Work

Tracking things that are hardcoded, not yet built, or need real implementation.
Updated alongside Workstream 4 (AI BI Engine).

---

## 1. Data Ingest Endpoint — NOT BUILT

**Status:** Does not exist. The overtime doc calls for `POST /api/ai-insights/ingest` but zero code exists.

**What it needs to do:**
- Accept CSV/JSON uploads of competitor menu data (items, prices, categories)
- Accept review data if manually collected
- Store per-client in MongoDB as part of the BI snapshot
- Validate and deduplicate against data already pulled from Google Maps `foodMenus`

**Why it matters:**
Google Maps `foodMenus` covers ~60-70% of restaurants. For the rest, consultants upload menus manually (they already have this data from their own research). Without the ingest endpoint, there's no way to fill the gap.

**UI implication:**
Show real coverage: "Menus found for 11 of 18 venues" with a CTA to upload missing ones. Never fake the number.

**Depends on:** MongoDB schema from Workstream 1 (client model) being stable.

---

## 2. Review Depth — Thin but Workable

**Status:** Google Maps Places API returns max 5 reviews per place. No sort parameter exists in the API — reviews come back in Google's default order (typically "most relevant").

**What to do:**
- Grab all 5 reviews per competitor (Google returns "most relevant" by default, which is what we want — these surface the highest-signal reviews, not random recent ones)
- Client-side: sort by rating descending as a secondary pass if needed
- Feed all reviews to Gemini for theme extraction
- With 18 competitors × 5 reviews = 90 reviews — enough for qualitative theme analysis

**UI implication:**
Never claim a specific review count like "~340 reviews analyzed." Instead say "Based on top reviews across 18 venues" — honest and still compelling.

**Future upgrade:** Add Yelp Fusion API ($229/mo) for deeper review corpus when budget allows.

---

## 3. Revenue Estimation — No API, Use Algorithm

**Status:** No API provides actual restaurant revenue, covers, or check sizes. The current demo fabricates numbers like "+31% late-night check size" and "$150–200K annual revenue addition."

**Solution: RevPASH-based estimation algorithm**

Use the industry-standard Revenue Per Available Seat Hour (RevPASH) framework, fed with data we DO have:

### Inputs (from our APIs + reasonable defaults)

| Input | Source | Fallback |
|-------|--------|----------|
| Seat count | Google Maps Place Details (or consultant input) | Industry avg by venue type |
| Operating hours | Google Maps `regularOpeningHours` | — |
| Foot traffic % by hour | BestTime `day_raw` (0-100% per hour) | — |
| Price level | Google Maps `priceLevel` (1-4) | — |
| Avg check size | Derived from menu prices via `foodMenus` | Industry benchmark by price level |
| Table turn time | BestTime `venue_dwell_time_avg` | Industry avg by venue type |

### Algorithm

```
For each competitor venue:

  1. avg_check = median(menu_item_prices) × items_per_cover_estimate
     - items_per_cover_estimate: 2.5 (casual), 3.5 (fine dining)
     - If no menu data: use price_level lookup table
       price_level 1 → $15, 2 → $30, 3 → $55, 4 → $90

  2. turns_per_hour = 60 / dwell_time_avg
     - dwell_time_avg from BestTime (e.g. 82 min → 0.73 turns/hr)
     - If unavailable: casual=1.0, fast_casual=2.0, fine_dining=0.5

  3. For each operating hour h:
       hourly_revenue = seats × occupancy(h) × turns_per_hour × avg_check
       where occupancy(h) = besttime_day_raw[h] / 100

  4. daily_revenue = sum(hourly_revenue for all operating hours)

  5. weekly_revenue = sum(daily_revenue for Mon-Sun)

  6. annual_revenue = weekly_revenue × 52
```

### For incremental revenue projections (e.g. "what if I add late-night?"):

```
  late_night_incremental =
    seats × avg_occupancy_late(BestTime 11PM-2AM) ×
    turns_per_hour × avg_check × late_night_premium(1.31) ×
    nights_per_week(2-3) × 52

  where late_night_premium = 1.31 (industry benchmark: +31% check size
  for late-night service, sourced from NRA data)
```

### Caveats to surface in UI:
- Always label as "Estimated based on foot traffic data and industry benchmarks"
- Show the inputs used so consultants can adjust (seat count, check size)
- Never present as actual revenue data

---

## 4. Event & Booking Data — No API, Use Gemini + Reviews

**Status:** No API tracks private events, corporate bookings, or birthday party revenue.

**What to do now:**
- Scan the 5 Google reviews per venue for event-related keywords: "birthday", "corporate", "private dining", "event", "party", "booked", "reservation"
- Feed matches to Gemini to assess whether the venue captures event revenue
- Gemini can estimate event revenue contribution using general industry knowledge (~15-25% of revenue for venues with private dining, per NRA benchmarks)

**Future upgrade options:**
- OpenTable API (if they open access) for reservation/booking volume
- Resy API for booking data
- Eventbrite API for public event listings at venues
- Scrape venue websites for "private events" pages

---

## 5. Hardcoded Values Still in Codebase — MUST REMOVE

These files contain hardcoded demo data that Workstream 4 must replace:

| File | What's Hardcoded |
|------|-----------------|
| `src/app/lib/aiInsightsBrain.ts` | Entire file — pattern-matching fake AI with canned responses for one client |
| `src/app/lib/mockAiInsights.ts` | Static menu overlap, pricing cards, review themes, all for "King West Kitchen & Bar" |
| `src/app/components/AiInsights.tsx` | Header hardcodes "King West, Toronto", "18 competitors · 14 menus", "Feb 2026" |

**Plan:**
- `aiInsightsBrain.ts` → Replace with Gemini API calls via `/api/ai-insights/query`
- `mockAiInsights.ts` → Replace with data from MongoDB BI snapshots (populated by Google Maps + BestTime + ingest)
- `AiInsights.tsx` → Read real counts from API response, show actual client name/location

---

## 6. API Endpoints — NOT BUILT

Per the overtime doc, these need to exist:

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/ai-insights/summary` | GET | Per-client BI summary (competitor count, menu coverage, top insights) | Not built |
| `/api/ai-insights/query` | POST | Chatbot query — sends question + client context to Gemini, returns `{sentences, components, followUps}` | Not built |
| `/api/ai-insights/ingest` | POST | Upload competitor/menu/review data (CSV/JSON) | Not built |

**Shared contract:** All endpoints require `clientId`. Response shape must stay compatible with existing UI: `{ sentences: string[], components: ResponseComponent[], followUps: string[] }`.

---

## 7. BI Data Model / MongoDB Schema — NOT BUILT

Need a schema for per-client BI snapshots stored in MongoDB:

```
BiSnapshot {
  clientId: ObjectId (ref → Client)
  location: { lat, lng, address, radius }
  competitors: [{
    placeId: string         // Google Maps place_id
    name: string
    address: string
    lat: number
    lng: number
    rating: number
    priceLevel: number
    hours: object           // regularOpeningHours
    menuItems: [{
      name: string
      price: number
      category: string
      source: 'google_maps' | 'manual_ingest'
    }]
    reviews: [{
      text: string
      rating: number
      authorName: string
      relativeTime: string
    }]
    footTraffic: {
      venueId: string       // BestTime venue_id
      weekRaw: number[][]   // 7 days × 24 hours
      peakHours: object[]
      dwellTimeAvg: number
    }
    estimatedRevenue: {
      daily: number
      annual: number
      method: 'revpash' | 'manual'
    }
  }]
  aggregates: {
    totalCompetitors: number
    menusFound: number
    reviewsAnalyzed: number
    avgCorridorPrice: object   // by category
    topReviewThemes: object[]
    underservedCategories: object[]
  }
  createdAt: Date
  updatedAt: Date
}
```

**Depends on:** Workstream 1 client schema being stable.

---

## 8. Discussion Tab — UI Inaccessible

**Status:** The Discussion tab in the permit detail left sidebar (`PermitDetailView.tsx`, line 2187) is visually/UI inaccessible.

**Location:** `src/app/components/PermitDetailView.tsx`
- Left sidebar nav: `<aside className="w-56">` (line 2352)
- Discussion section definition (line 2187): `{ id: 'discussion', label: 'Discussion', icon: MessageCircle }`
- Discussion content renders at line 1572 (`case 'discussion':`)

**Content it renders:**
- Filter bar (All / Unresolved / Mentions / Pin)
- Add Comment box with @mention, attachments, emoji
- Comments list with resolve/pin/reply actions

**Needs:** Visual/UX fix to make the tab accessible. This is outside Workstream 4 but tracked here for awareness.

---

## Priority Order

1. **API endpoints** (summary, query, ingest) — unblocks everything
2. **BI data model** — needed by endpoints
3. **Google Maps + BestTime integration** — populates real data
4. **Revenue estimation algorithm** — enhances insights
5. **Remove hardcoded files** — swap in real data path
6. **Event/booking analysis** — nice-to-have, Gemini handles it qualitatively for now
