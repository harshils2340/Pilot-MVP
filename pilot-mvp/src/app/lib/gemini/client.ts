/**
 * Gemini API client for restaurant competitive intelligence.
 *
 * Produces structured BrainResponse objects with restaurant guardrails.
 * Falls back gracefully when API key is missing or calls fail.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { IBiSnapshot } from '../biSnapshot/schema';

interface BrainResponse {
  sentences: string[];
  components: { type: string; data: unknown }[];
  followUps: string[];
}

// ─── System prompt with restaurant guardrails ───────────────────────────────

const SYSTEM_PROMPT = `You are a restaurant competitive intelligence analyst embedded in the Pilot platform.

ROLE: You analyze competitive landscape data for restaurant and hospitality clients. You have access to real data from Google Maps, BestTime foot traffic, menu analysis, and RevPASH revenue estimates.

GUARDRAILS:
- ONLY answer questions about restaurants, food/beverage, hospitality, menus, pricing, foot traffic, reviews, permits, licensing, and related topics.
- If the user asks about anything unrelated (politics, weather, coding, etc.), politely redirect: "I specialize in restaurant competitive intelligence. I can help with questions about your competitive landscape, pricing, menu gaps, reviews, and foot traffic."
- Never make up data. Only reference numbers from the context provided.
- When uncertain, state your confidence level.

RESPONSE FORMAT:
You must return a JSON object with these fields:
- "sentences": Array of 1-4 strings. Use **bold** for emphasis. These are the narrative paragraphs.
- "components": Array of data visualization components. Each has "type" and "data". Available types:
  1. "metric-grid": data is array of { label, value, sub?, highlight? }
  2. "bar-list": data is { title?, items: [{ label, value, max?, unit?, signal? }] }
  3. "data-table": data is { title?, headers: string[], rows: [{ cells: (string|number)[] }] }
  4. "price-bands": data is array of { category, p25, median, p75, yours }
  5. "callout": data is { text: string }
- "followUps": Array of 2-4 follow-up question strings the user might ask next.

GUIDELINES:
- Keep sentences concise and insight-driven, not just data recitation.
- Use components to show data visually — don't put tables/numbers in sentences.
- Highlight the most actionable insight.
- Follow-ups should naturally extend the conversation.`;

// ─── Context compression ────────────────────────────────────────────────────

function buildContext(snapshot: IBiSnapshot): string {
  const agg = snapshot.aggregates;
  const comps = snapshot.competitors ?? [];

  const top5 = [...comps]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      rating: c.rating,
      reviewCount: c.userRatingCount,
      priceLevel: c.priceLevel,
      types: c.types?.slice(0, 3),
      servesLateNight: c.servesDinner,
      hasTraffic: !!c.footTraffic,
      annualRevenue: c.estimatedRevenue?.annualRevenueSeasonAdjusted,
      confidenceGrade: c.estimatedRevenue?.confidenceGrade,
      sampleReviews: c.reviews?.slice(0, 2).map(r => ({
        rating: r.rating,
        text: r.text?.slice(0, 120),
      })),
    }));

  const context = {
    location: {
      address: snapshot.location?.address,
      city: snapshot.location?.city,
      neighborhood: snapshot.location?.neighborhood,
      radius: snapshot.location?.radiusMeters,
    },
    aggregates: agg ? {
      totalCompetitors: agg.totalCompetitors,
      menusFound: agg.menusFound,
      menuCoverage: agg.menuCoveragePercent,
      avgRating: agg.avgCorridorRating,
      avgPriceLevel: agg.avgCorridorPriceLevel,
      reviewsAnalyzed: agg.reviewsAnalyzed,
      corridorInsights: agg.corridorInsights,
      topReviewThemes: agg.topReviewThemes?.slice(0, 6)?.map(t => ({
        theme: t.theme,
        sentiment: t.sentiment,
        frequency: t.frequency,
      })),
      underservedCategories: agg.underservedCategories?.map(g => ({
        category: g.category,
        coverage: g.competitorCoverage,
        demand: g.demandSignal,
      })),
      pricingBands: agg.pricingBands?.slice(0, 5)?.map(b => ({
        category: b.category,
        min: b.min,
        median: b.median,
        max: b.max,
        count: b.count,
      })),
      executiveSummary: agg.executiveSummary,
      keyOpportunities: agg.keyOpportunities,
    } : null,
    topCompetitors: top5,
  };

  return JSON.stringify(context, null, 0);
}

// ─── Response schema for structured output ──────────────────────────────────

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT as const,
  properties: {
    sentences: {
      type: SchemaType.ARRAY as const,
      items: { type: SchemaType.STRING as const },
    },
    components: {
      type: SchemaType.ARRAY as const,
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          type: { type: SchemaType.STRING as const },
          data: { type: SchemaType.OBJECT as const, properties: {} },
        },
      },
    },
    followUps: {
      type: SchemaType.ARRAY as const,
      items: { type: SchemaType.STRING as const },
    },
  },
  required: ['sentences', 'components', 'followUps'],
};

// ─── Main export ────────────────────────────────────────────────────────────

export async function queryGemini(
  query: string,
  snapshot: IBiSnapshot,
): Promise<BrainResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      sentences: [
        'AI analysis is not configured yet.',
        'Your competitive data has been collected — connect a Gemini API key to unlock conversational insights.',
      ],
      components: [{
        type: 'callout',
        data: { text: 'Ask your administrator to add GEMINI_API_KEY to the environment variables.' },
      }],
      followUps: [],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const context = buildContext(snapshot);
    const prompt = `CONTEXT (real data from our database):\n${context}\n\nUSER QUESTION: ${query}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed.sentences) || !Array.isArray(parsed.followUps)) {
      throw new Error('Gemini returned invalid structure');
    }

    return {
      sentences: parsed.sentences,
      components: Array.isArray(parsed.components) ? parsed.components : [],
      followUps: parsed.followUps,
    };
  } catch (err) {
    console.error('[Gemini] Query failed:', err);

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
