/**
 * Production RevPASH (Revenue Per Available Seat-Hour) engine.
 *
 * Computes venue-level revenue estimates using a daypart × day-of-week matrix.
 * Each cell in the matrix has its own check size, occupancy, turn rate, and
 * seat utilization — all sourced from real data when available or calibrated
 * industry benchmarks when not.
 *
 * Multi-market: Supports Toronto (CAD) and San Francisco (USD) with
 * market-specific benchmarks for check sizes, seasonality, and day patterns.
 *
 * Based on: Cornell CHR RevPASH methodology (Kimes & Thompson) with
 * BestTime foot-traffic integration.
 */

import type {
  ICompetitor,
  IFootTraffic,
  IRevenueEstimate,
  IDaypartRevenue,
  IWeekdayBreakdown,
  ISourcedValue,
  IMenuItem,
  IOperatingHours,
  DataSourceTag,
} from '../biSnapshot/schema';

import {
  type Market,
  type VenueType,
  type Daypart,
  type DayName,
  DAY_NAMES,
  DAYPART_WINDOWS,
  AVG_FOOD_CHECK,
  AVG_BEV_CHECK,
  TURNS_PER_HOUR,
  AVG_PARTY_SIZE,
  SEAT_UTILIZATION,
  DAY_MULTIPLIERS,
  MONTHLY_SEASONALITY,
  PEAK_OCCUPANCY_RATE,
  BEVERAGE_REVENUE_RATIO,
  DEFAULT_SEAT_COUNT,
  PRICE_LEVEL_TO_CHECK,
  MARKETS,
  inferMarket,
  calibrateBusyness,
  computeConfidenceScore,
  dwellTimeToTurns,
  estimateCheckFromMenu,
  inferVenueType,
} from './benchmarks';

// ─── Input assembly ──────────────────────────────────────────────────────────
// Collects all raw data from a competitor and resolves each input with
// source tagging. Real data always wins over defaults.

interface ResolvedInputs {
  market: Market;
  currency: 'CAD' | 'USD';
  seatCount: ISourcedValue;
  venueType: VenueType;
  cuisineType: string;
  operatingHoursPerDay: Record<DayName, { start: number; end: number } | null>;
  operatingDays: number;
  foodCheckByDaypart: Record<Daypart, ISourcedValue>;
  bevCheckByDaypart: Record<Daypart, ISourcedValue>;
  turnsPerHourByDaypart: Record<Daypart, ISourcedValue>;
  occupancyByDayAndHour: number[][] | null;
  seatUtilization: ISourcedValue;
  partySize: Record<Daypart, ISourcedValue>;
  beverageRevenueRatio: ISourcedValue;
  seasonalityFactor: ISourcedValue;
  confidenceSources: Record<string, boolean>;
}

function sv(value: number, source: DataSourceTag): ISourcedValue {
  return { value, source };
}

function resolveOperatingHours(
  hours: IOperatingHours | undefined,
): Record<DayName, { start: number; end: number } | null> {
  const result: Record<string, { start: number; end: number } | null> = {};

  for (const day of DAY_NAMES) {
    const ranges = hours?.[day];
    if (!ranges || ranges.length === 0) {
      result[day] = null;
      continue;
    }
    const first = ranges[0];
    const last = ranges[ranges.length - 1];
    const start = parseInt(first.open.split(':')[0], 10);
    let end = parseInt(last.close.split(':')[0], 10);
    if (end <= start) end += 24;
    result[day] = { start, end };
  }

  return result as Record<DayName, { start: number; end: number } | null>;
}

function resolveFoodCheck(
  menuItems: IMenuItem[],
  venueType: VenueType,
  priceLevel: number | null,
  market: Market,
): Record<Daypart, ISourcedValue> {
  const result: Record<string, ISourcedValue> = {};
  const menuEstimate = estimateCheckFromMenu(
    menuItems.filter(m => m.price != null).map(m => m.price!),
  );
  const marketChecks = AVG_FOOD_CHECK[market][venueType];
  const marketPriceLevels = PRICE_LEVEL_TO_CHECK[market];

  for (const dp of DAYPART_WINDOWS) {
    const benchmarkCheck = marketChecks[dp.daypart];

    if (menuEstimate && menuEstimate.sampleSize >= 5) {
      const ratio = benchmarkCheck / (marketChecks.dinner || 1);
      result[dp.daypart] = sv(
        Math.round(menuEstimate.avgFoodCheck * ratio * 100) / 100,
        'menu_median',
      );
    } else if (priceLevel && marketPriceLevels[priceLevel]) {
      const baseCheck = marketPriceLevels[priceLevel];
      const ratio = benchmarkCheck / (marketChecks.dinner || 1);
      result[dp.daypart] = sv(Math.round(baseCheck * ratio * 100) / 100, 'price_level_lookup');
    } else {
      result[dp.daypart] = sv(benchmarkCheck, 'industry_avg');
    }
  }

  return result as Record<Daypart, ISourcedValue>;
}

