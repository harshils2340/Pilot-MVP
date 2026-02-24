/**
 * OpenAI GPT-5.2 client for restaurant competitive intelligence.
 *
 * Produces structured BrainResponse objects with restaurant guardrails.
 * Falls back gracefully when API key is missing or calls fail.
 */

import OpenAI from 'openai';
import type { IBiSnapshot } from '../biSnapshot/schema';

export interface BrainResponse {
  sentences: string[];
  components: { type: string; data: unknown }[];
  followUps: string[];
}

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.2';

const SYSTEM_PROMPT = `You are a senior restaurant strategy consultant briefing a client. You combine hard data with strategic thinking to give actionable intelligence — not just numbers, but what they MEAN and what the client should DO about them.

GUARDRAILS:
- ONLY answer about restaurants, food/beverage, hospitality, menus, pricing, foot traffic, reviews, permits, licensing.
- Off-topic → redirect: "I specialize in restaurant competitive intelligence."
- NEVER fabricate data. Only cite numbers from the CONTEXT.
- If the context has zero relevant data, say so. But if there IS related data, USE it.

ANALYST MINDSET — follow this structure for every answer:
1. THE FINDING: Lead with the specific data point (a number, a name, a comparison).
2. THE INSIGHT: What does this data MEAN? Why does it matter? Compare it to competitors by name.
3. THE MOVE: End with a concrete, specific recommendation the owner can act on THIS WEEK. Not "consider expanding hours" — instead "open until 1 AM Thu–Sat; you'd be one of only 3 venues open late, competing against [specific names]."

TONE:
- Write like a $500/hr consultant, not a chatbot. Confident, specific, decisive.
- Short punchy sentences. Bold the key numbers and names.
- Name competitors. Quote review text. Cite specific menu items and prices.
- Never say "consider", "you might want to", "it's worth noting", "several factors". Just tell them what to do and why.

EXAMPLES OF GOOD vs BAD:

BAD: "Your pricing is upscale, matching the corridor average. Competitors like The Keg also operate at this level."
GOOD: "You're priced at **$$$ like 14 of your 20 neighbors** — there's no differentiation. **The Keg** charges **$48 for a ribeye** while **Canoe** gets **$62** for the same cut. If your food quality matches Canoe's, you're leaving **$14/plate on the table**. Raise signature entrees by 10-15% and position around ingredient quality."

BAD: "50% of venues serve food after 11 PM. Demand for late-night food is moderate."
GOOD: "Only **10 of 20 venues** serve past 11 PM, and most are bars (Loose Moose, Elephant & Castle) not restaurants. **Zero competitors offer a proper late-night dinner menu**. If you stay open until 1 AM Thu–Sat with a condensed 8-item menu, you'd capture the **post-theatre King St crowd** with essentially no competition. The Keg closes at 11 — that's your window."

BAD: "What should I add to my menu? Prime rib is popular at competitors."
GOOD: "**Prime rib** appears at 3 competitors (The Keg, Ruth's Chris, Hy's) priced **$45–$68**. But **nobody in the corridor offers a smoked brisket or BBQ program** — the closest is generic bar food at Loose Moose. A **smoked meat / BBQ section** (3-4 items, $22–$35 range) fills a gap that zero competitors occupy. Second opportunity: **weekend brunch** — 0 of 20 competitors offer it."

RESPONSE FORMAT (JSON, no markdown fences):
- "sentences": Array of 2-4 strings. **Bold** key data. Each sentence should contain a finding + insight OR a specific recommendation. Be concise but substantive.
- "components": ALWAYS include 1-2 components. Types:
  1. "metric-grid": data = [{ label, value, sub?, highlight? }]
  2. "bar-list": data = { title?, items: [{ label, value, max?, unit?, signal? }] } — signal can be "up", "down", "neutral", "opportunity"
  3. "data-table": data = { title?, headers: string[], rows: [{ cells: (string|number)[] }] }
  4. "price-bands": data = [{ category, p25, median, p75, yours }]
  5. "callout": data = { text: string } — use for the key actionable takeaway
- "followUps": Array of 2-3 specific follow-up questions that dig deeper.

DATA REFERENCE:
- priceLevel: 1 = $ budget, 2 = $$ moderate, 3 = $$$ upscale, 4 = $$$$ fine dining. Show as dollar signs.
- rating: Google Maps 1–5 stars.
- Revenue: estimates from foot traffic × avg check × seats (RevPASH). Label as "estimated".
- Foot traffic: BestTime.app sensor data.
- When menu items are available, reference specific items and prices — don't just say "menu data exists."
- When reviews mention specific dishes, service issues, or praise — quote them with the reviewer name.

RULES:
- Every answer MUST have at least one data component AND one callout with a specific action.
- When discussing menu: name specific items, specific prices, specific gaps by category.
- When discussing pricing: show a comparison table with at least 3 competitors side by side.
- When discussing reviews: quote actual review text, don't summarize. Name the reviewer.
- When discussing opportunity: quantify it — estimate potential revenue, customer count, or market share.
- Always compare to specific competitors by name, never "the area" or "nearby venues" generically.`;

