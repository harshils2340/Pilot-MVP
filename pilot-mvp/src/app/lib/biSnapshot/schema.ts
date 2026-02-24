import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Sub-document interfaces ────────────────────────────────────────────────

export interface IMenuItem {
  name: string;
  price: number | null;
  category: string;
  subcategory?: string;
  description?: string;
  source: 'google_maps' | 'manual_ingest' | 'scraped';
  confidence: number; // 0-1, how confident we are in the price/category
  ingestedAt: Date;
}

export interface IReview {
  text: string;
  rating: number;
  authorName: string;
  relativeTime: string;
  publishedAt?: Date;
  language?: string;
  source: 'google_maps' | 'serpapi' | 'yelp' | 'manual_ingest';
  themes?: string[]; // extracted by Gemini: ["service", "ambiance", "pricing"]
}

export interface IHourRange {
  open: string;  // "09:00"
  close: string; // "23:00"
}

export interface IOperatingHours {
  monday?: IHourRange[];
  tuesday?: IHourRange[];
  wednesday?: IHourRange[];
  thursday?: IHourRange[];
  friday?: IHourRange[];
  saturday?: IHourRange[];
  sunday?: IHourRange[];
}

export interface IFootTraffic {
  venueId: string;          // BestTime venue_id
  venueName?: string;
  weekRaw: number[][];      // 7 days × 24 hours (0-100 busyness per hour)
  peakHours: {
    day: number;            // 0=Mon, 6=Sun
    peakStart: number;      // hour (0-23)
    peakEnd: number;
    peakIntensity: number;  // 0-100
  }[];
  quietHours: {
    day: number;
    quietStart: number;
    quietEnd: number;
  }[];
  dwellTimeAvg: number;    // minutes
  dwellTimeMax?: number;
  surgeHours?: {            // unusual spikes (events, happy hour)
    day: number;
    hour: number;
    delta: number;          // % above weekly avg for that hour
  }[];
  fetchedAt: Date;
  confidence: 'live' | 'forecast' | 'stale';
}

export type DataSourceTag = 'menu_median' | 'price_level_lookup' | 'consultant_input'
  | 'industry_avg' | 'besttime_dwell' | 'besttime_traffic' | 'google_maps' | 'computed';

export interface ISourcedValue<T = number> {
  value: T;
  source: DataSourceTag;
}

export interface IDaypartRevenue {
  daypart: 'breakfast' | 'lunch' | 'happy_hour' | 'dinner' | 'late_night';
  hoursStart: number;
  hoursEnd: number;
  avgFoodCheck: ISourcedValue;
  avgBevCheck: ISourcedValue;
  avgPartySize: ISourcedValue;
  turnsPerHour: ISourcedValue;
  avgOccupancyRate: ISourcedValue;       // 0-1, from BestTime or default
  seatUtilization: ISourcedValue;        // 0-1, accounts for party-size/table-size mismatch
  dailyRevenue: number;                  // computed for this daypart
}

export interface IWeekdayBreakdown {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  dayIndex: number;                      // 0=Mon, 6=Sun
  trafficMultiplier: ISourcedValue;      // relative to weekly avg (1.0 = average)
  revenue: number;
  dayparts: IDaypartRevenue[];
}

export interface IRevenueEstimate {
  // Headline numbers
  weeklyRevenue: number;
  annualRevenue: number;
  annualRevenueSeasonAdjusted: number;

  // Method & confidence
  method: 'revpash_daypart' | 'manual' | 'gemini_estimate';
  confidenceScore: number;               // 0-100, based on how many inputs are real vs default
  confidenceGrade: 'A' | 'B' | 'C' | 'D'; // A = mostly real data, D = mostly defaults

  // Core inputs (each tracks its source)
  inputs: {
    seatCount: ISourcedValue;
    cuisineType: string;
    venueType: 'bar' | 'casual_dining' | 'fast_casual' | 'fine_dining' | 'cafe' | 'pub';
    operatingDays: number;               // days per week the venue operates
    seasonalityFactor: ISourcedValue;    // annual multiplier (< 1.0 for seasonal markets)
    beverageRevenueRatio: ISourcedValue; // portion of revenue from drinks (0-1)
  };

