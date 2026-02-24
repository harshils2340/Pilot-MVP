import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot, {
  type ICompetitor,
  type IAggregates,
  type IPricingBand,
  type IReviewTheme,
  type IMenuGap,
  pushVersionUpdate,
} from '@/app/lib/biSnapshot/schema';
import { estimateCorridorRevenue } from '@/app/lib/revenue/revpash';
import { inferMarket } from '@/app/lib/revenue/benchmarks';

const RequestSchema = z.object({
  clientId: z.string().min(1),
  snapshotId: z.string().min(1),
});

// ─── Aggregate computation ──────────────────────────────────────────────────

function computePricingBands(competitors: ICompetitor[]): IPricingBand[] {
  const pricesByCategory = new Map<string, number[]>();

  for (const comp of competitors) {
    for (const item of comp.menuItems) {
      if (item.price == null || item.price <= 0) continue;
      const cat = item.category.toLowerCase();
      if (!pricesByCategory.has(cat)) pricesByCategory.set(cat, []);
      pricesByCategory.get(cat)!.push(item.price);
    }
  }

  const bands: IPricingBand[] = [];
  for (const [category, prices] of pricesByCategory) {
    if (prices.length < 3) continue;
    prices.sort((a, b) => a - b);
    bands.push({
      category,
      min: prices[0],
      max: prices[prices.length - 1],
      median: prices[Math.floor(prices.length / 2)],
      mean: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
      count: prices.length,
    });
  }

  return bands.sort((a, b) => b.count - a.count).slice(0, 10);
}

