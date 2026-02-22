/**
 * AI Insights response engine.
 * Pattern-matches user questions to pre-built rich responses,
 * simulating a real location-intelligence AI without any external API calls.
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

// ─── helpers ────────────────────────────────────────────────────────────────

function matches(q: string, keywords: string[]): boolean {
  return keywords.some((k) => q.includes(k));
}

// ─── individual responses ────────────────────────────────────────────────────

function competitionResponse(): BrainResponse {
  return {
    sentences: [
      "Within 500m of King West Kitchen & Bar, there are 18 food & beverage venues actively operating.",
      "I found 14 with accessible menus — enough to build a solid competitive picture.",
      "The corridor skews heavily toward cocktail bars and casual dining, with strong convergence around the same core menu items.",
      "Here's the landscape at a glance.",
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Venues in radius', value: '18', sub: '500m radius' },
          { label: 'Menus analyzed', value: '14', sub: 'of 18 venues' },
          { label: 'Avg menu overlap', value: '54%', sub: 'across top items', highlight: true },
          { label: 'White space items', value: '4', sub: 'low coverage, high demand' },
        ] as MetricItem[],
      },
      {
        type: 'data-table',
        title: 'Most competitive items (by coverage)',
        data: {
          headers: ['Item', 'Coverage', 'Median Price'],
          rows: [
            { cells: ['Espresso Martini', '82%', '$18'] },
            { cells: ['Chicken Caesar Salad', '74%', '$21'] },
            { cells: ['Smash Burger', '67%', '$24'] },
            { cells: ['Truffle Fries', '61%', '$14'] },
            { cells: ['Chicken Sliders', '55%', '$19'] },
          ],
        },
      },
    ],
    followUps: [
      'Where are the biggest gaps I can own?',
      'How does my pricing compare to the corridor?',
      "What are customers complaining about at competitors?",
    ],
  };
}

function pricingResponse(): BrainResponse {
  return {
    sentences: [
      "I benchmarked four key categories against 13 menus in the corridor.",
      "Overall your planned pricing is well-calibrated — you're sitting near or just above median on most categories, which is the right zone for this street.",
      "The biggest opportunity is in share plates, where the price spread is wide enough that you can push higher without losing the room.",
    ],
    components: [
      {
        type: 'price-bands',
        title: 'Your price vs. the corridor',
        data: [
          { category: 'Cocktails', p25: 16, median: 18, p75: 21, yours: 19 },
          { category: 'Burgers / Entrees', p25: 22, median: 26, p75: 32, yours: 27 },
          { category: 'Share Plates', p25: 12, median: 16, p75: 21, yours: 18 },
          { category: 'Brunch Mains', p25: 18, median: 23, p75: 29, yours: 24 },
        ] as PriceBand[],
      },
      {
        type: 'callout',
        data: {
          text: "Share plates have the widest price spread ($12–$21) of any category. Customers here are willing to pay up — but only when portion and presentation justify it. Under-delivering at $18+ is worse than not offering it.",
        },
      },
    ],
    followUps: [
      'Am I leaving money on the table anywhere?',
      'What do customers say about value at nearby venues?',
      'Which items have the best margin profile?',
    ],
  };
}

function menuGapsResponse(): BrainResponse {
  return {
    sentences: [
      "Here's where the market is genuinely underserved — low competitor coverage combined with evidence of customer demand.",
      "Late-night kitchen service is the standout gap: high foot traffic after 11PM with almost no kitchen options in the corridor.",
      "Non-alcoholic craft drinks are the sleeper hit — mentioned positively in 14% of reviews across competitors, but barely on any menu.",
    ],
    components: [
      {
        type: 'bar-list',
        title: 'Underserved categories (competitor coverage)',
        data: [
          { label: 'NA craft drinks', value: 12, max: 100, unit: '%', signal: 'First-mover available' },
          { label: 'Late-night food (11PM+)', value: 18, max: 100, unit: '%', signal: 'Highest revenue upside' },
          { label: 'Gluten-free mains', value: 22, max: 100, unit: '%', signal: 'Easy to add, low complexity' },
          { label: 'Share plates', value: 29, max: 100, unit: '%', signal: 'Raises avg table spend ~22%' },
        ] as BarItem[],
      },
      {
        type: 'metric-grid',
        data: [
          { label: 'Late-night kitchen coverage', value: '2/14', sub: 'venues with food after 11PM', highlight: true },
          { label: 'NA drink coverage', value: '1/8', sub: 'menus with craft NA options' },
          { label: 'Review mentions of NA', value: '14%', sub: 'positive sentiment' },
          { label: 'Share plate price spread', value: '$12–21', sub: 'pricing power available' },
        ] as MetricItem[],
      },
    ],
    followUps: [
      'What should a late-night menu actually look like here?',
      'Which gap has the best return on investment?',
      'How does share plate pricing work in this corridor?',
    ],
  };
}

function reviewsResponse(): BrainResponse {
  return {
    sentences: [
      "Across ~340 reviews from 18 nearby venues, the patterns are pretty clear.",
      "Wait times and noise dominate — together they account for nearly half of all negative mentions.",
      "Importantly, these are operational problems, not concept problems. The venues getting bad reviews aren't getting them for bad food — they're getting them for slow service and a loud room.",
      "The venues winning repeat visits are solving for experience consistency, not menu novelty.",
    ],
    components: [
      {
        type: 'bar-list',
        title: 'What customers complain about (% of negative mentions)',
        data: [
          { label: 'Wait times', value: 28, max: 100, unit: '%', signal: 'Floor management, not kitchen' },
          { label: 'Noise level', value: 21, max: 100, unit: '%', signal: 'Acoustic investment pays off' },
          { label: 'Price / value', value: 17, max: 100, unit: '%', signal: 'Portion & presentation matter most' },
          { label: 'Service quality', value: 14, max: 100, unit: '%', signal: 'Table ownership & training' },
          { label: 'Drinks quality', value: 11, max: 100, unit: '%', signal: 'Usually a compliment when mentioned' },
          { label: 'Food consistency', value: 9, max: 100, unit: '%', signal: 'Weekend volume is the trigger' },
        ] as BarItem[],
      },
      {
        type: 'callout',
        data: {
          text: "The venues that get called out for noise tend to lose the corporate event and birthday booking revenue — that's recurring high-ticket business. Acoustic investment is an ROI decision, not just ambiance.",
        },
      },
    ],
    followUps: [
      'What specifically triggers the wait time complaints?',
      'How do I turn noise management into a competitive advantage?',
      'What do the best-reviewed venues on King West do differently?',
    ],
  };
}

function lateNightResponse(): BrainResponse {
  return {
    sentences: [
      "Late-night is the single biggest uncaptured revenue window on this strip — and the numbers are stark.",
      "Only 2 of 14 venues with menus offer full kitchen service after 11PM, despite King West having strong foot traffic well past midnight on weekends.",
      "The venues that do run late-night kitchen report disproportionately high per-cover revenue from that window — smaller crowds, higher ticket, less competition.",
      "Here's the full picture.",
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Venues with kitchen after 11PM', value: '2/14', sub: '86% of menus go dark', highlight: true },
          { label: 'Estimated weekend foot traffic', value: 'High', sub: 'Fri–Sat after midnight' },
          { label: 'Avg late-night check size', value: '+31%', sub: 'vs. prime time, corridor avg' },
          { label: 'Late-night NA option coverage', value: '0/14', sub: 'completely unserved' },
        ] as MetricItem[],
      },
      {
        type: 'callout',
        data: {
          text: "A focused late-night menu (8–12 items, high-margin, low-waste) running 11PM–2AM positions you as the default destination after other kitchens close. Combined with NA options, you capture both the drinking and non-drinking crowd.",
        },
      },
    ],
    followUps: [
      'What items work best for a late-night menu?',
      'What are the operational implications of late-night kitchen?',
      'How does late-night affect my permit and licensing timeline?',
    ],
  };
}

function differentiationResponse(): BrainResponse {
  return {
    sentences: [
      "The honest answer is that concept differentiation on King West is nearly impossible — the corridor is saturated with cocktail bars doing comfort food.",
      "The differentiation opportunity is in three specific areas where competitors are either absent or failing.",
      "Own late-night, get NA drinks right, and be operationally consistent — that's the formula that builds repeat business in this corridor.",
    ],
    components: [
      {
        type: 'data-table',
        title: 'Where you can own the room',
        data: {
          headers: ['Opportunity', 'Competitor Coverage', 'Difficulty', 'Revenue Impact'],
          rows: [
            { cells: ['Late-night kitchen (11PM+)', '14%', 'Medium', 'High'] },
            { cells: ['NA craft cocktail program', '12%', 'Low', 'Medium'] },
            { cells: ['Consistent weekend execution', 'Poor corridor-wide', 'Medium', 'High'] },
            { cells: ['Charcuterie / sharing format', '43%', 'Low', 'Medium'] },
            { cells: ['Loaded fries (bar staple)', '27%', 'Low', 'Medium'] },
          ],
        },
      },
      {
        type: 'callout',
        data: {
          text: "The venues winning on King West aren't winning on menu novelty — they're winning on reliability. Being the place that's always good, always available late, and always has your drink is worth more than any concept innovation.",
        },
      },
    ],
    followUps: [
      'What does the ideal menu look like based on all of this?',
      'How does this change my opening strategy?',
      "What's the competitive risk if I don't go late-night?",
    ],
  };
}

function specificItemResponse(item: string): BrainResponse {
  const items: Record<string, BrainResponse> = {
    'espresso martini': {
      sentences: [
        "The Espresso Martini is on 82% of competitor menus — it's the most saturated item on King West.",
        "You should absolutely carry it, but you won't win on having it. You win on executing it better.",
        "The median price is $18 — pricing at $19–20 is fully defensible if the presentation is strong.",
      ],
      components: [
        {
          type: 'data-table',
          title: 'Espresso Martini — competitor prices',
          data: {
            headers: ['Venue', 'Price'],
            rows: [
              { cells: ['Bisha Hotel Bar', '$20'] },
              { cells: ['Lavelle', '$19'] },
              { cells: ['Cactus Club', '$19'] },
              { cells: ['Baro', '$18'] },
              { cells: ['Belfast Love', '$18'] },
              { cells: ['Oretta', '$18'] },
              { cells: ['Mamakas', '$17'] },
              { cells: ['EightyEight', '$17'] },
            ],
          },
        },
      ],
      followUps: [
        'What cocktails have less competition?',
        'What should my full cocktail pricing look like?',
      ],
    },
    'smash burger': {
      sentences: [
        "Smash Burger is on 67% of menus — saturated but not as bad as the Espresso Martini.",
        "The median price is $24, with The Keg at the top ($28) setting the ceiling.",
        "At $27, you're above median — that's fine if the quality and presentation match. Going above $30 moves you into steakhouse positioning, which is a different customer.",
      ],
      components: [
        {
          type: 'data-table',
          title: 'Smash Burger — competitor prices',
          data: {
            headers: ['Venue', 'Item', 'Price'],
            rows: [
              { cells: ['The Keg', 'Smash Burger', '$28'] },
              { cells: ['Ruby Soho', 'Double Smash', '$26'] },
              { cells: ['Cactus Club', 'Smash Burger', '$24'] },
              { cells: ['Mamakas', 'Smash Burger', '$24'] },
              { cells: ['King Taps', 'Classic Smash Burger', '$23'] },
              { cells: ['Belfast Love', 'Smash Burger', '$21'] },
              { cells: ['Regulars', 'House Smash', '$22'] },
            ],
          },
        },
      ],
      followUps: [
        'What entrees have less competition than the smash burger?',
        'What should my full entree pricing look like?',
      ],
    },
  };

  const key = Object.keys(items).find((k) => item.includes(k));
  if (key) return items[key];

  return defaultResponse();
}

function overviewResponse(): BrainResponse {
  return {
    sentences: [
      "I've analyzed 18 competitors and 14 menus within 500m of King West Kitchen & Bar.",
      "Here's a quick summary of what the data shows — ask me anything to go deeper.",
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Venues analyzed', value: '18', sub: '500m radius' },
          { label: 'Menus found', value: '14', sub: 'pricing + coverage data' },
          { label: 'Biggest gap', value: 'Late-night', sub: 'only 2/14 serve after 11PM', highlight: true },
          { label: 'Review themes', value: '340+', sub: 'reviews across corridor' },
        ] as MetricItem[],
      },
    ],
    followUps: [
      "What's the competitive landscape look like?",
      'Where are the biggest pricing gaps?',
      "What are customers complaining about nearby?",
      "What's the late-night opportunity?",
      'How do I differentiate from competitors?',
    ],
  };
}

function defaultResponse(): BrainResponse {
  return {
    sentences: [
      "I can pull insights across the full competitive dataset for King West Kitchen & Bar.",
      "Try asking me something specific — or pick one of the topics below to start.",
    ],
    components: [],
    followUps: [
      "What's the competitive landscape look like?",
      'Where are the biggest menu gaps I can own?',
      'How does my pricing compare to the corridor?',
      "What are customers complaining about?",
      "What's the late-night opportunity?",
      'How do I differentiate from competitors?',
    ],
  };
}

// ─── demo script responses (exact-match, always fire first) ──────────────────

function demoCocktailPricing(): BrainResponse {
  return {
    sentences: [
      "Your cocktails are priced at **$19** — that puts you just above the corridor median of $18, which is exactly where you want to be.",
      "Only 3 of 13 venues charge more than you, and they're either hotel bars or rooftop venues with an obvious premium reason.",
      "You're not the cheapest and you're not the most expensive — you're priced like a destination bar, not a neighbourhood spot. That's the right call for King West.",
    ],
    components: [
      {
        type: 'data-table',
        title: 'Cocktail pricing — full corridor breakdown',
        data: {
          headers: ['Venue', 'Price', 'vs. You'],
          rows: [
            { cells: ['Bisha Hotel Bar', '$20', '▲ $1'] },
            { cells: ['Lavelle', '$19', '— same'] },
            { cells: ['Cactus Club', '$19', '— same'] },
            { cells: ['YOU (King West K&B)', '$19', '—'] },
            { cells: ['Baro', '$18', '▼ $1'] },
            { cells: ['Belfast Love', '$18', '▼ $1'] },
            { cells: ['Oretta', '$18', '▼ $1'] },
            { cells: ['Mamakas', '$17', '▼ $2'] },
            { cells: ['EightyEight', '$17', '▼ $2'] },
          ],
        },
      },
      {
        type: 'callout',
        data: {
          text: "One move worth considering: a $21–22 signature cocktail alongside your standard menu. Lavelle and Bisha do this well — it creates a premium anchor and makes $19 feel like the value option without touching your base pricing.",
        },
      },
    ],
    followUps: [
      'What menu gaps can I realistically own in year one?',
      'How do I use pricing to build a premium perception?',
      "What's performing well at venues priced above me?",
    ],
  };
}

function demoMenuGapsYearOne(): BrainResponse {
  return {
    sentences: [
      "Two gaps stand out as genuinely ownable in year one — not because they're easy, but because the competition is essentially zero.",
      "**Late-night kitchen** and **non-alcoholic craft drinks**. Together they cover two underserved customer segments that King West consistently fails right now.",
      "Both are executable without a major menu overhaul, and both have direct evidence of demand in competitor reviews.",
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Venues with kitchen after 11PM', value: '2 / 14', sub: '86% of the strip goes dark', highlight: true },
          { label: 'NA drink coverage', value: '1 / 8', sub: 'menus with craft NA options' },
          { label: 'NA mentions in reviews', value: '14%', sub: 'of all positive mentions' },
          { label: 'Incremental rev potential', value: 'High', sub: 'late-night check avg +31%' },
        ] as MetricItem[],
      },
      {
        type: 'bar-list',
        title: 'Year-one gap ranking by effort vs. return',
        data: [
          { label: 'Late-night kitchen', value: 86, unit: '% gap', signal: 'High return · Medium effort' },
          { label: 'NA craft cocktails', value: 88, unit: '% gap', signal: 'High return · Low effort' },
          { label: 'Gluten-free mains', value: 78, unit: '% gap', signal: 'Medium return · Low effort' },
          { label: 'Loaded fries / bar staple', value: 73, unit: '% gap', signal: 'Medium return · Very low effort' },
        ] as BarItem[],
      },
    ],
    followUps: [
      "How big is the late-night opportunity actually?",
      'What should a late-night menu look like here?',
      'How do I price NA cocktails to make them worthwhile?',
    ],
  };
}

function demoLateNightSize(): BrainResponse {
  return {
    sentences: [
      "The late-night window — 11PM to close — is the most asymmetric opportunity on King West right now.",
      "Here's what the data shows: on Friday and Saturday nights, foot traffic in the corridor stays elevated well past midnight, but 12 of 14 kitchens are closed.",
      "The venues that do run late-night kitchen report a **+31% average check size** versus prime time, and significantly higher bar attachment per cover.",
      "The math is straightforward — a 40-cover late-night session at a higher average ticket adds up fast.",
    ],
    components: [
      {
        type: 'metric-grid',
        data: [
          { label: 'Kitchens open after 11PM', value: '2 of 14', sub: 'your direct competition', highlight: true },
          { label: 'Late-night check size premium', value: '+31%', sub: 'vs. prime time avg' },
          { label: 'Est. incremental covers (Fri–Sat)', value: '35–50', sub: 'per night at steady state' },
          { label: 'Foot traffic index (11PM–1AM)', value: 'High', sub: 'Fri–Sat, King West corridor' },
        ] as MetricItem[],
      },
      {
        type: 'callout',
        data: {
          text: "A focused 8–10 item late-night menu (high-margin, low-waste, easy under pressure) running 11PM–2AM on weekends is a $150–200K annual revenue addition at conservative assumptions. It also builds the brand signal that matters most on this strip: you're always open.",
        },
      },
    ],
    followUps: [
      "What's tanking competitor ratings on King West?",
      'What items work best for a late-night menu?',
      'What are the permit implications of late-night service?',
    ],
  };
}

function demoCompetitorRatings(): BrainResponse {
  return {
    sentences: [
      "Across ~340 reviews from 18 venues, the pattern is unusually consistent — **it's not the food that's getting people**.",
      "Wait times and noise account for nearly half of all negative mentions combined.",
      "The venues getting dinged aren't getting bad reviews because of bad cocktails or bad concepts. They're getting them because of slow service and rooms that are too loud to have a conversation.",
      "This is almost entirely an operations and fit-out problem — both of which are solvable before you open.",
    ],
    components: [
      {
        type: 'bar-list',
        title: 'Negative review themes — 18 venues, ~340 reviews',
        data: [
          { label: 'Wait times', value: 28, unit: '%', signal: 'Floor management issue, not kitchen speed' },
          { label: 'Noise level', value: 21, unit: '%', signal: 'Acoustic panels = ROI, not just ambiance' },
          { label: 'Price / value', value: 17, unit: '%', signal: 'Portion and presentation matter more than price' },
          { label: 'Service quality', value: 14, unit: '%', signal: 'Table ownership, not headcount' },
          { label: 'Drinks quality', value: 11, unit: '%', signal: 'Usually a compliment when mentioned' },
          { label: 'Food consistency', value: 9, unit: '%', signal: 'Triggered by weekend volume, not concept' },
        ] as BarItem[],
      },
      {
        type: 'callout',
        data: {
          text: "Noise management is the most underrated business decision on King West. The venues with noise complaints consistently lose corporate and birthday event bookings — that's recurring $2–5K nights going to quieter rooms down the street.",
        },
      },
    ],
    followUps: [
      'What should my opening strategy be?',
      'How do I turn operations into a competitive advantage?',
      'Which venues are actually doing it well and why?',
    ],
  };
}

function demoOpeningStrategy(): BrainResponse {
  return {
    sentences: [
      "Pulling everything together — pricing, gaps, competitor failures, and late-night data — here's what the opening strategy looks like.",
      "Three moves, in order of impact.",
    ],
    components: [
      {
        type: 'data-table',
        title: 'Opening strategy — prioritized by impact',
        data: {
          headers: ['Priority', 'Move', 'Why it wins', 'Timeline'],
          rows: [
            { cells: ['1', 'Launch late-night kitchen (Fri–Sat, 11PM–2AM)', 'Only 2 competitors doing it. +31% check size. Defines your brand.', 'Day 1'] },
            { cells: ['2', 'Build a 4–6 item NA cocktail program', 'Under 1 in 8 menus have it. 14% of competitor reviews mention demand. Low cost.', 'Day 1'] },
            { cells: ['3', 'Invest in acoustic treatment during fit-out', '21% of competitor reviews cite noise. Keeps event bookings. Cheaper pre-open.', 'Pre-open'] },
          ],
        },
      },
      {
        type: 'metric-grid',
        data: [
          { label: 'Cocktail pricing', value: '$19', sub: 'above median, defensible', highlight: false },
          { label: 'Late-night competition', value: '2 of 14', sub: 'nearly empty window', highlight: true },
          { label: 'NA drink competition', value: '1 of 8', sub: 'first-mover available' },
          { label: 'Top risk to mitigate', value: 'Noise', sub: '21% of all neg. reviews' },
        ] as MetricItem[],
      },
      {
        type: 'callout',
        data: {
          text: "The venues winning repeat business on King West aren't winning on menu novelty — they're winning on reliability. Be the place that's always good, always open late, and always has your drink. That's the moat.",
        },
      },
    ],
    followUps: [
      'How do I structure the late-night menu for margin?',
      'What does the permit timeline look like for late-night service?',
      'Which competitors should I be watching most closely?',
    ],
  };
}

// ─── main export ─────────────────────────────────────────────────────────────

export function getResponse(input: string): BrainResponse {
  const q = input.toLowerCase();

  // ── Demo script exact matches (checked first) ──
  if (matches(q, ['competitive is my cocktail', 'cocktail pricing', 'how competitive is my cock'])) {
    return demoCocktailPricing();
  }
  if (matches(q, ['realistically own', 'own in year one', 'gaps can i realistically', 'year one'])) {
    return demoMenuGapsYearOne();
  }
  if (matches(q, ['how big is the late', 'late-night opportunity actually', 'late night opportunity actually', 'big is the late'])) {
    return demoLateNightSize();
  }
  if (matches(q, ['tanking competitor', "what's tanking", 'whats tanking', 'killing competitor', 'competitor ratings'])) {
    return demoCompetitorRatings();
  }
  if (matches(q, ['opening strategy', 'my opening', 'what should my opening'])) {
    return demoOpeningStrategy();
  }

  if (matches(q, ['competi', 'nearby', 'landscape', 'who else', 'who\'s around', 'around me', 'surroundings', 'market look'])) {
    return competitionResponse();
  }
  if (matches(q, ['pric', 'cost', 'charge', 'expensive', 'cheap', 'benchmark', 'how much', 'money on the table'])) {
    return pricingResponse();
  }
  if (matches(q, ['late', 'night', 'midnight', 'after 11', 'after hours', '2am', '1am'])) {
    return lateNightResponse();
  }
  if (matches(q, ['gap', 'underserv', 'white space', 'opportunit', 'missing', 'nobody', 'nobody does', 'what\'s not'])) {
    return menuGapsResponse();
  }
  if (matches(q, ['review', 'complaint', 'customer', 'feedback', 'say about', 'people say', 'yelp', 'google'])) {
    return reviewsResponse();
  }
  if (matches(q, ['differentiat', 'stand out', 'unique', 'own the', 'better than', 'beat', 'win', 'competitive edge'])) {
    return differentiationResponse();
  }
  if (matches(q, ['espresso martini', 'smash burger', 'truffle fries', 'margarita', 'charcuterie', 'caesar', 'sliders', 'tuna', 'pasta', 'loaded fries'])) {
    return specificItemResponse(q);
  }
  if (matches(q, ['overview', 'summary', 'everything', 'full picture', 'tell me about', 'what do you know', 'show me'])) {
    return overviewResponse();
  }

  return defaultResponse();
}

export const WELCOME_RESPONSE: BrainResponse = {
  sentences: [
    `I've analyzed **18 competitors** and **14 menus** within 500m of King West Kitchen & Bar.`,
    "Ask me anything about the competitive landscape, pricing, menu gaps, or what customers are saying about nearby venues.",
  ],
  components: [
    {
      type: 'metric-grid',
      data: [
        { label: 'Venues in radius', value: '18', sub: '500m · King West, Toronto' },
        { label: 'Menus analyzed', value: '14', sub: 'pricing & coverage data' },
        { label: 'Biggest gap', value: 'Late-night', sub: 'only 2/14 serve after 11PM', highlight: true },
        { label: 'Top complaint', value: 'Wait times', sub: '28% of negative reviews' },
      ] as MetricItem[],
    },
  ],
  followUps: [
    "What's the competitive landscape?",
    'Where are the biggest gaps I can own?',
    'How does my pricing compare?',
    "What are customers complaining about?",
    "What's the late-night opportunity?",
  ],
};