function resolveTurnsPerHour(
  footTraffic: IFootTraffic | undefined,
  venueType: VenueType,
): Record<Daypart, ISourcedValue> {
  const result: Record<string, ISourcedValue> = {};
  const hasDwell = footTraffic && footTraffic.dwellTimeAvg > 0;

  for (const dp of DAYPART_WINDOWS) {
    if (hasDwell) {
      result[dp.daypart] = sv(
        dwellTimeToTurns(footTraffic!.dwellTimeAvg, dp.daypart),
        'besttime_dwell',
      );
    } else {
      result[dp.daypart] = sv(TURNS_PER_HOUR[venueType][dp.daypart], 'industry_avg');
    }
  }

  return result as Record<Daypart, ISourcedValue>;
}

function resolveInputs(
  competitor: ICompetitor,
  market: Market,
  seatCountOverride?: number,
): ResolvedInputs {
  const venueType = inferVenueType(
    competitor.types,
    competitor.primaryType ?? undefined,
    competitor.priceLevel,
  );

  const marketInfo = MARKETS[market];

  const seatCount: ISourcedValue = seatCountOverride
    ? sv(seatCountOverride, 'consultant_input')
    : sv(DEFAULT_SEAT_COUNT[market][venueType], 'industry_avg');

  const operatingHoursPerDay = resolveOperatingHours(competitor.hours);
  const operatingDays = DAY_NAMES.filter(d => operatingHoursPerDay[d] !== null).length;

  const foodCheckByDaypart = resolveFoodCheck(
    competitor.menuItems,
    venueType,
    competitor.priceLevel,
    market,
  );

  const bevCheckByDaypart: Record<string, ISourcedValue> = {};
  for (const dp of DAYPART_WINDOWS) {
    bevCheckByDaypart[dp.daypart] = sv(AVG_BEV_CHECK[market][venueType][dp.daypart], 'industry_avg');
  }

  const turnsPerHourByDaypart = resolveTurnsPerHour(competitor.footTraffic ?? undefined, venueType);

  const occupancyByDayAndHour = competitor.footTraffic?.weekRaw ?? null;

  const seatUtilization: ISourcedValue = sv(SEAT_UTILIZATION[venueType], 'industry_avg');

  const partySize: Record<string, ISourcedValue> = {};
  for (const dp of DAYPART_WINDOWS) {
    partySize[dp.daypart] = sv(AVG_PARTY_SIZE[dp.daypart], 'industry_avg');
  }

  const beverageRevenueRatio: ISourcedValue = sv(
    BEVERAGE_REVENUE_RATIO[venueType],
    'industry_avg',
  );

  const marketSeasonality = MONTHLY_SEASONALITY[market];
  const seasonMean = marketSeasonality.reduce((a, b) => a + b, 0) / 12;
  const seasonalityFactor: ISourcedValue = sv(seasonMean, 'industry_avg');

  const hasMenu = competitor.menuItems.filter(m => m.price != null).length >= 5;
  const hasTraffic = occupancyByDayAndHour !== null;
  const hasDwell = (competitor.footTraffic?.dwellTimeAvg ?? 0) > 0;
  const hasHours = operatingDays >= 3;

  const confidenceSources: Record<string, boolean> = {
    seatCount:      seatCountOverride != null,
    menuPricing:    hasMenu,
    footTraffic:    hasTraffic,
    dwellTime:      hasDwell,
    operatingHours: hasHours,
    seasonality:    false,
  };

  return {
    market,
    currency: marketInfo.currency,
    seatCount,
    venueType,
    cuisineType: competitor.primaryType ?? competitor.types[0] ?? 'restaurant',
    operatingHoursPerDay,
    operatingDays: Math.max(operatingDays, 5),
    foodCheckByDaypart: foodCheckByDaypart as Record<Daypart, ISourcedValue>,
    bevCheckByDaypart: bevCheckByDaypart as Record<Daypart, ISourcedValue>,
    turnsPerHourByDaypart: turnsPerHourByDaypart as Record<Daypart, ISourcedValue>,
    occupancyByDayAndHour,
    seatUtilization,
    partySize: partySize as Record<Daypart, ISourcedValue>,
    beverageRevenueRatio,
    seasonalityFactor,
    confidenceSources,
  };
}