  // Granular breakdown by day and daypart
  weeklyBreakdown: IWeekdayBreakdown[];

  // Scenario projections
  projections?: {
    scenario: string;
    label: string;                       // human-readable, e.g. "Add late-night kitchen (Fri-Sat)"
    incrementalWeekly: number;
    incrementalAnnual: number;
    assumptions: string[];               // list of assumptions made
    confidence: 'high' | 'medium' | 'low';
  }[];

  calculatedAt: Date;
}

export interface ICompetitor {
  // Identity
  placeId: string;            // Google Maps place_id (unique key)
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters?: number;    // from client location
  googleMapsUrl?: string;
  websiteUrl?: string;
  phone?: string;

  // Google Maps metadata
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null;  // 1-4
  types: string[];            // ["restaurant", "bar", "cafe"]
  primaryType?: string;       // "italian_restaurant"

  // Operational
  hours: IOperatingHours;
  isOpenNow?: boolean;
  servesBreakfast?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesBrunch?: boolean;
  servesVegetarianFood?: boolean;
  servesAlcohol?: boolean;    // servesBeer || servesWine
  hasOutdoorSeating?: boolean;
  hasLiveMusic?: boolean;
  hasDelivery?: boolean;
  hasTakeout?: boolean;
  hasReservations?: boolean;
  hasPrivateDining?: boolean; // inferred from reviews

  // Menu data
  menuItems: IMenuItem[];
  menuCoverage: 'full' | 'partial' | 'none';
  menuLastUpdated?: Date;

  // Reviews
  reviews: IReview[];
  serpApiTopics?: { keyword: string; mentions: number }[];

  // Foot traffic
  footTraffic?: IFootTraffic;

  // Revenue
  estimatedRevenue?: IRevenueEstimate;

  // Event potential (Gemini-assessed)
  eventProfile?: {
    hasPrivateEvents: boolean;
    eventTypes: string[];       // ["corporate", "birthday", "wedding"]
    estimatedEventRevenueShare: number; // 0-1 (e.g. 0.20 = 20% of revenue)
    evidence: string[];         // review snippets that suggest events
    assessedAt: Date;
  };

  // Data freshness
  fetchedAt: Date;
  lastRefreshedAt: Date;
  dataQuality: 'complete' | 'partial' | 'minimal';
}

// ─── Aggregates ─────────────────────────────────────────────────────────────

export interface IPricingBand {
  category: string;           // "cocktails", "entrees", "appetizers"
  min: number;
  max: number;
  median: number;
  mean: number;
  count: number;              // how many items in this band
  clientPosition?: number;    // client's avg price in this category (null if N/A)
  percentile?: number;        // where client sits vs corridor (0-100)
}

export interface IReviewTheme {
  theme: string;              // "slow service", "great patio", "overpriced cocktails"
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;          // how many reviews mention this
  competitorCount: number;    // across how many competitors
  exampleSnippets: string[];  // 2-3 representative quotes
  relevanceToClient: 'high' | 'medium' | 'low';
}

export interface IMenuGap {
  category: string;           // "late-night food", "non-alcoholic cocktails"
  description: string;
  competitorCoverage: number; // % of competitors offering this
  demandSignal: 'strong' | 'moderate' | 'weak';
  evidence: string;           // why we think this is a gap
  estimatedRevenueImpact?: number;
}

export interface IAggregates {
  totalCompetitors: number;
  menusFound: number;
  menusTotal: number;
  menuCoveragePercent: number;
  reviewsAnalyzed: number;
  avgCorridorRating: number;
  avgCorridorPriceLevel: number;

  pricingBands: IPricingBand[];
  topReviewThemes: IReviewTheme[];
  underservedCategories: IMenuGap[];

  corridorInsights: {
    busiestDay: string;
    busiestHour: number;
    quietestWindow: string;           // "Tuesday 2-5 PM"
    avgDwellTime: number;
    lateNightCompetitors: number;     // how many open past 11 PM
    brunchCompetitors: number;
    avgMenuSize: number;              // items per competitor
    highestRatedCompetitor: string;
    lowestRatedCompetitor: string;
  };

