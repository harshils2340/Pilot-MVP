export interface OverlapItem {
  item: string;
  coverage: number;
  medianPrice: number;
  examples: string[];
  receipts: MenuReceipt[];
}

export interface MenuReceipt {
  competitor: string;
  itemName: string;
  price: number;
}

export interface UnderservedCategory {
  category: string;
  coverage: number;
  opportunity: 'High' | 'Medium';
  rationale: string;
}

export interface PricingCard {
  category: string;
  p25: number;
  median: number;
  p75: number;
  yourPrice: number;
  insight: string;
  coverage: string;
}

export interface ReviewTheme {
  theme: string;
  pct: number;
  signal: string;
}

export interface ReviewQuote {
  text: string;
  source: 'Google' | 'Yelp';
  stars: number;
}

export const OVERLAP_ITEMS: OverlapItem[] = [
  {
    item: 'Espresso Martini',
    coverage: 82,
    medianPrice: 18,
    examples: ['Lavelle', 'Baro', 'EightyEight'],
    receipts: [
      { competitor: 'Lavelle', itemName: 'Espresso Martini', price: 19 },
      { competitor: 'Baro', itemName: 'Espresso Martini', price: 18 },
      { competitor: 'EightyEight', itemName: 'Espresso Martini', price: 17 },
      { competitor: 'Cactus Club', itemName: 'Espresso Martini', price: 19 },
      { competitor: 'Oretta', itemName: 'Espresso Martini', price: 18 },
      { competitor: 'Bisha Hotel Bar', itemName: 'Espresso Martini', price: 20 },
      { competitor: 'Mamakas', itemName: 'Espresso Martini', price: 17 },
      { competitor: 'Belfast Love', itemName: 'Espresso Martini', price: 18 },
    ],
  },
  {
    item: 'Chicken Caesar Salad',
    coverage: 74,
    medianPrice: 21,
    examples: ['Cactus Club', 'The Keg', 'Belfast Love'],
    receipts: [
      { competitor: 'Cactus Club', itemName: 'Chicken Caesar Salad', price: 22 },
      { competitor: 'The Keg', itemName: 'Caesar Salad + Chicken', price: 24 },
      { competitor: 'Belfast Love', itemName: 'Grilled Chicken Caesar', price: 20 },
      { competitor: 'Ruby Soho', itemName: 'Chicken Caesar', price: 19 },
      { competitor: 'King Taps', itemName: 'Caesar Salad', price: 18 },
      { competitor: 'Bisha Hotel Bar', itemName: 'Chicken Caesar', price: 23 },
    ],
  },
  {
    item: 'Smash Burger',
    coverage: 67,
    medianPrice: 24,
    examples: ['King Taps', 'Ruby Soho', 'The Keg'],
    receipts: [
      { competitor: 'King Taps', itemName: 'Classic Smash Burger', price: 23 },
      { competitor: 'Ruby Soho', itemName: 'Double Smash', price: 26 },
      { competitor: 'The Keg', itemName: 'Smash Burger', price: 28 },
      { competitor: 'Regulars', itemName: 'House Smash', price: 22 },
      { competitor: 'Cactus Club', itemName: 'Smash Burger', price: 24 },
      { competitor: 'Belfast Love', itemName: 'Smash Burger', price: 21 },
      { competitor: 'Mamakas', itemName: 'Smash Burger', price: 24 },
    ],
  },
  {
    item: 'Truffle Fries',
    coverage: 61,
    medianPrice: 14,
    examples: ['Cactus Club', 'Belfast Love', 'Oretta'],
    receipts: [
      { competitor: 'Cactus Club', itemName: 'Truffle Parmesan Fries', price: 14 },
      { competitor: 'Belfast Love', itemName: 'Truffle Fries', price: 13 },
      { competitor: 'Oretta', itemName: 'Truffle & Pecorino Fries', price: 16 },
      { competitor: 'Baro', itemName: 'Truffle Frites', price: 15 },
      { competitor: 'King Taps', itemName: 'Truffle Fries', price: 13 },
      { competitor: 'Bisha Hotel Bar', itemName: 'Truffle Fries', price: 15 },
    ],
  },
  {
    item: 'Chicken Sliders',
    coverage: 55,
    medianPrice: 19,
    examples: ['Regulars', 'Bisha', 'Mamakas'],
    receipts: [
      { competitor: 'Regulars', itemName: 'Crispy Chicken Sliders (3)', price: 19 },
      { competitor: 'Bisha Hotel Bar', itemName: 'Chicken Sliders', price: 21 },
      { competitor: 'Mamakas', itemName: 'Spiced Chicken Sliders', price: 18 },
      { competitor: 'Ruby Soho', itemName: 'Chicken Sliders (2)', price: 17 },
      { competitor: 'King Taps', itemName: 'Buffalo Chicken Sliders', price: 20 },
    ],
  },
  {
    item: 'Spicy Margarita',
    coverage: 49,
    medianPrice: 17,
    examples: ['Añejo', 'El Catrin', 'Patria'],
    receipts: [
      { competitor: 'Añejo', itemName: 'Jalapeño Margarita', price: 17 },
      { competitor: 'El Catrin', itemName: 'Spicy Marg', price: 16 },
      { competitor: 'Patria', itemName: 'Picante Margarita', price: 18 },
      { competitor: 'Baro', itemName: 'Spicy Margarita', price: 17 },
      { competitor: 'Lavelle', itemName: 'Spicy Margarita', price: 19 },
      { competitor: 'Cactus Club', itemName: 'Spicy Margarita', price: 17 },
    ],
  },
  {
    item: 'Charcuterie / Cheese Board',
    coverage: 43,
    medianPrice: 28,
    examples: ['Oretta', 'Patria', 'Baro'],
    receipts: [
      { competitor: 'Oretta', itemName: 'Salumi & Formaggi Board', price: 32 },
      { competitor: 'Patria', itemName: 'Charcuterie Board', price: 29 },
      { competitor: 'Baro', itemName: 'Cheese & Charcuterie', price: 28 },
      { competitor: 'Belfast Love', itemName: 'Cheese Board', price: 24 },
      { competitor: 'Lavelle', itemName: 'Charcuterie Selection', price: 30 },
    ],
  },
  {
    item: 'Ahi Tuna Tartare',
    coverage: 36,
    medianPrice: 22,
    examples: ['Lavelle', 'Bisha', 'Cactus Club'],
    receipts: [
      { competitor: 'Lavelle', itemName: 'Ahi Tuna Tartare', price: 24 },
      { competitor: 'Bisha Hotel Bar', itemName: 'Tuna Tartare', price: 23 },
      { competitor: 'Cactus Club', itemName: 'Ahi Tartare', price: 21 },
      { competitor: 'The Keg', itemName: 'Tuna Tartare', price: 22 },
    ],
  },
  {
    item: 'Pasta (cacio e pepe / carbonara)',
    coverage: 31,
    medianPrice: 26,
    examples: ['Oretta', 'Baro', 'Ruby Soho'],
    receipts: [
      { competitor: 'Oretta', itemName: 'Cacio e Pepe', price: 28 },
      { competitor: 'Baro', itemName: 'Carbonara', price: 27 },
      { competitor: 'Ruby Soho', itemName: 'Pasta Carbonara', price: 24 },
      { competitor: 'Belfast Love', itemName: 'House Pasta', price: 25 },
    ],
  },
  {
    item: 'Loaded Fries',
    coverage: 27,
    medianPrice: 16,
    examples: ['King Taps', 'Regulars', 'Ruby Soho'],
    receipts: [
      { competitor: 'King Taps', itemName: 'Fully Loaded Fries', price: 17 },
      { competitor: 'Regulars', itemName: 'House Loaded Fries', price: 15 },
      { competitor: 'Ruby Soho', itemName: 'Loaded Fries', price: 16 },
      { competitor: 'Belfast Love', itemName: 'Pulled Pork Fries', price: 17 },
    ],
  },
];

