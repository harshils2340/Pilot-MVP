/**
 * SerpAPI service layer for restaurant competitive intelligence.
 *
 * Supplements Google Maps Legacy API with:
 *   - Deep reviews (20+ per page, vs. 5 from Places API)
 *   - Review topics with mention counts (ready-made for theme analysis)
 *   - Richer place details
 *
 * Docs: https://serpapi.com/google-maps-reviews-api
 */

import type { IReview } from '../biSnapshot/schema';

const API_KEY = process.env.SERPAPI_API_KEY ?? '';
const BASE_URL = 'https://serpapi.com/search.json';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SerpApiReview {
  snippet?: string;
  rating?: number;
  date?: string;
  iso_date?: string;
  user?: {
    name?: string;
    local_guide?: boolean;
    reviews?: number;
  };
  details?: Record<string, unknown>;
  likes?: number;
}

interface SerpApiTopic {
  keyword: string;
  mentions: number;
  id?: string;
}

interface SerpApiPlaceInfo {
  title?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  type?: string;
}

export interface SerpReviewsResult {
  placeInfo: SerpApiPlaceInfo;
  reviews: IReview[];
  topics: SerpApiTopic[];
  totalReviewCount: number;
  nextPageToken?: string;
}

export interface SerpLocalResult {
  position: number;
  title: string;
  placeId?: string;
  dataId?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  type?: string;
  priceLevel?: string;
  hours?: string;
  gpsCoordinates?: { latitude: number; longitude: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAvailable(): boolean {
  return API_KEY.length > 10;
}

async function serpFetch<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('output', 'json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SerpAPI ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function mapSerpReview(r: SerpApiReview): IReview | null {
  if (!r.snippet || r.snippet.length < 10) return null;

  return {
    text: r.snippet,
    rating: r.rating ?? 3,
    authorName: r.user?.name ?? 'Anonymous',
    relativeTime: r.date ?? '',
    publishedAt: r.iso_date ? new Date(r.iso_date) : undefined,
    language: 'en',
    source: 'serpapi',
  };
}

function parsePriceLevelString(price?: string): number | null {
  if (!price) return null;
  const count = (price.match(/\$/g) || []).length;
  return count > 0 ? count : null;
}

// ─── Google Maps Reviews ─────────────────────────────────────────────────────

interface SerpReviewsResponse {
  place_info?: SerpApiPlaceInfo;
  reviews?: SerpApiReview[];
  topics?: SerpApiTopic[];
  serpapi_pagination?: { next_page_token?: string };
}

export async function getPlaceReviews(
  placeId: string,
  options: { sort?: 'qualityScore' | 'newestFirst' | 'ratingHigh' | 'ratingLow'; pages?: number } = {},
): Promise<SerpReviewsResult> {
  if (!isAvailable()) {
    return { placeInfo: {}, reviews: [], topics: [], totalReviewCount: 0 };
  }

  const { sort = 'qualityScore', pages = 2 } = options;
  const allReviews: IReview[] = [];
  let topics: SerpApiTopic[] = [];
  let placeInfo: SerpApiPlaceInfo = {};
  let nextPageToken: string | undefined;

  for (let page = 0; page < pages; page++) {
    const params: Record<string, string> = {
      engine: 'google_maps_reviews',
      place_id: placeId,
      hl: 'en',
      sort_by: sort,
    };
    if (nextPageToken) {
      params.next_page_token = nextPageToken;
    }

    try {
      const data = await serpFetch<SerpReviewsResponse>(params);

      if (page === 0) {
        placeInfo = data.place_info ?? {};
        topics = data.topics ?? [];
      }

      for (const r of data.reviews ?? []) {
        const mapped = mapSerpReview(r);
        if (mapped) allReviews.push(mapped);
      }

      nextPageToken = data.serpapi_pagination?.next_page_token;
      if (!nextPageToken) break;
    } catch (err) {
      console.error(`[SerpAPI] Reviews page ${page} failed for ${placeId}:`, err);
      break;
    }
  }

  return {
    placeInfo,
    reviews: allReviews,
    topics,
    totalReviewCount: placeInfo.reviews ?? allReviews.length,
    nextPageToken,
  };
}

// ─── Google Maps Local Search ────────────────────────────────────────────────

interface SerpLocalResponse {
  local_results?: Array<{
    position?: number;
    title?: string;
    place_id?: string;
    data_id?: string;
    rating?: number;
    reviews?: number;
    address?: string;
    type?: string;
    price?: string;
    hours?: string;
    gps_coordinates?: { latitude: number; longitude: number };
  }>;
}

export async function searchLocalRestaurants(
  query: string,
  lat: number,
  lng: number,
  zoom: number = 14,
): Promise<SerpLocalResult[]> {
  if (!isAvailable()) return [];

  try {
    const data = await serpFetch<SerpLocalResponse>({
      engine: 'google_maps',
      q: query,
      ll: `@${lat},${lng},${zoom}z`,
      type: 'search',
    });

    return (data.local_results ?? []).map(r => ({
      position: r.position ?? 0,
      title: r.title ?? '',
      placeId: r.place_id,
      dataId: r.data_id,
      rating: r.rating,
      reviews: r.reviews,
      address: r.address,
      type: r.type,
      priceLevel: r.price,
      hours: r.hours,
      gpsCoordinates: r.gps_coordinates,
    }));
  } catch (err) {
    console.error('[SerpAPI] Local search failed:', err);
    return [];
  }
}

// ─── Batch enrichment ────────────────────────────────────────────────────────

export interface ReviewEnrichment {
  placeId: string;
  reviews: IReview[];
  topics: SerpApiTopic[];
  totalReviewCount: number;
}

/**
 * Enrich a batch of competitors with deep reviews from SerpAPI.
 * Processes sequentially with a small delay to respect rate limits.
 */
export async function enrichReviewsBatch(
  placeIds: string[],
  maxConcurrent: number = 3,
): Promise<Map<string, ReviewEnrichment>> {
  if (!isAvailable()) return new Map();

  const results = new Map<string, ReviewEnrichment>();

  // Process in batches to avoid rate limits
  for (let i = 0; i < placeIds.length; i += maxConcurrent) {
    const batch = placeIds.slice(i, i + maxConcurrent);
    const promises = batch.map(async (placeId) => {
      try {
        const result = await getPlaceReviews(placeId, { pages: 2 });
        results.set(placeId, {
          placeId,
          reviews: result.reviews,
          topics: result.topics,
          totalReviewCount: result.totalReviewCount,
        });
      } catch (err) {
        console.error(`[SerpAPI] Enrichment failed for ${placeId}:`, err);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to respect rate limits
    if (i + maxConcurrent < placeIds.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

export { isAvailable as isSerpApiAvailable, parsePriceLevelString };