  // Gemini-generated executive summary
  executiveSummary?: string;
  keyOpportunities?: string[];        // top 3-5 bullet points
  competitiveThreats?: string[];

  computedAt: Date;
}

// ─── Version history ────────────────────────────────────────────────────────
// Stored inline but capped to the most recent 20 entries. Each entry is a
// lightweight diff summary (~200 bytes), NOT a copy of the full snapshot.
// Older entries are dropped on write via $push + $slice in the update logic.

export const VERSION_HISTORY_CAP = 20;
export const QUERY_CACHE_CAP = 50;

export interface ISnapshotVersion {
  version: number;
  createdAt: Date;
  createdBy: string;                  // consultant email or "system"
  trigger: 'scheduled' | 'manual_refresh' | 'data_ingest' | 'initial_scan';
  summary: string;                    // "Added 3 competitors, refreshed foot traffic"
  changes: {
    competitorsAdded: number;
    competitorsRemoved: number;
    menusUpdated: number;
    reviewsAdded: number;
    trafficRefreshed: boolean;
    revenueRecalculated: boolean;
  };
}

// ─── Collection status ──────────────────────────────────────────────────────

export interface ICollectionStatus {
  googleMaps: {
    status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'stale';
    lastRun?: Date;
    nextScheduled?: Date;
    placesFound: number;
    error?: string;
  };
  bestTime: {
    status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'stale';
    lastRun?: Date;
    venuesProcessed: number;
    venuesTotal: number;
    error?: string;
  };
  geminiAnalysis: {
    status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'stale';
    lastRun?: Date;
    tokensUsed?: number;
    error?: string;
  };
  manualIngest: {
    lastUpload?: Date;
    filesProcessed: number;
    itemsAdded: number;
  };
  overall: 'initializing' | 'collecting' | 'analyzing' | 'ready' | 'stale' | 'error';
  readinessPercent: number; // 0-100
}

// ─── Main document ──────────────────────────────────────────────────────────

export interface IBiSnapshot extends Document {
  clientId: Types.ObjectId;
  consultantId?: string;

  // Search parameters
  location: {
    address: string;
    lat: number;
    lng: number;
    radiusMeters: number;     // search radius (default 500m)
    neighborhood?: string;    // "King West", "Yorkville"
    city: string;
    province?: string;
    country: string;
  };

  // Core data
  competitors: ICompetitor[];
  aggregates?: IAggregates;

  // Data pipeline status
  collectionStatus: ICollectionStatus;

  // Versioning
  version: number;
  versionHistory: ISnapshotVersion[];