export const UNDERSERVED_CATEGORIES: UnderservedCategory[] = [
  {
    category: 'Late-night food (after 11pm)',
    coverage: 18,
    opportunity: 'High',
    rationale: 'High foot traffic after 11PM with almost no kitchen options in the corridor.',
  },
  {
    category: 'Non-alcoholic craft drinks',
    coverage: 12,
    opportunity: 'High',
    rationale: 'Consistently mentioned in reviews but missing from most menus — growing demand segment.',
  },
  {
    category: 'Share plates',
    coverage: 29,
    opportunity: 'Medium',
    rationale: 'Groups default to venues with sharable formats. Increases average table spend by ~22%.',
  },
  {
    category: 'Gluten-free mains',
    coverage: 22,
    opportunity: 'Medium',
    rationale: 'Low coverage despite being a standard ask. Easy differentiator with minimal kitchen complexity.',
  },
];

export const OPPORTUNITY_BULLETS: string[] = [
  'Only 2 of 14 venues serve food after 11PM. Late-night kitchen hours is the single biggest uncaptured revenue window on this strip.',
  'NA craft cocktails appear on fewer than 1 in 8 menus but are mentioned positively in 14% of competitor reviews — clear demand with almost no supply.',
  'Menu convergence across competitors is high. The gap isn\'t concept — it\'s quality, consistency, and hours.',
  'Items above 60% coverage (Espresso Martini, Caesar, Smash Burger) are table stakes. Being on the menu isn\'t the win — execution is.',
  'Charcuterie and tuna tartare sit below 45% coverage but index toward the same high-spend demographic that drives late-night revenue. Both are high-margin, low-waste additions.',
  'The wide price spread on share plates ($12–$21) signals that customers are willing to pay up — but only if portion size and presentation justify it. Under-delivering at $18+ is worse than not offering it.',
  'Loaded fries at 27% coverage is the most asymmetric opportunity on the list: low competition, low food cost, high repeat-order rate, and easy to execute under pressure.',
];

