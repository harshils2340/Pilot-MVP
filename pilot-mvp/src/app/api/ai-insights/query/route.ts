import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot, {
  type IBiSnapshot,
  type IAggregates,
  type ICompetitor,
  pushQueryCache,
} from '@/app/lib/biSnapshot/schema';
import { Types } from 'mongoose';

const RequestSchema = z.object({
  clientId: z.string().min(1),
  query: z.string().min(1).max(500),
});

interface BrainResponse {
  sentences: string[];
  components: { type: string; data: unknown }[];
  followUps: string[];
}

// ─── Restaurant guardrails ──────────────────────────────────────────────────

const RESTAURANT_KEYWORDS = [
  'competi', 'restaurant', 'menu', 'pric', 'food', 'drink', 'cocktail', 'bar',
  'cafe', 'dining', 'brunch', 'lunch', 'dinner', 'late.?night', 'kitchen',
  'review', 'rating', 'customer', 'complaint', 'foot traffic', 'busy', 'peak',
  'revenue', 'gap', 'opportunit', 'underserv', 'differentiat', 'landscape',
  'corridor', 'cuisine', 'chef', 'server', 'wait', 'table', 'seat', 'patio',
  'permit', 'license', 'liquor', 'alcohol', 'wine', 'beer', 'espresso',
  'burger', 'pizza', 'sushi', 'share plate', 'appetizer', 'entree', 'dessert',
  'delivery', 'takeout', 'open', 'close', 'hour', 'strategy', 'margin',
  'overhead', 'cost', 'staffing', 'location', 'neighbourhood', 'neighborhood',
  'overview', 'summary', 'everything', 'full picture', 'tell me', 'show me',
  'what do you know', 'how does', 'compare', 'who', 'where', 'best', 'worst',
];

function isRestaurantRelated(query: string): boolean {
  const lower = query.toLowerCase();
  return RESTAURANT_KEYWORDS.some(kw => new RegExp(kw).test(lower));
}

const OFF_TOPIC_RESPONSE: BrainResponse = {
  sentences: [
    "I'm specialized in restaurant competitive intelligence.",
    'I can help with questions about your competitive landscape, pricing, menu gaps, reviews, foot traffic, and revenue projections.',
  ],
  components: [],
  followUps: [
    "What's the competitive landscape?",
    'Where are the biggest gaps I can own?',
    'How does my pricing compare?',
    "What are customers complaining about?",
  ],
};

// ─── Cache check ────────────────────────────────────────────────────────────

function checkCache(
  snapshot: IBiSnapshot,
  query: string,
): BrainResponse | null {
  if (!snapshot.queryCache?.length) return null;

  const lower = query.toLowerCase().trim();
  const now = Date.now();

  for (const entry of snapshot.queryCache) {
    if (entry.query.toLowerCase().trim() === lower) {
      const age = now - new Date(entry.cachedAt).getTime();
      if (age < entry.ttlSeconds * 1000) {
        return entry.response as BrainResponse;
      }
    }
  }
  return null;
}

// ─── Template response builder ──────────────────────────────────────────────
// Used when Gemini is not available. Reads real data from BiSnapshot.