  // Gemini conversation cache (recent queries to avoid re-calling)
  queryCache?: {
    query: string;
    response: {
      sentences: string[];
      components: any[];
      followUps: string[];
    };
    cachedAt: Date;
    ttlSeconds: number;
  }[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastFullRefresh?: Date;
}

// ─── Mongoose schemas ───────────────────────────────────────────────────────

const MenuItemSchema = new Schema<IMenuItem>({
  name:        { type: String, required: true },
  price:       { type: Number, default: null },
  category:    { type: String, required: true },
  subcategory: String,
  description: String,
  source:      { type: String, enum: ['google_maps', 'manual_ingest', 'scraped'], required: true },
  confidence:  { type: Number, min: 0, max: 1, default: 1 },
  ingestedAt:  { type: Date, default: Date.now },
}, { _id: false });

const ReviewSchema = new Schema<IReview>({
  text:         { type: String, required: true },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  authorName:   { type: String, required: true },
  relativeTime: String,
  publishedAt:  Date,
  language:     String,
  source:       { type: String, enum: ['google_maps', 'serpapi', 'yelp', 'manual_ingest'], required: true },
  themes:       [String],
}, { _id: false });

const HourRangeSchema = new Schema<IHourRange>({
  open:  { type: String, required: true },
  close: { type: String, required: true },
}, { _id: false });

const OperatingHoursSchema = new Schema<IOperatingHours>({
  monday:    [HourRangeSchema],
  tuesday:   [HourRangeSchema],
  wednesday: [HourRangeSchema],
  thursday:  [HourRangeSchema],
  friday:    [HourRangeSchema],
  saturday:  [HourRangeSchema],
  sunday:    [HourRangeSchema],
}, { _id: false });

const FootTrafficSchema = new Schema<IFootTraffic>({
  venueId:      { type: String, required: true },
  venueName:    String,
  weekRaw:      { type: [[Number]], required: true },
  peakHours:    [{ day: Number, peakStart: Number, peakEnd: Number, peakIntensity: Number }],
  quietHours:   [{ day: Number, quietStart: Number, quietEnd: Number }],
  dwellTimeAvg: { type: Number, required: true },
  dwellTimeMax: Number,
  surgeHours:   [{ day: Number, hour: Number, delta: Number }],
  fetchedAt:    { type: Date, required: true },
  confidence:   { type: String, enum: ['live', 'forecast', 'stale'], default: 'forecast' },
}, { _id: false });

const DATA_SOURCE_TAGS = [
  'menu_median', 'price_level_lookup', 'consultant_input',
  'industry_avg', 'besttime_dwell', 'besttime_traffic', 'google_maps', 'computed',
] as const;

const SourcedValueSchema = new Schema({
  value:  { type: Schema.Types.Mixed, required: true },
  source: { type: String, enum: DATA_SOURCE_TAGS, required: true },
}, { _id: false });

const DaypartRevenueSchema = new Schema({
  daypart:           { type: String, enum: ['breakfast', 'lunch', 'happy_hour', 'dinner', 'late_night'], required: true },
  hoursStart:        { type: Number, required: true },
  hoursEnd:          { type: Number, required: true },
  avgFoodCheck:      { type: SourcedValueSchema, required: true },
  avgBevCheck:       { type: SourcedValueSchema, required: true },
  avgPartySize:      { type: SourcedValueSchema, required: true },
  turnsPerHour:      { type: SourcedValueSchema, required: true },
  avgOccupancyRate:  { type: SourcedValueSchema, required: true },
  seatUtilization:   { type: SourcedValueSchema, required: true },
  dailyRevenue:      { type: Number, required: true },
}, { _id: false });

const WeekdayBreakdownSchema = new Schema({
  day:                { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
  dayIndex:           { type: Number, required: true },
  trafficMultiplier:  { type: SourcedValueSchema, required: true },
  revenue:            { type: Number, required: true },
  dayparts:           [DaypartRevenueSchema],
}, { _id: false });

const ProjectionSchema = new Schema({
  scenario:           { type: String, required: true },
  label:              { type: String, required: true },
  incrementalWeekly:  { type: Number, required: true },
  incrementalAnnual:  { type: Number, required: true },
  assumptions:        [String],
  confidence:         { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
}, { _id: false });

const RevenueEstimateSchema = new Schema<IRevenueEstimate>({
  weeklyRevenue:                { type: Number, required: true },
  annualRevenue:                { type: Number, required: true },
  annualRevenueSeasonAdjusted:  { type: Number, required: true },
  method:       { type: String, enum: ['revpash_daypart', 'manual', 'gemini_estimate'], required: true },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  confidenceGrade: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  inputs: {
    seatCount:            { type: SourcedValueSchema, required: true },
    cuisineType:          { type: String, required: true },
    venueType:            { type: String, enum: ['bar', 'casual_dining', 'fast_casual', 'fine_dining', 'cafe', 'pub'], required: true },
    operatingDays:        { type: Number, required: true },
    seasonalityFactor:    { type: SourcedValueSchema, required: true },
    beverageRevenueRatio: { type: SourcedValueSchema, required: true },
  },
  weeklyBreakdown: [WeekdayBreakdownSchema],
  projections:     [ProjectionSchema],
  calculatedAt:    { type: Date, default: Date.now },
}, { _id: false });

const EventProfileSchema = new Schema({
  hasPrivateEvents:             { type: Boolean, default: false },
  eventTypes:                   [String],
  estimatedEventRevenueShare:   { type: Number, min: 0, max: 1 },
  evidence:                     [String],
  assessedAt:                   { type: Date, default: Date.now },
}, { _id: false });

const CompetitorSchema = new Schema<ICompetitor>({
  placeId:       { type: String, required: true },
  name:          { type: String, required: true },
  address:       { type: String, required: true },
  lat:           { type: Number, required: true },
  lng:           { type: Number, required: true },
  distanceMeters: Number,
  googleMapsUrl: String,
  websiteUrl:    String,
  phone:         String,

  rating:           { type: Number, default: null },
  userRatingCount:  { type: Number, default: null },
  priceLevel:       { type: Number, default: null, min: 1, max: 4 },
  types:            [String],
  primaryType:      String,

  hours:            { type: OperatingHoursSchema, default: {} },
  isOpenNow:        Boolean,
  servesBreakfast:  Boolean,
  servesLunch:      Boolean,
  servesDinner:     Boolean,
  servesBrunch:     Boolean,
  servesVegetarianFood: Boolean,
  servesAlcohol:    Boolean,
  hasOutdoorSeating: Boolean,
  hasLiveMusic:     Boolean,
  hasDelivery:      Boolean,
  hasTakeout:       Boolean,
  hasReservations:  Boolean,
  hasPrivateDining: Boolean,

  menuItems:       [MenuItemSchema],
  menuCoverage:    { type: String, enum: ['full', 'partial', 'none'], default: 'none' },
  menuLastUpdated: Date,

  reviews:         [ReviewSchema],
  serpApiTopics:   [{ keyword: String, mentions: Number, _id: false }],

  footTraffic:     FootTrafficSchema,
  estimatedRevenue: RevenueEstimateSchema,
  eventProfile:    EventProfileSchema,

  fetchedAt:       { type: Date, default: Date.now },
  lastRefreshedAt: { type: Date, default: Date.now },
  dataQuality:     { type: String, enum: ['complete', 'full', 'partial', 'minimal'], default: 'minimal' },
}, { _id: false });

const PricingBandSchema = new Schema<IPricingBand>({
  category:       { type: String, required: true },
  min:            { type: Number, required: true },
  max:            { type: Number, required: true },
  median:         { type: Number, required: true },
  mean:           { type: Number, required: true },
  count:          { type: Number, required: true },
  clientPosition: Number,
  percentile:     Number,
}, { _id: false });

const ReviewThemeSchema = new Schema<IReviewTheme>({
  theme:              { type: String, required: true },
  sentiment:          { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
  frequency:          { type: Number, required: true },
  competitorCount:    { type: Number, required: true },
  exampleSnippets:    [String],
  relevanceToClient:  { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
}, { _id: false });

const MenuGapSchema = new Schema<IMenuGap>({
  category:               { type: String, required: true },
  description:            { type: String, required: true },
  competitorCoverage:     { type: Number, required: true },
  demandSignal:           { type: String, enum: ['strong', 'moderate', 'weak'], required: true },
  evidence:               String,
  estimatedRevenueImpact: Number,
}, { _id: false });

const AggregatesSchema = new Schema<IAggregates>({
  totalCompetitors:      { type: Number, required: true },
  menusFound:            { type: Number, required: true },
  menusTotal:            { type: Number, required: true },
  menuCoveragePercent:   { type: Number, required: true },
  reviewsAnalyzed:       { type: Number, required: true },
  avgCorridorRating:     Number,
  avgCorridorPriceLevel: Number,

  pricingBands:          [PricingBandSchema],
  topReviewThemes:       [ReviewThemeSchema],
  underservedCategories: [MenuGapSchema],

  corridorInsights: {
    busiestDay:             String,
    busiestHour:            Number,
    quietestWindow:         String,
    avgDwellTime:           Number,
    lateNightCompetitors:   Number,
    brunchCompetitors:      Number,
    avgMenuSize:            Number,
    highestRatedCompetitor: String,
    lowestRatedCompetitor:  String,
  },

  executiveSummary:    String,
  keyOpportunities:    [String],
  competitiveThreats:  [String],

  computedAt:          { type: Date, default: Date.now },
}, { _id: false });

const SnapshotVersionSchema = new Schema<ISnapshotVersion>({
  version:   { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  trigger:   { type: String, enum: ['scheduled', 'manual_refresh', 'data_ingest', 'initial_scan'], required: true },
  summary:   { type: String, required: true },
  changes: {
    competitorsAdded:     { type: Number, default: 0 },
    competitorsRemoved:   { type: Number, default: 0 },
    menusUpdated:         { type: Number, default: 0 },
    reviewsAdded:         { type: Number, default: 0 },
    trafficRefreshed:     { type: Boolean, default: false },
    revenueRecalculated:  { type: Boolean, default: false },
  },
}, { _id: false });

const CollectionStatusSchema = new Schema<ICollectionStatus>({
  googleMaps: {
    status:        { type: String, enum: ['pending', 'in_progress', 'complete', 'failed', 'stale'], default: 'pending' },
    lastRun:       Date,
    nextScheduled: Date,
    placesFound:   { type: Number, default: 0 },
    error:         String,
  },
  bestTime: {
    status:          { type: String, enum: ['pending', 'in_progress', 'complete', 'failed', 'stale'], default: 'pending' },
    lastRun:         Date,
    venuesProcessed: { type: Number, default: 0 },
    venuesTotal:     { type: Number, default: 0 },
    error:           String,
  },
  geminiAnalysis: {
    status:     { type: String, enum: ['pending', 'in_progress', 'complete', 'failed', 'stale'], default: 'pending' },
    lastRun:    Date,
    tokensUsed: Number,
    error:      String,
  },
  manualIngest: {
    lastUpload:     Date,
    filesProcessed: { type: Number, default: 0 },
    itemsAdded:     { type: Number, default: 0 },
  },
  overall:          { type: String, enum: ['initializing', 'collecting', 'analyzing', 'ready', 'stale', 'error'], default: 'initializing' },
  readinessPercent: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });

const QueryCacheSchema = new Schema({
  query:      { type: String, required: true },
  response: {
    sentences: [String],
    components: [Schema.Types.Mixed],
    followUps: [String],
  },
  cachedAt:   { type: Date, default: Date.now },
  ttlSeconds: { type: Number, default: 3600 },
}, { _id: false });

// ─── Main schema ────────────────────────────────────────────────────────────

const BiSnapshotSchema = new Schema<IBiSnapshot>({
  clientId:     { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  consultantId: String,

  location: {
    address:      { type: String, required: true },
    lat:          { type: Number, required: true },
    lng:          { type: Number, required: true },
    radiusMeters: { type: Number, default: 500 },
    neighborhood: String,
    city:         { type: String, required: true },
    province:     String,
    country:      { type: String },
  },

  competitors:      [CompetitorSchema],
  aggregates:       AggregatesSchema,
  collectionStatus: { type: CollectionStatusSchema, default: () => ({}) },

  version:        { type: Number, default: 1 },
  versionHistory: [SnapshotVersionSchema],

  queryCache: [QueryCacheSchema],

  lastFullRefresh: Date,
}, {
  timestamps: true,
});

// ─── Helper: push a version entry with automatic cap ────────────────────────
// Usage: await BiSnapshot.updateOne({ _id }, pushVersionUpdate(entry))
export function pushVersionUpdate(entry: Omit<ISnapshotVersion, 'createdAt'>) {
  return {
    $inc: { version: 1 },
    $push: {
      versionHistory: {
        $each: [{ ...entry, createdAt: new Date() }],
        $slice: -VERSION_HISTORY_CAP,
      },
    },
  };
}

// ─── Helper: push a query cache entry with automatic cap ─────────────────────
// Usage: await BiSnapshot.updateOne({ _id }, pushQueryCache(query, response))
export function pushQueryCache(query: string, response: { sentences: string[]; components: unknown[]; followUps: string[] }) {
  return {
    $push: {
      queryCache: {
        $each: [{ query, response, cachedAt: new Date(), ttlSeconds: 3600 }],
        $slice: -QUERY_CACHE_CAP,
      },
    },
  };
}

// Compound index: one active snapshot per client
BiSnapshotSchema.index({ clientId: 1, version: -1 });
// Geospatial queries for corridor analysis across clients
BiSnapshotSchema.index({ 'location.lat': 1, 'location.lng': 1 });
// Fast lookup by collection pipeline status
BiSnapshotSchema.index({ 'collectionStatus.overall': 1 });
// TTL for query cache cleanup (handled at application level, not TTL index)

export default mongoose.models.BiSnapshot || mongoose.model<IBiSnapshot>('BiSnapshot', BiSnapshotSchema);