const PRICE_LABELS: Record<number, string> = {
  1: '$ (budget)',
  2: '$$ (moderate)',
  3: '$$$ (upscale)',
  4: '$$$$ (fine dining)',
};

function priceLevelLabel(level: number | null | undefined): string {
  if (level == null) return 'unknown';
  const rounded = Math.round(level);
  return PRICE_LABELS[rounded] ?? `${'$'.repeat(rounded)} (level ${level})`;
}

function buildContext(snapshot: IBiSnapshot): string {
  const agg = snapshot.aggregates;
  const comps = snapshot.competitors ?? [];

  const topCompetitors = [...comps]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12)
    .map(c => {
      const menuItems = c.menuItems ?? [];
      const menuByCategory: Record<string, { name: string; price: number | null }[]> = {};
      for (const item of menuItems.slice(0, 30)) {
        const cat = item.category || 'Uncategorized';
        if (!menuByCategory[cat]) menuByCategory[cat] = [];
        menuByCategory[cat].push({ name: item.name, price: item.price ?? null });
      }

      const ft = c.footTraffic;
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const trafficSummary = ft ? {
        peakHours: ft.peakHours?.slice(0, 3).map(p => ({
          day: dayNames[p.day] ?? p.day,
          hours: `${p.peakStart}:00–${p.peakEnd}:00`,
          intensity: p.peakIntensity,
        })),
        quietHours: ft.quietHours?.slice(0, 2).map(q => ({
          day: dayNames[q.day] ?? q.day,
          hours: `${q.quietStart}:00–${q.quietEnd}:00`,
        })),
        avgDwellMinutes: ft.dwellTimeAvg,
      } : null;

      return {
        name: c.name,
        rating: c.rating,
        reviewCount: c.userRatingCount,
        priceLevel: c.priceLevel,
        priceTier: priceLevelLabel(c.priceLevel),
        address: c.address,
        types: c.types?.slice(0, 5),
        servesLateNight: c.servesDinner,
        menuItemCount: menuItems.length,
        menuHighlights: menuByCategory,
        trafficSummary,
        annualRevenue: c.estimatedRevenue?.annualRevenueSeasonAdjusted,
        weeklyRevenue: c.estimatedRevenue?.weeklyRevenue,
        confidenceGrade: c.estimatedRevenue?.confidenceGrade,
        reviews: c.reviews?.slice(0, 5).map(r => ({
          rating: r.rating,
          author: r.authorName ?? 'Anonymous',
          text: r.text?.slice(0, 300),
          relativeTime: r.relativeTime,
        })),
        serpApiTopics: (c as unknown as Record<string, unknown>).serpApiTopics,
      };
    });

  const context: Record<string, unknown> = {
    location: {
      address: snapshot.location?.address,
      city: snapshot.location?.city,
      neighborhood: snapshot.location?.neighborhood,
      radius: snapshot.location?.radiusMeters,
    },
    topCompetitors,
  };

  if (agg) {
    context.aggregates = {
      totalCompetitors: agg.totalCompetitors,
      menusFound: agg.menusFound,
      menuCoverage: agg.menuCoveragePercent,
      avgRating: agg.avgCorridorRating,
      avgPriceLevel: agg.avgCorridorPriceLevel,
      avgPriceTier: priceLevelLabel(agg.avgCorridorPriceLevel),
      reviewsAnalyzed: agg.reviewsAnalyzed,
      corridorInsights: agg.corridorInsights,
      topReviewThemes: agg.topReviewThemes?.slice(0, 10)?.map(t => ({
        theme: t.theme,
        sentiment: t.sentiment,
        frequency: t.frequency,
        exampleSnippets: t.exampleSnippets?.slice(0, 3),
      })),
      underservedCategories: agg.underservedCategories?.map(g => ({
        category: g.category,
        coverage: g.competitorCoverage,
        demand: g.demandSignal,
        description: g.description,
      })),
      pricingBands: agg.pricingBands?.slice(0, 6)?.map(b => ({
        category: b.category,
        min: b.min,
        median: b.median,
        max: b.max,
        count: b.count,
      })),
      executiveSummary: agg.executiveSummary,
      keyOpportunities: agg.keyOpportunities,
    };
  }

  return JSON.stringify(context, null, 0);
}