function buildTemplateResponse(
  query: string,
  snapshot: IBiSnapshot,
): BrainResponse {
  const lower = query.toLowerCase();
  const agg = snapshot.aggregates;
  const comps = snapshot.competitors ?? [];

  if (!agg || comps.length === 0) {
    return {
      sentences: [
        'The competitive scan is still in progress or no data has been collected yet.',
        'Once the scan is complete, I can answer questions about pricing, menu gaps, reviews, and more.',
      ],
      components: [],
      followUps: [],
    };
  }

  // More specific patterns checked first, then broader categories

  // Specific review quotes
  if (/specific review|actual review|exact review|show.*review|quote|what.*say|what.*said|real review|example review|sample review|read.*review/.test(lower)) {
    return buildSpecificReviewsResponse(comps);
  }
  // Specific competitor lookup
  if (/tell me about (.+)|how is (.+) doing|what about (.+)|info on (.+)/.test(lower)) {
    const match = lower.match(/tell me about (.+)|how is (.+) doing|what about (.+)|info on (.+)/);
    const target = (match?.[1] ?? match?.[2] ?? match?.[3] ?? match?.[4] ?? '').trim();
    if (target) {
      const found = comps.find(c => c.name.toLowerCase().includes(target));
      if (found) return buildCompetitorDetailResponse(found);
    }
  }
  // Best/worst/top/bottom queries
  if (/best rated|top rated|highest rated|most popular/.test(lower)) {
    return buildRankedResponse(comps, 'best');
  }
  if (/worst rated|lowest rated|least popular|worst review/.test(lower)) {
    return buildRankedResponse(comps, 'worst');
  }

  if (/competi|landscape|nearby|who else|around me|surroundings|market/.test(lower)) {
    return buildCompetitionResponse(agg, comps);
  }
  if (/pric|cost|charge|expensive|cheap|benchmark|money on the table/.test(lower)) {
    return buildPricingResponse(agg, comps);
  }
  if (/late|night|midnight|after 11|after hours|2am|1am/.test(lower)) {
    return buildLateNightResponse(agg, comps);
  }
  if (/gap|underserv|white space|opportunit|missing|nobody/.test(lower)) {
    return buildGapsResponse(agg);
  }
  if (/review|complaint|customer|feedback|say about|people say|rating/.test(lower)) {
    return buildReviewsResponse(agg, comps);
  }
  if (/differentiat|stand out|unique|better than|beat|win|competitive edge/.test(lower)) {
    return buildDifferentiationResponse(agg);
  }
  if (/revenue|sales|earn|income|money|making/.test(lower)) {
    return buildRevenueResponse(comps);
  }
  if (/overview|summary|everything|full picture|tell me about|what do you know|show me/.test(lower)) {
    return buildOverviewResponse(agg, comps, snapshot);
  }
  if (/foot traffic|busy|peak|quiet|slow|popular|crowd/.test(lower)) {
    return buildTrafficResponse(agg, comps);
  }
  if (/menu|food|dish|appetizer|entree|dessert|drink|cocktail|wine|beer/.test(lower)) {
    return buildMenuResponse(agg, comps);
  }
  if (/who|which|name|list|all/.test(lower) && /competi|restaurant|venue|place/.test(lower)) {
    return buildCompetitionResponse(agg, comps);
  }

  return buildOverviewResponse(agg, comps, snapshot);
}

function buildCompetitionResponse(agg: IAggregates, comps: ICompetitor[]): BrainResponse {
  const top5 = [...comps]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return {
    sentences: [
      `I've identified **${agg.totalCompetitors} competitors** within the search radius.`,
      `The corridor has an average rating of **${agg.avgCorridorRating}** stars with **${agg.reviewsAnalyzed} reviews** analyzed.`,
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Total competitors', value: String(agg.totalCompetitors), sub: `${agg.corridorInsights?.lateNightCompetitors ?? 0} open late-night` },
          { label: 'Avg corridor rating', value: String(agg.avgCorridorRating), sub: `${agg.reviewsAnalyzed} reviews` },
          { label: 'Menus analyzed', value: String(agg.menusFound), sub: `${agg.menuCoveragePercent}% coverage` },
          { label: 'Biggest gap', value: agg.underservedCategories?.[0]?.category ?? 'N/A', sub: `${agg.underservedCategories?.[0]?.competitorCoverage ?? 0}% coverage`, highlight: true },
        ],
      },
      {
        type: 'data-table',
        data: {
          title: 'Top Competitors by Rating',
          headers: ['Name', 'Rating', 'Reviews', 'Price Level'],
          rows: top5.map(c => ({
            cells: [c.name, c.rating ?? 'N/A', c.userRatingCount ?? 0, '$'.repeat(c.priceLevel ?? 2)],
          })),
        },
      },
    ],
    followUps: [
      'Where are the biggest gaps I can own?',
      'How does my pricing compare?',
      "What are customers complaining about?",
      "What's the late-night opportunity?",
    ],
  };
}

