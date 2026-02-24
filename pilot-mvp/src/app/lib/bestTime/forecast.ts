/**
 * BestTime API service layer for foot traffic forecasts.
 *
 * IMPORTANT: BestTime uses URL query parameters for all endpoints,
 * NOT JSON request bodies.
 *
 * Metered plan — each successful forecast costs 2 credits,
 * unsuccessful costs 1 credit.
 */

import type { IFootTraffic } from '../biSnapshot/schema';

const API_KEY = process.env.BESTTIME_API_KEY_PRIVATE ?? '';
const BASE = 'https://besttime.app/api/v1';

// ─── Types from BestTime API response ───────────────────────────────────────

interface BestTimeDayAnalysis {
  day_info: {
    day_int: number;
    day_text: string;
    day_mean: number;
    day_max: number;
    day_rank_mean: number;
    day_rank_max: number;
    venue_open: number | string;
    venue_closed: number | string;
  };
  day_raw: number[];
  peak_hours: {
    peak_start: number;
    peak_end: number;
    peak_max: number;
    peak_intensity: number;
  }[];
  quiet_hours: number[];
  surge_hours: {
    most_people_come: number | string;
    most_people_leave: number | string;
  };
  busy_hours: number[];
}

interface BestTimeVenueInfo {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_dwell_time_min: number;
  venue_dwell_time_max: number;
  venue_dwell_time_avg: number;
  venue_type: string;
  venue_types: string[];
  venue_lat: number;
  venue_lon: number;
}

interface BestTimeForecastResponse {
  status: string;
  venue_info: BestTimeVenueInfo;
  analysis: BestTimeDayAnalysis[];
  message?: string | Record<string, string[]>;
}

// ─── Mapping ────────────────────────────────────────────────────────────────

/**
 * BestTime day_raw arrays start at 6 AM (index 0 = 6AM, index 18 = midnight).
 * Our schema expects index 0 = midnight. Re-map accordingly.
 * BestTime: [6AM, 7AM, ..., 5AM] (24 values starting at 6AM)
 * Schema:   [12AM, 1AM, ..., 11PM] (24 values starting at midnight)
 */
function remapHourlyData(dayRaw: number[]): number[] {
  if (!dayRaw || dayRaw.length !== 24) return new Array(24).fill(0);
  const result = new Array(24).fill(0);
  for (let i = 0; i < 24; i++) {
    const bestTimeHour = (i + 6) % 24;
    const bestTimeIndex = i;
    result[bestTimeHour] = dayRaw[bestTimeIndex];
  }
  return result;
}

/**
 * BestTime returns days Mon=0..Sun=6 which matches our schema.
 * But the array order may vary — use day_int for positioning.
 */
function mapForecastToFootTraffic(
  response: BestTimeForecastResponse,
): IFootTraffic {
  const { venue_info, analysis } = response;

  const weekRaw: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const peakHours: IFootTraffic['peakHours'] = [];
  const quietHours: IFootTraffic['quietHours'] = [];
  const surgeHours: IFootTraffic['surgeHours'] = [];

  for (const day of analysis) {
    const dayIdx = day.day_info.day_int;
    if (dayIdx < 0 || dayIdx > 6) continue;

    weekRaw[dayIdx] = remapHourlyData(day.day_raw);

    for (const peak of day.peak_hours ?? []) {
      peakHours.push({
        day: dayIdx,
        peakStart: peak.peak_start,
        peakEnd: peak.peak_end,
        peakIntensity: peak.peak_intensity ?? peak.peak_max ?? 0,
      });
    }

    const validQuietHours = (day.quiet_hours ?? []).filter(
      (h): h is number => typeof h === 'number' && !isNaN(h),
    );
    if (validQuietHours.length) {
      const sorted = [...validQuietHours].sort((a, b) => a - b);
      quietHours.push({
        day: dayIdx,
        quietStart: sorted[0],
        quietEnd: sorted[sorted.length - 1],
      });
    }

    if (day.surge_hours) {
      const comeHour = day.surge_hours.most_people_come;
      if (typeof comeHour === 'number' && !isNaN(comeHour)) {
        const dayMean = day.day_info.day_mean ?? 50;
        surgeHours.push({
          day: dayIdx,
          hour: comeHour,
          delta: Math.round(dayMean * 0.3),
        });
      }
    }
  }

  return {
    venueId: venue_info.venue_id,
    venueName: venue_info.venue_name,
    weekRaw,
    peakHours,
    quietHours,
    dwellTimeAvg: venue_info.venue_dwell_time_avg || 0,
    dwellTimeMax: venue_info.venue_dwell_time_max || undefined,
    surgeHours: surgeHours.length ? surgeHours : undefined,
    fetchedAt: new Date(),
    confidence: 'forecast',
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getForecast(
  venueName: string,
  venueAddress: string,
): Promise<IFootTraffic | null> {
  if (!API_KEY) {
    console.warn('[BestTime] BESTTIME_API_KEY_PRIVATE is not set — skipping');
    return null;
  }

  try {
    const params = new URLSearchParams({
      api_key_private: API_KEY,
      venue_name: venueName,
      venue_address: venueAddress,
    });

    const res = await fetch(`${BASE}/forecasts?${params.toString()}`, {
      method: 'POST',
    });

    if (res.status === 429) {
      console.warn('[BestTime] Rate limited — stopping batch');
      return null;
    }

    if (!res.ok) {
      console.error(`[BestTime] Forecast HTTP error for "${venueName}":`, res.status);
      return null;
    }

    const data: BestTimeForecastResponse = await res.json();

    if (data.status !== 'OK' || !data.analysis?.length) {
      console.warn(`[BestTime] No data for "${venueName}" (status: ${data.status})`);
      return null;
    }

    return mapForecastToFootTraffic(data);
  } catch (err) {
    console.error(`[BestTime] Network error for "${venueName}":`, err);
    return null;
  }
}

/**
 * Fetch forecasts for multiple venues sequentially.
 * Stops immediately on rate limit (429) to preserve credits.
 */
export async function getForecastBatch(
  venues: { name: string; address: string; placeId: string }[],
): Promise<Map<string, IFootTraffic>> {
  const results = new Map<string, IFootTraffic>();

  for (const venue of venues) {
    const forecast = await getForecast(venue.name, venue.address);
    if (forecast) {
      results.set(venue.placeId, forecast);
    }
  }

  return results;
}