// ─── Daypart occupancy computation ───────────────────────────────────────────
// Converts BestTime hourly busyness data into a single occupancy rate for
// a daypart on a specific day.

function getOccupancyForDaypart(
  weekRaw: number[][] | null,
  dayIndex: number,
  dpStart: number,
  dpEnd: number,
  venueType: VenueType,
): ISourcedValue {
  if (!weekRaw || !weekRaw[dayIndex]) {
    const defaultOcc = PEAK_OCCUPANCY_RATE[venueType] * 0.55;
    return sv(Math.round(defaultOcc * 100) / 100, 'industry_avg');
  }

  const dayData = weekRaw[dayIndex];
  let sum = 0;
  let count = 0;

  for (let h = dpStart; h < dpEnd; h++) {
    const hour = h % 24;
    if (hour < dayData.length) {
      sum += calibrateBusyness(dayData[hour], venueType);
      count++;
    }
  }

  if (count === 0) {
    return sv(PEAK_OCCUPANCY_RATE[venueType] * 0.55, 'industry_avg');
  }

  return sv(Math.round((sum / count) * 100) / 100, 'besttime_traffic');
}

// ─── Day-of-week traffic multiplier ──────────────────────────────────────────
// Derives the multiplier from BestTime data if available, otherwise falls
// back to benchmark values.

function getDayMultiplier(
  weekRaw: number[][] | null,
  dayIndex: number,
  venueType: VenueType,
  market: Market,
): ISourcedValue {
  if (!weekRaw) {
    return sv(DAY_MULTIPLIERS[market][venueType][dayIndex], 'industry_avg');
  }

  let dayTotal = 0;
  let weekTotal = 0;

  for (let d = 0; d < 7; d++) {
    const dayData = weekRaw[d];
    if (!dayData) continue;
    const daySum = dayData.reduce((a, b) => a + b, 0);
    weekTotal += daySum;
    if (d === dayIndex) dayTotal = daySum;
  }

  if (weekTotal === 0) {
    return sv(DAY_MULTIPLIERS[market][venueType][dayIndex], 'industry_avg');
  }

  const dailyAvg = weekTotal / 7;
  const multiplier = dailyAvg > 0 ? dayTotal / dailyAvg : 1.0;
  return sv(Math.round(multiplier * 100) / 100, 'besttime_traffic');
}

// ─── Core RevPASH computation ────────────────────────────────────────────────
// The main formula per daypart per day:
//
//   daypartRevenue = seats
//     × seatUtilization
//     × avgOccupancy
//     × hours_in_daypart
//     × turnsPerHour
//     × (avgFoodCheck + avgBevCheck)
//     × dayMultiplier
//
// This is applied across all 7 days × all active dayparts to produce
// a weekly total. Annual = weekly × 52 × seasonalityFactor.

function computeDaypartRevenue(
  inputs: ResolvedInputs,
  dayIndex: number,
  dpWindow: (typeof DAYPART_WINDOWS)[number],
  dayHours: { start: number; end: number } | null,
): IDaypartRevenue | null {
  if (!dayHours) return null;

  const dpStart = Math.max(dpWindow.start, dayHours.start);
  const dpEnd = Math.min(dpWindow.end, dayHours.end);
  const hoursInDaypart = dpEnd - dpStart;

  if (hoursInDaypart <= 0) return null;

  const dp = dpWindow.daypart;
  const foodCheck = inputs.foodCheckByDaypart[dp];
  const bevCheck = inputs.bevCheckByDaypart[dp];
  const turns = inputs.turnsPerHourByDaypart[dp];
  const occupancy = getOccupancyForDaypart(
    inputs.occupancyByDayAndHour,
    dayIndex,
    dpStart,
    dpEnd,
    inputs.venueType,
  );

  if (foodCheck.value === 0 && bevCheck.value === 0) return null;
  if (turns.value === 0) return null;

  const totalCheckPerPerson = foodCheck.value + bevCheck.value;

  const dailyRevenue =
    inputs.seatCount.value
    * inputs.seatUtilization.value
    * occupancy.value
    * hoursInDaypart
    * turns.value
    * totalCheckPerPerson;

  return {
    daypart: dp,
    hoursStart: dpStart,
    hoursEnd: dpEnd,
    avgFoodCheck: foodCheck,
    avgBevCheck: bevCheck,
    avgPartySize: inputs.partySize[dp],
    turnsPerHour: turns,
    avgOccupancyRate: occupancy,
    seatUtilization: inputs.seatUtilization,
    dailyRevenue: Math.round(dailyRevenue * 100) / 100,
  };
}

