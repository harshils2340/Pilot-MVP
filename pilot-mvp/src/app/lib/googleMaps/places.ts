/**
 * Google Maps Places API service layer.
 *
 * Uses the LEGACY Places API endpoints (not Places API New)
 * since the project has Places API enabled, not Places API (New).
 */

import type {
  ICompetitor,
  IReview,
  IOperatingHours,
  IHourRange,
} from '../biSnapshot/schema';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';
const LEGACY_BASE = 'https://maps.googleapis.com/maps/api/place';

// ─── Geocoding (via legacy Find Place) ──────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string;
  province: string;
  country: string;
  neighborhood?: string;
}

function parseCityFromAddress(formatted: string): { city: string; province: string; country: string } {
  const parts = formatted.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return {
      city: parts[1] || parts[0],
      province: parts[2]?.replace(/\s+\w{3}\s+\w{3}$/, '').trim() || '',
      country: parts[parts.length - 1],
    };
  }
  return { city: parts[0] ?? '', province: '', country: parts[parts.length - 1] ?? '' };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!API_KEY) {
    console.error('[GoogleMaps] GOOGLE_MAPS_API_KEY is not set');
    return null;
  }

  try {
    const params = new URLSearchParams({
      input: address,
      inputtype: 'textquery',
      fields: 'formatted_address,geometry,name',
      key: API_KEY,
    });

    const res = await fetch(`${LEGACY_BASE}/findplacefromtext/json?${params}`);
    if (!res.ok) {
      console.error('[GoogleMaps] Geocode HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 'OK' || !data.candidates?.length) {
      console.error('[GoogleMaps] Geocode status:', data.status, data.error_message);
      return null;
    }

    const result = data.candidates[0];
    const loc = result.geometry?.location;
    if (!loc) return null;

    const parsed = parseCityFromAddress(result.formatted_address ?? address);

    return {
      lat: loc.lat,
      lng: loc.lng,
      formattedAddress: result.formatted_address ?? address,
      city: parsed.city,
      province: parsed.province,
      country: parsed.country,
    };
  } catch (err) {
    console.error('[GoogleMaps] Geocode network error:', err);
    return null;
  }
}

// ─── Nearby Search (legacy) ─────────────────────────────────────────────────

interface LegacyNearbyResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  opening_hours?: { open_now?: boolean };
  business_status?: string;
}

function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180)
    * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapLegacyToCompetitor(
  place: LegacyNearbyResult,
  originLat: number,
  originLng: number,
): Partial<ICompetitor> {
  const lat = place.geometry.location.lat;
  const lng = place.geometry.location.lng;

  return {
    placeId: place.place_id,
    name: place.name,
    address: place.vicinity ?? '',
    lat,
    lng,
    distanceMeters: Math.round(distanceMeters(originLat, originLng, lat, lng)),
    rating: place.rating ?? null,
    userRatingCount: place.user_ratings_total ?? null,
    priceLevel: place.price_level ?? null,
    types: place.types ?? [],
    primaryType: place.types?.[0],
    isOpenNow: place.opening_hours?.open_now,
    hours: {},
    menuItems: [],
    menuCoverage: 'none' as const,
    reviews: [],
    fetchedAt: new Date(),
    lastRefreshedAt: new Date(),
    dataQuality: 'minimal' as const,
  };
}

export async function searchNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 500,
): Promise<Partial<ICompetitor>[] | null> {
  if (!API_KEY) {
    console.error('[GoogleMaps] GOOGLE_MAPS_API_KEY is not set');
    return null;
  }

  try {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radiusMeters),
      type: 'restaurant',
      key: API_KEY,
    });

    const res = await fetch(`${LEGACY_BASE}/nearbysearch/json?${params}`);
    if (!res.ok) {
      console.error('[GoogleMaps] Nearby Search HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[GoogleMaps] Nearby Search status:', data.status, data.error_message);
      return null;
    }

    const results: LegacyNearbyResult[] = data.results ?? [];
    const operational = results.filter(r => r.business_status !== 'CLOSED_PERMANENTLY');
    return operational.map(p => mapLegacyToCompetitor(p, lat, lng));
  } catch (err) {
    console.error('[GoogleMaps] Nearby Search network error:', err);
    return null;
  }
}