function buildPricingResponse(agg: IAggregates, comps: ICompetitor[]): BrainResponse {
  const bands = agg.pricingBands ?? [];
  return {
    sentences: [
      `I've analyzed pricing across **${agg.menusFound} menus** in the corridor.`,
      bands.length > 0
        ? `Here are the pricing bands by category.`
        : 'Menu pricing data is limited — upload competitor menus for deeper analysis.',
    ],
    components: bands.length > 0
      ? [{
          type: 'price-bands',
          data: bands.slice(0, 4).map(b => ({
            category: b.category,
            p25: b.min,
            median: b.median,
            p75: b.max,
            yours: b.clientPosition ?? b.median,
          })),
        }]
      : [],
    followUps: [
      'Where are the biggest gaps I can own?',
      'Am I leaving money on the table anywhere?',
      'How do I differentiate from competitors?',
    ],
  };
}

function buildLateNightResponse(agg: IAggregates, comps: ICompetitor[]): BrainResponse {
  const lateNight = agg.corridorInsights?.lateNightCompetitors ?? 0;
  const total = agg.totalCompetitors;
  const pct = total > 0 ? Math.round((lateNight / total) * 100) : 0;

  return {
    sentences: [
      `Only **${lateNight} of ${total}** venues (${pct}%) in the corridor serve food after 11 PM.`,
      'This represents a significant opportunity — weekend foot traffic remains high after midnight.',
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Late-night venues', value: `${lateNight}/${total}`, sub: `${pct}% of corridor`, highlight: true },
          { label: 'Weekend traffic after 11PM', value: 'High', sub: 'Based on BestTime data' },
          { label: 'Avg dwell time', value: `${agg.corridorInsights?.avgDwellTime ?? 60} min`, sub: 'corridor average' },
        ],
      },
    ],
    followUps: [
      'What should a late-night menu look like?',
      'How big is the late-night opportunity actually?',
      "What's the competitive risk if I don't go late-night?",
    ],
  };
}

function buildGapsResponse(agg: IAggregates): BrainResponse {
  const gaps = agg.underservedCategories ?? [];
  return {
    sentences: [
      gaps.length > 0
        ? `I've identified **${gaps.length} underserved categories** in the corridor.`
        : 'No clear menu gaps detected yet — upload more competitor menus for better analysis.',
    ],
    components: gaps.length > 0
      ? [{
          type: 'bar-list',
          data: {
            title: 'Menu Gaps (lower = bigger opportunity)',
            items: gaps.map(g => ({
              label: g.category,
              value: g.competitorCoverage,
              max: 100,
              unit: '% coverage',
              signal: g.demandSignal === 'strong' ? 'Strong demand signal' : 'Moderate demand',
            })),
          },
        }]
      : [],
    followUps: [
      'Which gap has the best return on investment?',
      'How do I differentiate from competitors?',
      "What's the late-night opportunity?",
    ],
  };
}

function buildReviewsResponse(agg: IAggregates, comps: ICompetitor[]): BrainResponse {
  const themes = agg.topReviewThemes ?? [];
  const negatives = themes.filter(t => t.sentiment === 'negative');

  const components: BrainResponse['components'] = [];

  if (themes.length > 0) {
    components.push({
      type: 'bar-list',
      data: {
        title: 'Review Themes',
        items: themes.slice(0, 6).map(t => ({
          label: t.theme,
          value: t.frequency,
          max: Math.max(...themes.map(x => x.frequency)),
          unit: 'mentions',
          signal: t.sentiment === 'negative' ? 'Negative' : 'Positive',
        })),
      },
    });
  }

  // Include example snippets from themes if available
  const snippets = themes
    .flatMap(t => (t.exampleSnippets ?? []).map(s => ({ theme: t.theme, sentiment: t.sentiment, text: s })))
    .slice(0, 4);

  if (snippets.length > 0) {
    components.push({
      type: 'data-table',
      data: {
        title: 'Example Quotes',
        headers: ['Theme', 'Sentiment', 'Quote'],
        rows: snippets.map(s => ({
          cells: [s.theme, s.sentiment === 'negative' ? '👎' : '👍', `"${s.text}"`],
        })),
      },
    });
  }

  return {
    sentences: [
      `I've analyzed **${agg.reviewsAnalyzed} reviews** across ${agg.totalCompetitors} venues.`,
      negatives.length > 0
        ? `The top complaint is **${negatives[0].theme}** — mentioned ${negatives[0].frequency} times.`
        : 'No strong negative patterns detected in the corridor.',
    ],
    components,
    followUps: [
      'Can you show me specific reviews?',
      "What do the best-reviewed venues do differently?",
      'Who has the best ratings?',
      'How do I turn operations into a competitive advantage?',
    ],
  };
}