function computeWeeklyBreakdown(inputs: ResolvedInputs): IWeekdayBreakdown[] {
  const breakdown: IWeekdayBreakdown[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayName = DAY_NAMES[dayIndex];
    const dayHours = inputs.operatingHoursPerDay[dayName];
    const dayMultiplier = getDayMultiplier(
      inputs.occupancyByDayAndHour,
      dayIndex,
      inputs.venueType,
      inputs.market,
    );

    const dayparts: IDaypartRevenue[] = [];

    for (const dpWindow of DAYPART_WINDOWS) {
      const dpResult = computeDaypartRevenue(inputs, dayIndex, dpWindow, dayHours);
      if (dpResult) {
        dayparts.push(dpResult);
      }
    }

    const baseDayRevenue = dayparts.reduce((sum, dp) => sum + dp.dailyRevenue, 0);

    // Day multiplier is already baked into BestTime occupancy data when
    // BestTime is available. Only apply the multiplier when using defaults.
    const hasTrafficData = inputs.occupancyByDayAndHour !== null;
    const adjustedRevenue = hasTrafficData
      ? baseDayRevenue
      : baseDayRevenue * dayMultiplier.value;

    breakdown.push({
      day: dayName,
      dayIndex,
      trafficMultiplier: dayMultiplier,
      revenue: Math.round(adjustedRevenue * 100) / 100,
      dayparts,
    });
  }

  return breakdown;
}

// ─── Scenario projections ────────────────────────────────────────────────────

interface Projection {
  scenario: string;
  label: string;
  incrementalWeekly: number;
  incrementalAnnual: number;
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
}