// ─── Place Details (legacy) ─────────────────────────────────────────────────

const DETAILS_FIELDS = [
  'name',
  'formatted_address',
  'geometry',
  'rating',
  'user_ratings_total',
  'price_level',
  'types',
  'opening_hours',
  'website',
  'international_phone_number',
  'reviews',
  'url',
].join(',');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function parseLegacyHours(openingHours?: {
  periods?: { open: { day: number; time: string }; close?: { day: number; time: string } }[];
}): IOperatingHours {
  const hours: IOperatingHours = {};
  if (!openingHours?.periods?.length) return hours;

  for (const period of openingHours.periods) {
    const dayName = DAY_NAMES[period.open.day];
    if (!dayName) continue;

    const openTime = period.open.time;
    const closeTime = period.close?.time ?? '2359';

    const openStr = `${openTime.slice(0, 2)}:${openTime.slice(2)}`;
    const closeStr = `${closeTime.slice(0, 2)}:${closeTime.slice(2)}`;

    const range: IHourRange = { open: openStr, close: closeStr };
    if (!hours[dayName]) hours[dayName] = [];
    hours[dayName]!.push(range);
  }

  return hours;
}

export interface PlaceDetailsResult {
  reviews: IReview[];
  hours: IOperatingHours;
  formattedAddress?: string;
  websiteUrl?: string;
  phone?: string;
  googleMapsUrl?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number | null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  if (!API_KEY) {
    console.error('[GoogleMaps] GOOGLE_MAPS_API_KEY is not set');
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: DETAILS_FIELDS,
      key: API_KEY,
    });

    const res = await fetch(`${LEGACY_BASE}/details/json?${params}`);
    if (!res.ok) {
      console.error(`[GoogleMaps] Details (${placeId}) HTTP error:`, res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 'OK' || !data.result) {
      console.error(`[GoogleMaps] Details (${placeId}) status:`, data.status);
      return null;
    }

    const r = data.result;

    const reviews: IReview[] = (r.reviews ?? []).map((rv: {
      text: string;
      rating: number;
      author_name: string;
      relative_time_description: string;
      time: number;
    }) => ({
      text: rv.text ?? '',
      rating: rv.rating ?? 0,
      authorName: rv.author_name ?? 'Anonymous',
      relativeTime: rv.relative_time_description ?? '',
      publishedAt: rv.time ? new Date(rv.time * 1000) : undefined,
      source: 'google_maps' as const,
    }));

    return {
      reviews,
      hours: parseLegacyHours(r.opening_hours),
      formattedAddress: r.formatted_address,
      websiteUrl: r.website,
      phone: r.international_phone_number,
      googleMapsUrl: r.url,
      rating: r.rating,
      userRatingCount: r.user_ratings_total,
      priceLevel: r.price_level ?? null,
    };
  } catch (err) {
    console.error(`[GoogleMaps] Details (${placeId}) network error:`, err);
    return null;
  }
}

/**
 * Fetch details for multiple places in parallel batches.
 */
export async function getPlaceDetailsBatch(
  placeIds: string[],
  batchSize: number = 5,
): Promise<Map<string, PlaceDetailsResult>> {
  const results = new Map<string, PlaceDetailsResult>();

  for (let i = 0; i < placeIds.length; i += batchSize) {
    const batch = placeIds.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (id) => {
        const details = await getPlaceDetails(id);
        return { id, details };
      }),
    );

    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value.details) {
        results.set(result.value.id, result.value.details);
      }
    }
  }

  return results;
}