function buildDifferentiationResponse(agg: IAggregates): BrainResponse {
  const gaps = agg.underservedCategories ?? [];
  return {
    sentences: [
      'Based on the competitive data, here are the strongest differentiation opportunities.',
      'Focus on areas with low competitor coverage and strong demand signals.',
    ],
    components: gaps.length > 0
      ? [{
          type: 'data-table',
          data: {
            title: 'Differentiation Opportunities',
            headers: ['Category', 'Coverage', 'Demand Signal', 'Description'],
            rows: gaps.map(g => ({
              cells: [g.category, `${g.competitorCoverage}%`, g.demandSignal, g.description],
            })),
          },
        }]
      : [],
    followUps: [
      'Which gap has the best return on investment?',
      "What's the late-night opportunity?",
      'What should my opening strategy be?',
    ],
  };
}

function buildRevenueResponse(comps: ICompetitor[]): BrainResponse {
  const withRevenue = comps.filter(c => c.estimatedRevenue?.annualRevenueSeasonAdjusted);
  if (withRevenue.length === 0) {
    return {
      sentences: ['Revenue estimates are not yet available. Complete the scan pipeline first.'],
      components: [],
      followUps: ["What's the competitive landscape?"],
    };
  }

  const revenues = withRevenue.map(c => c.estimatedRevenue!.annualRevenueSeasonAdjusted);
  const sorted = [...revenues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const total = revenues.reduce((a, b) => a + b, 0);

  const fmt = (n: number) => `$${Math.round(n / 1000)}K`;

  return {
    sentences: [
      `Revenue estimates are available for **${withRevenue.length}** venues.`,
      `The corridor median is **${fmt(median)}** annually, with a total market of **${fmt(total)}**.`,
    ],
    components: [{
      type: 'metric-grid',
      data: [
        { label: 'Corridor median', value: fmt(median), sub: 'annual (season-adjusted)' },
        { label: 'Total market', value: fmt(total), sub: `across ${withRevenue.length} venues` },
        { label: 'Range', value: `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`, sub: 'low to high' },
      ],
    }],
    followUps: [
      'Where are the biggest gaps I can own?',
      "What's the late-night revenue opportunity?",
      'How does my pricing compare?',
    ],
  };
}

function buildTrafficResponse(agg: IAggregates, comps: ICompetitor[]): BrainResponse {
  const withTraffic = comps.filter(c => c.footTraffic);
  return {
    sentences: [
      withTraffic.length > 0
        ? `Foot traffic data is available for **${withTraffic.length}** of ${comps.length} venues.`
        : 'No foot traffic data has been collected yet.',
      `The busiest day is **${agg.corridorInsights?.busiestDay ?? 'Saturday'}** and the quietest window is **${agg.corridorInsights?.quietestWindow ?? 'Tuesday afternoon'}**.`,
    ],
    components: [{
      type: 'metric-grid',
      data: [
        { label: 'Venues with traffic data', value: `${withTraffic.length}/${comps.length}` },
        { label: 'Busiest day', value: agg.corridorInsights?.busiestDay ?? 'Saturday' },
        { label: 'Quietest window', value: agg.corridorInsights?.quietestWindow ?? 'Tue 2-5 PM' },
        { label: 'Avg dwell time', value: `${agg.corridorInsights?.avgDwellTime ?? 60} min` },
      ],
    }],
    followUps: [
      "What's the late-night opportunity?",
      'How does foot traffic affect revenue?',
      "What's the competitive landscape?",
    ],
  };
}

function buildSpecificReviewsResponse(comps: ICompetitor[]): BrainResponse {
  const allReviews: { venue: string; text: string; rating: number; author: string }[] = [];

  for (const c of comps) {
    if (!c.reviews?.length) continue;
    for (const r of c.reviews) {
      if (r.text && r.text.length > 20) {
        allReviews.push({ venue: c.name, text: r.text, rating: r.rating, author: r.authorName ?? 'Anonymous' });
      }
    }
  }

  if (allReviews.length === 0) {
    return {
      sentences: ['No detailed review text is available yet. The scan collected review themes but individual reviews require Google Maps data.'],
      components: [],
      followUps: ['What are the review themes?', "What's the competitive landscape?"],
    };
  }

  // Pick a mix: highest-rated and lowest-rated reviews
  const sorted = [...allReviews].sort((a, b) => b.rating - a.rating);
  const bestReviews = sorted.slice(0, 3);
  const worstReviews = sorted.filter(r => r.rating <= 3).slice(-3);
  const selected = [...bestReviews, ...worstReviews]
    .filter((r, i, arr) => arr.findIndex(x => x.text === r.text) === i)
    .slice(0, 6);

  return {
    sentences: [
      `Here are **${selected.length} actual reviews** from competitors in the corridor.`,
      'These show what customers are saying — both positive and negative.',
    ],
    components: [{
      type: 'data-table',
      data: {
        title: 'Competitor Reviews',
        headers: ['Venue', 'Rating', 'Review'],
        rows: selected.map(r => ({
          cells: [r.venue, `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}`, r.text.length > 150 ? r.text.slice(0, 147) + '...' : r.text],
        })),
      },
    }],
    followUps: [
      'What are the main review themes?',
      'What are customers complaining about most?',
      'Which competitor has the best reviews?',
    ],
  };
}

function buildCompetitorDetailResponse(comp: ICompetitor): BrainResponse {
  const sentences = [`Here's what I know about **${comp.name}**.`];
  const metrics: { label: string; value: string; sub?: string }[] = [
    { label: 'Rating', value: comp.rating ? `${comp.rating} ★` : 'N/A', sub: `${comp.userRatingCount ?? 0} reviews` },
    { label: 'Price Level', value: comp.priceLevel ? '$'.repeat(comp.priceLevel) : 'N/A' },
  ];

  if (comp.menuItems?.length) {
    metrics.push({ label: 'Menu items', value: String(comp.menuItems.length) });
  }
  if (comp.estimatedRevenue?.annualRevenueSeasonAdjusted) {
    const rev = comp.estimatedRevenue.annualRevenueSeasonAdjusted;
    metrics.push({ label: 'Est. annual revenue', value: `$${Math.round(rev / 1000)}K`, sub: `Confidence: ${comp.estimatedRevenue.confidenceGrade}` });
  }
  if (comp.address) {
    metrics.push({ label: 'Address', value: comp.address });
  }

  const components: BrainResponse['components'] = [{ type: 'metric-grid', data: metrics }];

  if (comp.reviews?.length) {
    const topReview = [...comp.reviews].sort((a, b) => b.rating - a.rating)[0];
    if (topReview?.text) {
      components.push({
        type: 'callout',
        data: { text: `Top review (${topReview.rating}★): "${topReview.text.slice(0, 200)}"` },
      });
    }
  }

  return {
    sentences,
    components,
    followUps: [
      `How does ${comp.name} compare to others?`,
      'Who is the biggest competitor?',
      "What's the competitive landscape?",
    ],
  };
}

function buildRankedResponse(comps: ICompetitor[], direction: 'best' | 'worst'): BrainResponse {
  const rated = comps.filter(c => c.rating != null);
  if (rated.length === 0) {
    return {
      sentences: ['No rating data available for competitors yet.'],
      components: [],
      followUps: ["What's the competitive landscape?"],
    };
  }

  const sorted = direction === 'best'
    ? [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    : [...rated].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  const top5 = sorted.slice(0, 5);

  return {
    sentences: [
      direction === 'best'
        ? `Here are the **top ${top5.length} highest-rated** competitors in the corridor.`
        : `Here are the **${top5.length} lowest-rated** competitors in the corridor.`,
    ],
    components: [{
      type: 'data-table',
      data: {
        title: direction === 'best' ? 'Highest Rated Competitors' : 'Lowest Rated Competitors',
        headers: ['Name', 'Rating', 'Reviews', 'Price Level'],
        rows: top5.map(c => ({
          cells: [c.name, c.rating ?? 'N/A', c.userRatingCount ?? 0, c.priceLevel ? '$'.repeat(c.priceLevel) : 'N/A'],
        })),
      },
    }],
    followUps: [
      direction === 'best' ? 'Who has the worst ratings?' : 'Who has the best ratings?',
      'Can you show me specific reviews?',
      'Where are the biggest gaps I can own?',
    ],
  };
}

function buildMenuResponse(agg: IAggregates, _comps: ICompetitor[]): BrainResponse {
  const bands = agg.pricingBands ?? [];

  return {
    sentences: [
      agg.menusFound > 0
        ? `I have menu data from **${agg.menusFound}** competitors (**${agg.menuCoveragePercent}%** coverage).`
        : 'Limited menu data available — upload competitor menus (CSV, JSON, or PDF) for deeper analysis.',
      bands.length > 0
        ? 'Here are the pricing bands across the corridor.'
        : '',
    ].filter(Boolean),
    components: bands.length > 0
      ? [{
          type: 'price-bands',
          data: bands.slice(0, 4).map(b => ({
            category: b.category,
            p25: b.min,
            median: b.median,
            p75: b.max,
            yours: b.clientPosition ?? b.median,
          })),
        }]
      : [],
    followUps: [
      'Where are the menu gaps?',
      'How does my pricing compare?',
      "What's not being served in the corridor?",
    ],
  };
}

function buildOverviewResponse(agg: IAggregates, comps: ICompetitor[], snapshot: IBiSnapshot): BrainResponse {
  const neighborhood = snapshot.location?.neighborhood ?? snapshot.location?.city ?? 'the corridor';
  const topGap = agg.underservedCategories?.[0];
  const topComplaint = agg.topReviewThemes?.find(t => t.sentiment === 'negative');

  return {
    sentences: [
      `I've analyzed **${agg.totalCompetitors} competitors** and **${agg.menusFound} menus** in ${neighborhood}.`,
      'Ask me anything about the competitive landscape, pricing, menu gaps, or what customers are saying.',
    ],
    components: [{
      type: 'metric-grid',
      data: [
        { label: 'Venues in radius', value: String(agg.totalCompetitors), sub: `${snapshot.location?.radiusMeters ?? 500}m · ${neighborhood}` },
        { label: 'Menus analyzed', value: String(agg.menusFound), sub: 'pricing & coverage data' },
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

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDB();

    const resolvedId = await resolveClientId(parsed.data.clientId);
    if (!resolvedId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!isRestaurantRelated(parsed.data.query)) {
      return NextResponse.json(OFF_TOPIC_RESPONSE);
    }

    const snapshot = await BiSnapshot.findOne({
      clientId: new Types.ObjectId(resolvedId),
    })
      .sort({ version: -1 })
      .select('-versionHistory -competitors.footTraffic.weekRaw -competitors.estimatedRevenue.weeklyBreakdown -competitors.menuItems')
      .lean();

    if (!snapshot) {
      return NextResponse.json({
        sentences: [
          "AI Insights hasn't been set up for this client yet.",
          'Click "Initialize" to scan the competitive landscape.',
        ],
        components: [],
        followUps: [],
      } satisfies BrainResponse);
    }

    const cached = checkCache(snapshot, parsed.data.query);
    if (cached) {
      return NextResponse.json(cached);
    }

    let response: BrainResponse;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { queryOpenAI } = await import('@/app/lib/openai/client');
        response = await queryOpenAI(parsed.data.query, snapshot);
      } catch {
        response = buildTemplateResponse(parsed.data.query, snapshot);
      }
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const { queryGemini } = await import('@/app/lib/gemini/client');
        response = await queryGemini(parsed.data.query, snapshot);
      } catch {
        response = buildTemplateResponse(parsed.data.query, snapshot);
      }
    } else {
      response = buildTemplateResponse(parsed.data.query, snapshot);
    }

    const joined = response.sentences.join(' ');
    const isError = joined.includes('ran into an issue')
      || joined.includes('Please try again')
      || joined.includes("don't have that data")
      || (response.sentences.length <= 1 && joined.length < 60 && response.components.length === 0);
    if (!isError) {
      await BiSnapshot.updateOne(
        { _id: snapshot._id },
        pushQueryCache(parsed.data.query, response),
      );
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/query error:', message);
    return NextResponse.json({
      sentences: ['Sorry, I ran into an issue processing that question. Please try again.'],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
        'How does my pricing compare?',
      ],
    } satisfies BrainResponse);
  }
}