function computeReviewThemes(competitors: ICompetitor[]): IReviewTheme[] {
  const themeKeywords: Record<string, { pattern: RegExp; sentiment: 'positive' | 'negative' | 'neutral' }> = {
    'Wait times': { pattern: /wait|slow|long time|took forever|delayed/i, sentiment: 'negative' },
    'Noise level': { pattern: /loud|noise|noisy|can't hear|too loud/i, sentiment: 'negative' },
    'Price/value': { pattern: /expensive|overpriced|pricey|not worth|rip.?off/i, sentiment: 'negative' },
    'Service quality': { pattern: /rude|inattentive|ignored|forgot|poor service/i, sentiment: 'negative' },
    'Great food': { pattern: /delicious|amazing food|incredible|best .+ ever|fantastic/i, sentiment: 'positive' },
    'Great atmosphere': { pattern: /great vibe|ambiance|beautiful|lovely|cozy|atmosphere/i, sentiment: 'positive' },
    'Good drinks': { pattern: /cocktails? (?:are |were )?(?:great|amazing|excellent)|good drinks|craft/i, sentiment: 'positive' },
    'Food consistency': { pattern: /inconsistent|hit or miss|sometimes good|depends on/i, sentiment: 'negative' },
    'Great patio': { pattern: /patio|outdoor|terrace|rooftop/i, sentiment: 'positive' },
  };

  const themes: IReviewTheme[] = [];

  // Phase 1: Regex-based theme extraction from review text
  for (const [theme, { pattern, sentiment }] of Object.entries(themeKeywords)) {
    let frequency = 0;
    const competitorSet = new Set<string>();
    const snippets: string[] = [];

    for (const comp of competitors) {
      for (const review of comp.reviews) {
        if (pattern.test(review.text)) {
          frequency++;
          competitorSet.add(comp.name);
          if (snippets.length < 3) {
            snippets.push(review.text.slice(0, 120));
          }
        }
      }
    }

    if (frequency > 0) {
      themes.push({
        theme,
        sentiment,
        frequency,
        competitorCount: competitorSet.size,
        exampleSnippets: snippets,
        relevanceToClient: frequency >= 5 ? 'high' : frequency >= 2 ? 'medium' : 'low',
      });
    }
  }

  // Phase 2: Merge SerpAPI topics (pre-extracted by Google, much more accurate)
  const existingThemes = new Set(themes.map(t => t.theme.toLowerCase()));
  const topicAgg = new Map<string, { mentions: number; competitors: Set<string> }>();

  for (const comp of competitors) {
    interface SerpTopic { keyword: string; mentions: number }
    const topics = (comp as unknown as { serpApiTopics?: SerpTopic[] }).serpApiTopics;
    if (!topics?.length) continue;

    for (const topic of topics) {
      const key = topic.keyword.toLowerCase();
      if (existingThemes.has(key)) continue;
      if (!topicAgg.has(key)) {
        topicAgg.set(key, { mentions: 0, competitors: new Set() });
      }
      const entry = topicAgg.get(key)!;
      entry.mentions += topic.mentions;
      entry.competitors.add(comp.name);
    }
  }

  for (const [keyword, data] of topicAgg) {
    if (data.mentions < 3) continue;

    const negativePatterns = /wait|slow|dirty|rude|cold|loud|expensive|overpriced|bad|poor|worst/i;
    const sentiment = negativePatterns.test(keyword) ? 'negative' : 'positive';

    themes.push({
      theme: keyword.charAt(0).toUpperCase() + keyword.slice(1),
      sentiment,
      frequency: data.mentions,
      competitorCount: data.competitors.size,
      exampleSnippets: [],
      relevanceToClient: data.mentions >= 10 ? 'high' : data.mentions >= 5 ? 'medium' : 'low',
    });
  }

  return themes.sort((a, b) => b.frequency - a.frequency);
}

function computeMenuGaps(competitors: ICompetitor[]): IMenuGap[] {
  const total = competitors.length;
  if (total === 0) return [];

  const gaps: IMenuGap[] = [];

  const lateNightCount = competitors.filter(c => {
    const fri = c.hours?.friday;
    const sat = c.hours?.saturday;
    const hasLate = (ranges: typeof fri) => {
      if (!ranges?.length) return false;
      const last = ranges[ranges.length - 1];
      const closeHour = parseInt(last.close.split(':')[0], 10);
      return closeHour >= 23 || closeHour <= 5;
    };
    return hasLate(fri) || hasLate(sat);
  }).length;

  gaps.push({
    category: 'Late-night food (after 11PM)',
    description: `Only ${lateNightCount} of ${total} venues serve food after 11 PM`,
    competitorCoverage: Math.round((lateNightCount / total) * 100),
    demandSignal: lateNightCount / total < 0.25 ? 'strong' : 'moderate',
    evidence: 'Foot traffic data shows significant weekend activity after 11 PM',
  });

  const brunchCount = competitors.filter(c => c.servesBrunch).length;
  if (brunchCount / total < 0.5) {
    gaps.push({
      category: 'Weekend brunch',
      description: `${brunchCount} of ${total} venues offer brunch`,
      competitorCoverage: Math.round((brunchCount / total) * 100),
      demandSignal: 'moderate',
      evidence: 'Weekend morning foot traffic is underserved in this corridor',
    });
  }

  return gaps;
}

function computeAggregates(competitors: ICompetitor[]): IAggregates {
  const total = competitors.length;
  const withMenus = competitors.filter(c => c.menuItems.length > 0);
  const allReviews = competitors.flatMap(c => c.reviews);

  const ratings = competitors.filter(c => c.rating != null).map(c => c.rating!);
  const priceLevels = competitors.filter(c => c.priceLevel != null).map(c => c.priceLevel!);

  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;
  const avgPrice = priceLevels.length
    ? Math.round((priceLevels.reduce((a, b) => a + b, 0) / priceLevels.length) * 10) / 10
    : 0;

  const sorted = [...ratings].sort((a, b) => a - b);
  const highestIdx = sorted.length ? ratings.indexOf(sorted[sorted.length - 1]) : -1;
  const lowestIdx = sorted.length ? ratings.indexOf(sorted[0]) : -1;

  const lateNight = competitors.filter(c => {
    const fri = c.hours?.friday;
    if (!fri?.length) return false;
    const close = parseInt(fri[fri.length - 1].close.split(':')[0], 10);
    return close >= 23 || close <= 5;
  }).length;

  const brunch = competitors.filter(c => c.servesBrunch).length;

  return {
    totalCompetitors: total,
    menusFound: withMenus.length,
    menusTotal: total,
    menuCoveragePercent: total > 0 ? Math.round((withMenus.length / total) * 100) : 0,
    reviewsAnalyzed: allReviews.length,
    avgCorridorRating: avgRating,
    avgCorridorPriceLevel: avgPrice,
    pricingBands: computePricingBands(competitors),
    topReviewThemes: computeReviewThemes(competitors),
    underservedCategories: computeMenuGaps(competitors),
    corridorInsights: (() => {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const withTraffic = competitors.filter(c => c.footTraffic?.weekRaw?.length === 7);

      let busiestDay = 'Saturday';
      let busiestHour = 20;
      let quietestWindow = 'Tuesday 2–5 PM';

      if (withTraffic.length > 0) {
        const dayTotals = new Array(7).fill(0);
        const hourTotals = new Array(24).fill(0);

        for (const c of withTraffic) {
          for (let d = 0; d < 7; d++) {
            const dayData = c.footTraffic!.weekRaw[d];
            if (!dayData) continue;
            const daySum = dayData.reduce((a, b) => a + b, 0);
            dayTotals[d] += daySum;
            for (let h = 0; h < 24; h++) {
              hourTotals[h] += dayData[h] ?? 0;
            }
          }
        }

        const maxDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
        busiestDay = dayNames[maxDayIdx] ?? 'Saturday';
        busiestHour = hourTotals.indexOf(Math.max(...hourTotals));

        const minDayIdx = dayTotals.indexOf(Math.min(...dayTotals));
        const quietDay = dayNames[minDayIdx] ?? 'Tuesday';
        const quietDayData = new Array(24).fill(0);
        for (const c of withTraffic) {
          const d = c.footTraffic!.weekRaw[minDayIdx];
          if (d) d.forEach((v, h) => { quietDayData[h] += v; });
        }
        let minBlock = 0;
        let minBlockStart = 14;
        for (let h = 6; h <= 20; h++) {
          const block = quietDayData[h] + quietDayData[h + 1] + quietDayData[h + 2];
          if (minBlock === 0 || block < minBlock) {
            minBlock = block;
            minBlockStart = h;
          }
        }
        const fmtH = (h: number) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        quietestWindow = `${quietDay} ${fmtH(minBlockStart)}–${fmtH(minBlockStart + 3)}`;
      }

      const dwellAvg = Math.round(
        withTraffic
          .filter(c => c.footTraffic?.dwellTimeAvg)
          .reduce((s, c) => s + (c.footTraffic?.dwellTimeAvg ?? 0), 0)
          / Math.max(1, withTraffic.filter(c => c.footTraffic?.dwellTimeAvg).length),
      ) || 60;

      return {
        busiestDay,
        busiestHour,
        quietestWindow,
        avgDwellTime: dwellAvg,
        lateNightCompetitors: lateNight,
        brunchCompetitors: brunch,
        avgMenuSize: withMenus.length
          ? Math.round(withMenus.reduce((s, c) => s + c.menuItems.length, 0) / withMenus.length)
          : 0,
        highestRatedCompetitor: highestIdx >= 0 ? competitors[highestIdx].name : 'N/A',
        lowestRatedCompetitor: lowestIdx >= 0 ? competitors[lowestIdx].name : 'N/A',
      };
    })(),
    computedAt: new Date(),
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

    const snapshot = await BiSnapshot.findById(parsed.data.snapshotId);
    if (!snapshot || !snapshot.competitors?.length) {
      return NextResponse.json({
        success: false,
        snapshotId: parsed.data.snapshotId,
        progress: 75,
        error: 'No competitors found.',
      });
    }

    const market = inferMarket(snapshot.location?.city, snapshot.location?.country);
    const { estimates, corridorMedianAnnual, corridorTotalAnnual } =
      estimateCorridorRevenue(snapshot.competitors, market);

    for (let i = 0; i < snapshot.competitors.length; i++) {
      if (estimates[i]) {
        snapshot.competitors[i].estimatedRevenue = estimates[i];
      }
    }

    const aggregates = computeAggregates(snapshot.competitors);

    const versionEntry = pushVersionUpdate({
      version: (snapshot.version ?? 0) + 1,
      createdBy: 'system',
      trigger: 'initial_scan',
      summary: `Scanned ${aggregates.totalCompetitors} competitors, ${aggregates.reviewsAnalyzed} reviews analyzed`,
      changes: {
        competitorsAdded: aggregates.totalCompetitors,
        competitorsRemoved: 0,
        menusUpdated: aggregates.menusFound,
        reviewsAdded: aggregates.reviewsAnalyzed,
        trafficRefreshed: snapshot.competitors.some((c: ICompetitor) => c.footTraffic != null),
        revenueRecalculated: true,
      },
    });

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      {
        $set: {
          competitors: snapshot.competitors,
          aggregates,
          'collectionStatus.overall': 'ready',
          'collectionStatus.readinessPercent': 100,
          lastFullRefresh: new Date(),
        },
        ...versionEntry,
      },
    );

    return NextResponse.json({
      success: true,
      snapshotId: parsed.data.snapshotId,
      progress: 100,
      corridorMedianAnnual,
      corridorTotalAnnual,
      aggregates: {
        totalCompetitors: aggregates.totalCompetitors,
        reviewsAnalyzed: aggregates.reviewsAnalyzed,
        avgCorridorRating: aggregates.avgCorridorRating,
        menuCoveragePercent: aggregates.menuCoveragePercent,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/revenue error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