export const PRICING_CARDS: PricingCard[] = [
  {
    category: 'Cocktails',
    p25: 16,
    median: 18,
    p75: 21,
    yourPrice: 19,
    insight: 'You\'re priced just above median — strong value signal without undercutting premium positioning.',
    coverage: '13 of 14 menus',
  },
  {
    category: 'Burgers / Entrees',
    p25: 22,
    median: 26,
    p75: 32,
    yourPrice: 27,
    insight: 'Sitting at median. Moving to $28–30 is defensible if plating and portion are strong.',
    coverage: '11 of 14 menus',
  },
  {
    category: 'Share Plates',
    p25: 12,
    median: 16,
    p75: 21,
    yourPrice: 18,
    insight: 'You\'re in the upper quartile — justify it with format and generosity, not just ingredients.',
    coverage: '9 of 14 menus',
  },
  {
    category: 'Brunch Mains',
    p25: 18,
    median: 23,
    p75: 29,
    yourPrice: 24,
    insight: 'Weekend brunch tolerance on King West is high. $24–26 is the sweet spot for repeat visits.',
    coverage: '8 of 14 menus',
  },
];

export const REVIEW_THEMES: ReviewTheme[] = [
  { theme: 'Wait times', pct: 28, signal: 'Staffing or floor management — not a kitchen problem.' },
  { theme: 'Noise level', pct: 21, signal: 'Acoustic investment pays off in repeat visits and event bookings.' },
  { theme: 'Price / value', pct: 17, signal: 'Portion size and presentation matter more than price point itself.' },
  { theme: 'Service quality', pct: 14, signal: 'Training and table ownership — high impact, low cost to fix.' },
  { theme: 'Drinks quality', pct: 11, signal: 'Positive signal: when mentioned, it\'s usually a compliment.' },
  { theme: 'Food consistency', pct: 9, signal: 'Weekend volume is the trigger — kitchen SOPs under pressure.' },
];

export const REVIEW_QUOTES: ReviewQuote[] = [
  { text: 'Great vibe, but waited 25 minutes for drinks on a Thursday.', source: 'Google', stars: 3 },
  { text: 'Cocktails are elite, but it\'s loud after 10 — bring earplugs.', source: 'Yelp', stars: 4 },
  { text: 'Patio is the best part of the place, hands down.', source: 'Google', stars: 5 },
  { text: 'Food hits when it\'s not slammed. Inconsistent on weekends.', source: 'Yelp', stars: 3 },
  { text: 'Exactly what King West should be — just needs to sort out the wait.', source: 'Google', stars: 4 },
  { text: 'Overpriced for what it is, but the crowd is fun.', source: 'Yelp', stars: 3 },
];

export const ACTIONABLE_SUMMARY =
  'Wait times and noise dominate negative reviews across this corridor — not menu quality. The venues winning repeat business are solving for experience consistency, not concept novelty. Own late-night and you own a window nobody else is competing in.';
