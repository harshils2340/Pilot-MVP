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

const SYSTEM_PROMPT = `You are a sharp, no-BS restaurant competitive intelligence analyst. You give direct, specific answers backed by real data — never generic advice.

GUARDRAILS:
- ONLY answer questions about restaurants, food/beverage, hospitality, menus, pricing, foot traffic, reviews, permits, licensing.
- Off-topic → redirect: "I specialize in restaurant competitive intelligence."
- NEVER make up data. Only cite numbers from the CONTEXT provided.
- If the context has zero relevant data, say so plainly: "We don't have that data yet." But if there IS related data (e.g. revenue estimates, foot traffic, competitor counts), USE it to give a concrete answer.

TONE & STYLE — THIS IS CRITICAL:
- Lead with the NUMBER or the DIRECT ANSWER, then explain briefly.
- Keep sentences to 1-2 lines max. No walls of text. No filler.
- Write like a senior analyst briefing a busy owner, not a college essay.
- NEVER use phrases like "can be influenced by", "consider focusing on", "it's important to note", "several factors including". These are filler. Cut them.
- DO NOT repeat what the user asked back to them.
- DO NOT give generic restaurant advice. Every sentence must reference specific data from the context (a name, a number, a percentage, a trend).
- If the data doesn't directly answer the question, use the closest available data and say what it tells us. For example, if asked about "revenue growth over time", use the current revenue estimates + foot traffic trends to project. But label projections as such.

BAD example: "Revenue growth in the restaurant industry can be influenced by several factors including foot traffic patterns, competitive pricing, and menu offerings."
GOOD example: "Your corridor's top earner is **The Keg at ~$4.5M/year**. The median is **$1.8M**. To close that gap, your biggest lever is **Saturday dinner** — peak traffic hits **8 PM** but only 50% of venues stay open past 11 PM."

RESPONSE FORMAT:
Return a JSON object with:
- "sentences": Array of 1-3 short strings. **Bold** key numbers. Each sentence = one insight with a specific data point. MAX 2 lines per sentence.
- "components": Array of data visualizations. ALWAYS include at least one component with numbers. Types:
  1. "metric-grid": data = [{ label, value, sub?, highlight? }]
  2. "bar-list": data = { title?, items: [{ label, value, max?, unit?, signal? }] }
  3. "data-table": data = { title?, headers: string[], rows: [{ cells: (string|number)[] }] }
  4. "price-bands": data = [{ category, p25, median, p75, yours }]
  5. "callout": data = { text: string }
- "followUps": Array of 2-3 specific follow-up questions.

DATA REFERENCE:
- priceLevel: Google Maps 1–4 scale. 1 = $ budget, 2 = $$ moderate, 3 = $$$ upscale, 4 = $$$$ fine dining. Always show as dollar signs, never raw numbers.
- rating: Google Maps 1–5 stars.
- Revenue figures: estimates from foot traffic × avg check × seats (RevPASH model). Label as "estimated".
- Foot traffic: from BestTime.app sensor data.

RULES:
- Every answer MUST include a component (metric-grid, bar-list, or data-table) with real numbers. Text-only answers are not acceptable.
- When asked about revenue/growth, show actual competitor revenue estimates in a table or bar chart, not advice paragraphs.
- When asked about pricing, show a price comparison table, not a paragraph about "considering your options".
- Prefer showing 3-5 specific competitors by name with their numbers over making general statements about "the area".`;

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
    .slice(0, 8)
    .map(c => ({
      name: c.name,
      rating: c.rating,
      reviewCount: c.userRatingCount,
      priceLevel: c.priceLevel,
      priceTier: priceLevelLabel(c.priceLevel),
      address: c.address,
      types: c.types?.slice(0, 3),
      servesLateNight: c.servesDinner,
      hasTraffic: !!c.footTraffic,
      menuItemCount: c.menuItems?.length ?? 0,
      annualRevenue: c.estimatedRevenue?.annualRevenueSeasonAdjusted,
      confidenceGrade: c.estimatedRevenue?.confidenceGrade,
      sampleReviews: c.reviews?.slice(0, 3).map(r => ({
        rating: r.rating,
        author: r.authorName ?? 'Anonymous',
        text: r.text?.slice(0, 200),
      })),
      serpApiTopics: (c as unknown as Record<string, unknown>).serpApiTopics,
    }));

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
      topReviewThemes: agg.topReviewThemes?.slice(0, 8)?.map(t => ({
        theme: t.theme,
        sentiment: t.sentiment,
        frequency: t.frequency,
        exampleSnippets: t.exampleSnippets?.slice(0, 2),
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
          content: `CONTEXT — real competitive intelligence data for this client's corridor. The user is planning or running a restaurant in this area. When they say "my revenue" or "my restaurant", answer using the corridor data and competitor benchmarks as reference points. This IS the data — use it.\n\n${context}\n\nQUESTION: ${query}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 2048,
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