export async function queryOpenAI(
  query: string,
  snapshot: IBiSnapshot,
): Promise<BrainResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      sentences: [
        'AI analysis is not configured yet.',
        'Your competitive data has been collected — add an OpenAI API key to unlock conversational insights.',
      ],
      components: [{
        type: 'callout',
        data: { text: 'Add OPENAI_API_KEY to your environment variables to enable AI-powered responses.' },
      }],
      followUps: [],
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const context = buildContext(snapshot);

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `CONTEXT — this is real competitive intelligence data for the client's restaurant corridor. The client is planning or running a restaurant in this area.

IMPORTANT FRAMING:
- When they say "my revenue", "my restaurant", or "my menu" — use the corridor data and competitor benchmarks to give them a concrete answer. This IS the data.
- When you mention competitor menus, name specific dishes and their prices.
- When you mention reviews, quote the actual review text.
- Always end your analysis with a specific, actionable recommendation.
- Quantify opportunities when possible — estimate potential revenue, customers captured, or market share gained.

${context}

QUESTION: ${query}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 3000,
    });

    let text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');

    // Strip markdown code fences if present (```json ... ```)
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('[OpenAI] Failed to parse JSON response:', text.slice(0, 200));
      throw new Error('OpenAI returned non-JSON response');
    }

    const sentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
    const followUps = Array.isArray(parsed.followUps) ? parsed.followUps : [];

    if (sentences.length === 0) {
      // Try to salvage — sometimes the model puts text in other fields
      if (typeof parsed.answer === 'string') {
        sentences.push(parsed.answer);
      } else if (typeof parsed.response === 'string') {
        sentences.push(parsed.response);
      } else {
        sentences.push('Here is what I found based on the competitive data.');
      }
    }

    return {
      sentences: sentences as string[],
      components: Array.isArray(parsed.components) ? parsed.components : [],
      followUps: followUps as string[],
    };
  } catch (err) {
    console.error('[OpenAI] Query failed:', err);

    return {
      sentences: [
        'I ran into an issue processing that question. Please try rephrasing or ask something else.',
      ],
      components: [],
      followUps: [
        "What's the competitive landscape?",
        'Where are the biggest gaps?',
        'How does my pricing compare?',
      ],
    };
  }
}