function buildProjections(
  inputs: ResolvedInputs,
  weeklyBreakdown: IWeekdayBreakdown[],
): Projection[] {
  const projections: Projection[] = [];

  const hasLateNight = weeklyBreakdown.some(d =>
    d.dayparts.some(dp => dp.daypart === 'late_night'),
  );

  const marketInfo = MARKETS[inputs.market];
  const currencySymbol = inputs.currency === 'USD' ? 'US$' : 'CA$';

  if (!hasLateNight) {
    const seats = inputs.seatCount.value;
    const foodCheck = inputs.foodCheckByDaypart.dinner.value * 0.65;
    const bevCheck = inputs.bevCheckByDaypart.late_night.value;
    const occ = PEAK_OCCUPANCY_RATE[inputs.venueType] * 0.45;
    const turns = TURNS_PER_HOUR[inputs.venueType].late_night || 0.5;
    const util = inputs.seatUtilization.value;
    const hours = 3;

    const perNightRevenue = seats * util * occ * hours * turns * (foodCheck + bevCheck);
    const nightsPerWeek = 2;
    const weeklyIncrement = perNightRevenue * nightsPerWeek;
    const annualIncrement = weeklyIncrement * 52 * inputs.seasonalityFactor.value;

    projections.push({
      scenario: 'add_late_night',
      label: 'Add late-night kitchen (Fri-Sat, 11PM-2AM)',
      incrementalWeekly: Math.round(weeklyIncrement),
      incrementalAnnual: Math.round(annualIncrement),
      assumptions: [
        `${seats} seats at ${Math.round(occ * 100)}% occupancy`,
        `${currencySymbol}${Math.round(foodCheck + bevCheck)} avg check (food + bev)`,
        `${nightsPerWeek} nights/week (Fri-Sat)`,
        '3-hour service window (11PM-2AM)',
        `Based on ${marketInfo.name} corridor late-night traffic patterns`,
      ],
      confidence: inputs.occupancyByDayAndHour ? 'medium' : 'low',
    });
  }

  const hasBrunch = weeklyBreakdown.some(d =>
    d.dayparts.some(dp => dp.daypart === 'breakfast'),
  );

  if (!hasBrunch && inputs.venueType !== 'bar') {
    const seats = inputs.seatCount.value;
    const foodCheck = AVG_FOOD_CHECK[inputs.market][inputs.venueType].breakfast;
    const bevCheck = AVG_BEV_CHECK[inputs.market][inputs.venueType].breakfast;
    const occ = PEAK_OCCUPANCY_RATE[inputs.venueType] * 0.50;
    const turns = TURNS_PER_HOUR[inputs.venueType].breakfast;
    const util = inputs.seatUtilization.value;
    const hours = 4;

    if (foodCheck > 0 && turns > 0) {
      const perDayRevenue = seats * util * occ * hours * turns * (foodCheck + bevCheck);
      const daysPerWeek = 2;
      const weeklyIncrement = perDayRevenue * daysPerWeek;
      const annualIncrement = weeklyIncrement * 52 * inputs.seasonalityFactor.value;

      const brunchDemandNote = inputs.market === 'san_francisco'
        ? 'SF brunch culture drives strong weekend demand'
        : 'Toronto brunch demand is strong on weekends';

      projections.push({
        scenario: 'add_brunch',
        label: 'Add weekend brunch service (Sat-Sun, 8AM-12PM)',
        incrementalWeekly: Math.round(weeklyIncrement),
        incrementalAnnual: Math.round(annualIncrement),
        assumptions: [
          `${seats} seats at ${Math.round(occ * 100)}% occupancy`,
          `${currencySymbol}${Math.round(foodCheck + bevCheck)} avg check`,
          `${daysPerWeek} days/week (Sat-Sun)`,
          '4-hour service window (8AM-12PM)',
          brunchDemandNote,
        ],
        confidence: 'low',
      });
    }
  }

  const dinnerCheck = inputs.foodCheckByDaypart.dinner;
  if (dinnerCheck.source === 'menu_median') {
    const currentTotal = weeklyBreakdown.reduce((s, d) => s + d.revenue, 0);
    const priceIncrease = 0.08;
    const volumeElasticity = -0.03;
    const netEffect = priceIncrease + volumeElasticity;
    const weeklyIncrement = currentTotal * netEffect;
    const annualIncrement = weeklyIncrement * 52 * inputs.seasonalityFactor.value;

    projections.push({
      scenario: 'raise_prices_8pct',
      label: 'Raise menu prices 8% across the board',
      incrementalWeekly: Math.round(weeklyIncrement),
      incrementalAnnual: Math.round(annualIncrement),
      assumptions: [
        '8% average price increase',
        '~3% volume decline from price elasticity (NRA benchmark: -0.3 to -0.5 elasticity for casual dining)',
        'Net +5% revenue uplift',
        'Assumes corridor pricing supports the increase',
      ],
      confidence: 'medium',
    });
  }

  return projections;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface EstimateRevenueOptions {
  market?: Market;
  seatCountOverride?: number;
}

export function estimateRevenue(
  competitor: ICompetitor,
  options: EstimateRevenueOptions = {},
): IRevenueEstimate {
  const market = options.market ?? inferMarket(competitor.address);
  const inputs = resolveInputs(competitor, market, options.seatCountOverride);
  const weeklyBreakdown = computeWeeklyBreakdown(inputs);

  const weeklyRevenue = weeklyBreakdown.reduce((sum, d) => sum + d.revenue, 0);
  const annualRevenue = weeklyRevenue * 52;
  const annualRevenueSeasonAdjusted = Math.round(
    annualRevenue * inputs.seasonalityFactor.value,
  );

  const { score, grade } = computeConfidenceScore(inputs.confidenceSources);
  const projections = buildProjections(inputs, weeklyBreakdown);

  return {
    weeklyRevenue: Math.round(weeklyRevenue),
    annualRevenue: Math.round(annualRevenue),
    annualRevenueSeasonAdjusted,
    method: 'revpash_daypart',
    confidenceScore: score,
    confidenceGrade: grade,
    inputs: {
      seatCount: inputs.seatCount,
      cuisineType: inputs.cuisineType,
      venueType: inputs.venueType,
      operatingDays: inputs.operatingDays,
      seasonalityFactor: inputs.seasonalityFactor,
      beverageRevenueRatio: inputs.beverageRevenueRatio,
    },
    weeklyBreakdown,
    projections,
    calculatedAt: new Date(),
  };
}

/**
 * Batch-estimate revenue for all competitors in a snapshot.
 * Market is inferred from address or can be explicitly set.
 */
export function estimateCorridorRevenue(
  competitors: ICompetitor[],
  market?: Market,
): {
  estimates: (IRevenueEstimate | null)[];
  corridorMedianAnnual: number | null;
  corridorTotalAnnual: number | null;
} {
  const estimates: (IRevenueEstimate | null)[] = [];

  for (const comp of competitors) {
    try {
      estimates.push(estimateRevenue(comp, { market }));
    } catch (err) {
      console.error(`Revenue estimation failed for "${comp.name}":`, err);
      estimates.push(null);
    }
  }

  const valid = estimates
    .filter((e): e is IRevenueEstimate => e !== null)
    .map(e => e.annualRevenueSeasonAdjusted)
    .sort((a, b) => a - b);

  const corridorMedianAnnual = valid.length > 0
    ? valid[Math.floor(valid.length / 2)]
    : null;

  const corridorTotalAnnual = valid.length > 0
    ? valid.reduce((a, b) => a + b, 0)
    : null;

  return { estimates, corridorMedianAnnual, corridorTotalAnnual };
}
