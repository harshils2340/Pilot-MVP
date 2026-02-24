/**
 * Industry benchmarks for restaurant revenue estimation.
 *
 * Multi-market support: Toronto (CAD) and San Francisco (USD).
 *
 * Sources:
 * - National Restaurant Association (NRA) 2024 State of the Industry
 * - Restaurants Canada Foodservice Facts 2024
 * - Cornell Hotel & Restaurant Administration RevPASH research
 * - Industry POS benchmarking reports (2024)
 * - California Restaurant Association 2024 data
 * - SF Planning Department hospitality reports
 */

// ─── Market definition ──────────────────────────────────────────────────────

export type Market = 'toronto' | 'san_francisco';

export interface MarketInfo {
  name: string;
  currency: 'CAD' | 'USD';
  country: string;
  province: string;
  timezone: string;
}

export const MARKETS: Record<Market, MarketInfo> = {
  toronto: {
    name: 'Toronto',
    currency: 'CAD',
    country: 'Canada',
    province: 'Ontario',
    timezone: 'America/Toronto',
  },
  san_francisco: {
    name: 'San Francisco',
    currency: 'USD',
    country: 'United States',
    province: 'California',
    timezone: 'America/Los_Angeles',
  },
};

/**
 * Infer market from any combination of address, city, or country strings.
 * Works with full addresses like "123 King St W, Toronto, ON" or
 * just city names like "San Francisco".
 */
export function inferMarket(...hints: (string | undefined | null)[]): Market {
  const combined = hints.filter(Boolean).join(' ').toLowerCase();
  if (
    combined.includes('san francisco')
    || combined.includes('bay area')
    || combined.includes('california')
    || combined.includes(', ca ')
    || combined.endsWith(', ca')
  ) return 'san_francisco';
  if (combined.includes('united states') || combined === 'us') return 'san_francisco';
  return 'toronto';
}

// ─── Venue classification ────────────────────────────────────────────────────

export type VenueType = 'bar' | 'casual_dining' | 'fast_casual' | 'fine_dining' | 'cafe' | 'pub';

export type Daypart = 'breakfast' | 'lunch' | 'happy_hour' | 'dinner' | 'late_night';

export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAY_NAMES: DayName[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export function inferVenueType(
  types: string[],
  primaryType?: string,
  priceLevel?: number | null,
): VenueType {
  const all = [primaryType, ...types].filter(Boolean).map(t => t!.toLowerCase());

  if (all.some(t => t.includes('cafe') || t.includes('coffee'))) return 'cafe';
  if (all.some(t => t.includes('fine_dining')) || priceLevel === 4) return 'fine_dining';
  if (all.some(t => t.includes('fast') || t.includes('quick'))) return 'fast_casual';
  if (all.some(t => t.includes('bar') || t.includes('night_club') || t.includes('lounge'))) return 'bar';
  if (all.some(t => t.includes('pub') || t.includes('brewery'))) return 'pub';
  return 'casual_dining';
}

// ─── Seat count defaults ─────────────────────────────────────────────────────
// Used when no seat count is available from the consultant or Google Maps.
// Toronto: Restaurants Canada 2024 median venue sizes.
// SF: Smaller footprints due to higher rents (California Restaurant Assoc).

export const DEFAULT_SEAT_COUNT: Record<Market, Record<VenueType, number>> = {
  toronto: {
    bar:            55,
    casual_dining:  85,
    fast_casual:    45,
    fine_dining:    50,
    cafe:           30,
    pub:            70,
  },
  san_francisco: {
    bar:            45,
    casual_dining:  65,
    fast_casual:    40,
    fine_dining:    42,
    cafe:           25,
    pub:            55,
  },
};

// ─── Daypart definitions ─────────────────────────────────────────────────────
// Hours are in 24h format. A venue only operates a daypart if its operating
// hours overlap with the daypart window.

export interface DaypartWindow {
  daypart: Daypart;
  start: number;   // inclusive
  end: number;     // exclusive
}

export const DAYPART_WINDOWS: DaypartWindow[] = [
  { daypart: 'breakfast',   start: 6,  end: 11 },
  { daypart: 'lunch',       start: 11, end: 15 },
  { daypart: 'happy_hour',  start: 15, end: 18 },
  { daypart: 'dinner',      start: 18, end: 22 },
  { daypart: 'late_night',  start: 22, end: 27 }, // 27 = 3AM next day
];

// ─── Average check by daypart and venue type ─────────────────────────────────
// food check = per-person food spend in local currency.
// Toronto (CAD): Industry POS benchmarks 2024, Restaurants Canada Ontario.
// SF (USD): Bay Area POS benchmarks, California Restaurant Assoc 2024.
// SF runs ~30-40% higher than Toronto even after currency conversion.

export const AVG_FOOD_CHECK: Record<Market, Record<VenueType, Record<Daypart, number>>> = {
  toronto: {
    bar:            { breakfast: 0,  lunch: 18, happy_hour: 14, dinner: 22, late_night: 16 },
    casual_dining:  { breakfast: 16, lunch: 22, happy_hour: 18, dinner: 32, late_night: 24 },
    fast_casual:    { breakfast: 12, lunch: 18, happy_hour: 15, dinner: 22, late_night: 0  },
    fine_dining:    { breakfast: 0,  lunch: 45, happy_hour: 35, dinner: 85, late_night: 0  },
    cafe:           { breakfast: 10, lunch: 16, happy_hour: 12, dinner: 0,  late_night: 0  },
    pub:            { breakfast: 0,  lunch: 20, happy_hour: 16, dinner: 28, late_night: 18 },
  },
  san_francisco: {
    bar:            { breakfast: 0,  lunch: 24, happy_hour: 20, dinner: 30, late_night: 22 },
    casual_dining:  { breakfast: 22, lunch: 28, happy_hour: 24, dinner: 42, late_night: 32 },
    fast_casual:    { breakfast: 16, lunch: 22, happy_hour: 19, dinner: 28, late_night: 0  },
    fine_dining:    { breakfast: 0,  lunch: 60, happy_hour: 48, dinner: 120, late_night: 0 },
    cafe:           { breakfast: 14, lunch: 20, happy_hour: 16, dinner: 0,  late_night: 0  },
    pub:            { breakfast: 0,  lunch: 26, happy_hour: 22, dinner: 36, late_night: 24 },
  },
};

// ─── Average beverage check by daypart and venue type ────────────────────────
// Per-person beverage spend in local currency.
// SF cocktail prices are notably higher ($16-20 base vs $14-18 in Toronto).

export const AVG_BEV_CHECK: Record<Market, Record<VenueType, Record<Daypart, number>>> = {
  toronto: {
    bar:            { breakfast: 0, lunch: 12, happy_hour: 16, dinner: 18, late_night: 22 },
    casual_dining:  { breakfast: 4, lunch: 8,  happy_hour: 14, dinner: 16, late_night: 18 },
    fast_casual:    { breakfast: 4, lunch: 5,  happy_hour: 6,  dinner: 7,  late_night: 0  },
    fine_dining:    { breakfast: 0, lunch: 22, happy_hour: 28, dinner: 45, late_night: 0  },
    cafe:           { breakfast: 5, lunch: 6,  happy_hour: 5,  dinner: 0,  late_night: 0  },
    pub:            { breakfast: 0, lunch: 10, happy_hour: 14, dinner: 16, late_night: 20 },
  },
  san_francisco: {
    bar:            { breakfast: 0, lunch: 16, happy_hour: 20, dinner: 24, late_night: 28 },
    casual_dining:  { breakfast: 6, lunch: 10, happy_hour: 18, dinner: 22, late_night: 24 },
    fast_casual:    { breakfast: 5, lunch: 6,  happy_hour: 8,  dinner: 9,  late_night: 0  },
    fine_dining:    { breakfast: 0, lunch: 30, happy_hour: 36, dinner: 60, late_night: 0  },
    cafe:           { breakfast: 6, lunch: 7,  happy_hour: 6,  dinner: 0,  late_night: 0  },
    pub:            { breakfast: 0, lunch: 14, happy_hour: 18, dinner: 20, late_night: 26 },
  },
};

// ─── Beverage revenue ratio ──────────────────────────────────────────────────
// What portion of total revenue comes from beverages. Used to cross-check
// and validate the per-daypart food+bev split.
// Source: NRA 2024 — full-service average is 26-30%; bars are 55-65%.

export const BEVERAGE_REVENUE_RATIO: Record<VenueType, number> = {
  bar:            0.60,
  casual_dining:  0.28,
  fast_casual:    0.12,
  fine_dining:    0.32,
  cafe:           0.35,
  pub:            0.48,
};

// ─── Table turn rate by daypart (turns per hour) ─────────────────────────────
// How many times a seat turns over per hour within a daypart.
// Lunch is fastest, dinner slowest, late-night moderate (fewer but longer).
// Source: Cornell CHR RevPASH research, cross-referenced with
// dwell time data from BestTime sample venues.

export const TURNS_PER_HOUR: Record<VenueType, Record<Daypart, number>> = {
  bar: {
    breakfast:   0,
    lunch:       0.9,
    happy_hour:  1.2,
    dinner:      0.7,
    late_night:  0.5,
  },
  casual_dining: {
    breakfast:   1.2,
    lunch:       1.1,
    happy_hour:  0.8,
    dinner:      0.6,
    late_night:  0.5,
  },
  fast_casual: {
    breakfast:   2.0,
    lunch:       2.5,
    happy_hour:  1.5,
    dinner:      1.8,
    late_night:  0,
  },
  fine_dining: {
    breakfast:   0,
    lunch:       0.5,
    happy_hour:  0.4,
    dinner:      0.35,
    late_night:  0,
  },
  cafe: {
    breakfast:   1.5,
    lunch:       1.3,
    happy_hour:  0.8,
    dinner:      0,
    late_night:  0,
  },
  pub: {
    breakfast:   0,
    lunch:       1.0,
    happy_hour:  1.1,
    dinner:      0.7,
    late_night:  0.5,
  },
};

// ─── Average party size by daypart ───────────────────────────────────────────
// Affects seat utilization. A party of 2 at a 4-top = 50% seat utilization.
// Source: Industry POS data 2024, Cornell table-mix optimization research.

export const AVG_PARTY_SIZE: Record<Daypart, number> = {
  breakfast:   1.8,
  lunch:       2.2,
  happy_hour:  2.8,
  dinner:      2.6,
  late_night:  3.2,
};

// ─── Seat utilization factor ─────────────────────────────────────────────────
// The ratio of occupied seats to theoretical capacity.
// Accounts for: party-size/table-size mismatch, reserved tables, staff tables.
// A 4-top with a party of 2 = 50% utilization for that table.
// Industry average across all tables is ~68-72%.
// Source: Cornell "Restaurant Capacity Effectiveness" (Kimes & Thompson).

export const SEAT_UTILIZATION: Record<VenueType, number> = {
  bar:            0.78,  // bar seating + high-tops pack tighter
  casual_dining:  0.70,
  fast_casual:    0.82,  // counter + communal seating is efficient
  fine_dining:    0.62,  // more spacing, reserved tables, privacy
  cafe:           0.75,
  pub:            0.72,
};

// ─── Day-of-week traffic multipliers ─────────────────────────────────────────
// Relative to the weekly average (1.0).
// Toronto: Strong Fri/Sat peaks, quiet Mon/Tue. (BestTime Toronto corridors)
// SF: More consistent weekday traffic (tech workers eat out), strong Fri/Sat
//     but less extreme swings. Sunday brunch is bigger in SF. (BestTime SF data)

export const DAY_MULTIPLIERS: Record<Market, Record<VenueType, number[]>> = {
  toronto: {
    //                           Mon   Tue   Wed   Thu   Fri   Sat   Sun
    bar:            /* 7 days */ [0.60, 0.65, 0.80, 1.00, 1.45, 1.50, 1.00],
    casual_dining:  /* 7 days */ [0.75, 0.80, 0.85, 0.95, 1.25, 1.35, 1.05],
    fast_casual:    /* 7 days */ [0.90, 0.95, 1.00, 1.00, 1.10, 1.05, 1.00],
    fine_dining:    /* 7 days */ [0.50, 0.55, 0.70, 0.90, 1.40, 1.55, 0.40],
    cafe:           /* 7 days */ [0.90, 0.95, 1.00, 1.00, 1.05, 1.10, 1.00],
    pub:            /* 7 days */ [0.65, 0.70, 0.80, 0.95, 1.40, 1.45, 1.05],
  },
  san_francisco: {
    //                           Mon   Tue   Wed   Thu   Fri   Sat   Sun
    bar:            /* 7 days */ [0.65, 0.70, 0.85, 1.05, 1.40, 1.40, 0.95],
    casual_dining:  /* 7 days */ [0.80, 0.85, 0.90, 0.95, 1.20, 1.25, 1.05],
    fast_casual:    /* 7 days */ [0.95, 1.00, 1.00, 1.00, 1.05, 1.00, 1.00],
    fine_dining:    /* 7 days */ [0.55, 0.60, 0.75, 0.95, 1.35, 1.45, 0.35],
    cafe:           /* 7 days */ [0.85, 0.90, 0.95, 1.00, 1.05, 1.15, 1.10],
    pub:            /* 7 days */ [0.70, 0.75, 0.85, 1.00, 1.35, 1.35, 1.00],
  },
};

// ─── Seasonality factors ─────────────────────────────────────────────────────
// Monthly multiplier relative to annual average (1.0).
// Toronto: Huge patio lift Jun-Sep, harsh winter drop Jan-Feb.
// SF: Much flatter curve — mild climate year-round. Slight summer tourism
//     lift, slight Jan dip after holidays. No patio-season swing.

export const MONTHLY_SEASONALITY: Record<Market, number[]> = {
  toronto: [
    //  Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
      0.82, 0.80, 0.88, 0.95, 1.05, 1.15, 1.18, 1.16, 1.10, 1.02, 0.92, 0.97,
  ],
  san_francisco: [
    //  Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
      0.90, 0.92, 0.96, 1.00, 1.04, 1.08, 1.10, 1.08, 1.06, 1.02, 0.92, 0.92,
  ],
};

export function annualSeasonalityFactor(market: Market): number {
  const months = MONTHLY_SEASONALITY[market];
  const sum = months.reduce((a, b) => a + b, 0);
  return sum / 12;
}

// ─── Price level → average check lookup ──────────────────────────────────────
// Google Maps priceLevel (1-4) to estimated per-person food check.
// Values in local currency (CAD for Toronto, USD for SF).

export const PRICE_LEVEL_TO_CHECK: Record<Market, Record<number, number>> = {
  toronto: {
    1: 15,   // $ — fast food, budget
    2: 30,   // $$ — casual dining
    3: 55,   // $$$ — upscale casual
    4: 95,   // $$$$ — fine dining
  },
  san_francisco: {
    1: 18,   // $ — fast food, budget (higher base in SF)
    2: 38,   // $$ — casual dining
    3: 70,   // $$$ — upscale casual
    4: 130,  // $$$$ — fine dining (SF fine dining is significantly pricier)
  },
};

// ─── BestTime busyness → occupancy calibration ──────────────────────────────
// BestTime returns 0-100 "busyness" scores. These are NOT direct occupancy
// percentages — they're relative to the venue's own peak.
// 100 = the busiest the venue ever gets (which might be 90% occupied or 60%).
// We calibrate by venue type using observed patterns.
//
// calibratedOccupancy = busyScore/100 × peakOccupancyRate
//
// peakOccupancyRate = the actual occupancy when BestTime reports 100.

export const PEAK_OCCUPANCY_RATE: Record<VenueType, number> = {
  bar:            0.92,  // bars pack tight at peak
  casual_dining:  0.88,
  fast_casual:    0.85,
  fine_dining:    0.80,  // never truly "full" — maintain spacing
  cafe:           0.82,
  pub:            0.90,
};

export function calibrateBusyness(busyScore: number, venueType: VenueType): number {
  const peak = PEAK_OCCUPANCY_RATE[venueType];
  return Math.min(1.0, (busyScore / 100) * peak);
}

// ─── Confidence scoring weights ──────────────────────────────────────────────
// Each data input contributes to the overall confidence score.
// Real data from APIs = full weight. Industry defaults = 0.

export const CONFIDENCE_WEIGHTS: Record<string, number> = {
  seatCount:     20,  // most impactful single variable
  menuPricing:   25,  // check size drives everything
  footTraffic:   30,  // BestTime hourly data is the most valuable input
  dwellTime:     10,  // turn rate from BestTime
  operatingHours: 10, // from Google Maps
  seasonality:    5,  // always uses benchmark (no venue-specific seasonal data)
};

export function computeConfidenceScore(sources: Record<string, boolean>): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
} {
  let earned = 0;
  let total = 0;

  for (const [key, weight] of Object.entries(CONFIDENCE_WEIGHTS)) {
    total += weight;
    if (sources[key]) earned += weight;
  }

  const score = Math.round((earned / total) * 100);
  let grade: 'A' | 'B' | 'C' | 'D';
  if (score >= 75) grade = 'A';
  else if (score >= 50) grade = 'B';
  else if (score >= 25) grade = 'C';
  else grade = 'D';

  return { score, grade };
}

// ─── Dwell time → turns per hour conversion ─────────────────────────────────
// If BestTime gives us a venue-specific dwell time, convert it to turns/hr
// but cap it at reasonable bounds per daypart.

const TURNS_BOUNDS: Record<Daypart, { min: number; max: number }> = {
  breakfast:   { min: 0.8,  max: 3.0 },
  lunch:       { min: 0.5,  max: 3.0 },
  happy_hour:  { min: 0.3,  max: 2.0 },
  dinner:      { min: 0.25, max: 1.5 },
  late_night:  { min: 0.2,  max: 1.0 },
};

export function dwellTimeToTurns(dwellMinutes: number, daypart: Daypart): number {
  const raw = 60 / dwellMinutes;
  const bounds = TURNS_BOUNDS[daypart];
  return Math.max(bounds.min, Math.min(bounds.max, raw));
}

// ─── Menu price → check size estimation ─────────────────────────────────────
// Given an array of menu item prices, estimate the average per-person
// food check using category-weighted median.

export interface MenuPriceEstimate {
  avgFoodCheck: number;
  sampleSize: number;
  method: 'weighted_median' | 'simple_median';
}

export function estimateCheckFromMenu(
  prices: number[],
  itemsPerCover: number = 2.3,
): MenuPriceEstimate | null {
  const valid = prices.filter(p => p > 0 && p < 500);
  if (valid.length < 3) return null;

  valid.sort((a, b) => a - b);
  const median = valid[Math.floor(valid.length / 2)];
  const avgFoodCheck = median * itemsPerCover;

  return {
    avgFoodCheck: Math.round(avgFoodCheck * 100) / 100,
    sampleSize: valid.length,
    method: 'simple_median',
  };
}

// ─── Late-night premium ──────────────────────────────────────────────────────
// Empirical: late-night checks run 25-35% higher than dinner on average
// because of higher beverage attachment and group sizes.
// Source: NRA 2024 nightlife segment data. Applies to both markets.

export const LATE_NIGHT_CHECK_PREMIUM = 1.31;
export const LATE_NIGHT_BEV_PREMIUM = 1.45;

// ─── Ramp-up curve for new venues ────────────────────────────────────────────
// A newly opened venue doesn't hit steady-state revenue immediately.
// This curve represents the % of steady-state revenue by month after opening.
// Source: Industry consensus (multiple operator interviews, BDO benchmarks).

export const RAMP_UP_CURVE: number[] = [
  // Month 1-12 as % of steady state
  0.35, 0.50, 0.60, 0.70, 0.78, 0.85,
  0.90, 0.93, 0.95, 0.97, 0.98, 1.00,
];

export function rampUpMultiplier(monthsSinceOpening: number): number {
  if (monthsSinceOpening >= RAMP_UP_CURVE.length) return 1.0;
  if (monthsSinceOpening < 0) return 0;
  return RAMP_UP_CURVE[Math.floor(monthsSinceOpening)];
}
