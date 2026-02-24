import type { ExplainedPermit, MatchInput } from "@/app/lib/permits/matcher";

type SearchHit = {
  query: string;
  title: string;
  url: string;
};

type SourcePage = {
  title: string;
  url: string;
  excerpt: string;
  text: string;
};

type RawPermit = {
  id?: unknown;
  name?: unknown;
  issuer?: unknown;
  required?: unknown;
  level?: unknown;
  apply_url?: unknown;
  info_url?: unknown;
  description?: unknown;
  authority?: unknown;
  applyUrl?: unknown;
  sourceUrl?: unknown;
  reasons?: unknown;
  confidence?: unknown;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type SearchQueryResponse = {
  queries?: unknown;
};

type ExtractedPermitResponse = {
  permits?: unknown;
};

type SerpApiResponse = {
  error?: string;
  organic_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
  }>;
};

export type LiveDiscoveryResult = {
  permits: ExplainedPermit[];
  warnings: string[];
  sourcesUsed: Array<{ title: string; url: string; excerpt: string }>;
};

type SearchWebResult = {
  hits: SearchHit[];
  warnings: string[];
};

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_SEARCH_QUERIES = 4;
const MAX_SEARCH_RESULTS_PER_QUERY = 6;
const MAX_CANDIDATE_URLS = 12;
const MAX_SCRAPED_PAGES = 8;
const MAX_PAGE_TEXT = 12000;
const FETCH_TIMEOUT_MS = 12000;
const SERPAPI_TIMEOUT_MS = Math.max(
  5000,
  Number.parseInt(process.env.SERPAPI_TIMEOUT_MS || "25000", 10) || 25000
);
const OPENAI_QUERY_TIMEOUT_MS = 45000;
const OPENAI_EXTRACT_TIMEOUT_MS = 150000;
const MAX_PROMPT_SOURCES = 5;
const MAX_PROMPT_SOURCE_CHARS = 1400;
const APPLY_URL_VALIDATE_TIMEOUT_MS = 10000;
const PERMIT_DISCOVERY_DEBUG = process.env.PERMIT_DISCOVERY_DEBUG === "true";
const SEARCH_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const SERPAPI_SEARCH_URL = "https://serpapi.com/search.json";

function debugLog(...args: unknown[]) {
  if (!PERMIT_DISCOVERY_DEBUG) return;
  console.log("[permit-discovery]", ...args);
}

function normalizeLevel(level: unknown): "municipal" | "provincial" | "federal" {
  const value = typeof level === "string" ? level.toLowerCase().trim() : "";
  if (value === "federal") return "federal";
  if (value === "provincial" || value === "state") return "provincial";
  if (value === "city" || value === "county" || value === "municipal") return "municipal";
  return "municipal";
}

function normalizeConfidence(value: unknown): "required" | "conditional" | "informational" {
  if (typeof value === "number") {
    if (value >= 0.75) return "required";
    if (value >= 0.4) return "conditional";
    return "informational";
  }

  const confidence = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (confidence === "high") return "required";
  if (confidence === "medium") return "conditional";
  if (confidence === "low") return "informational";
  if (confidence === "required") return "required";
  if (confidence === "informational") return "informational";
  return "conditional";
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlToText(html: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const text = noScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return decodeHtmlEntities(text);
}

function extractJson<T>(raw: string): T | null {
  const candidates = [
    raw.trim(),
    raw
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim()
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // continue
    }

    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const slice = candidate.slice(first, last + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        // continue
      }
    }
  }

  return null;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeGoogleUrl(rawHref: string): string | null {
  try {
    const decodedHref = decodeHtmlEntities(rawHref);
    if (decodedHref.startsWith("http://") || decodedHref.startsWith("https://")) return decodedHref;
    const url = new URL(decodedHref, "https://www.google.com");

    const directTarget = url.searchParams.get("q") || url.searchParams.get("url");
    if (directTarget && (directTarget.startsWith("http://") || directTarget.startsWith("https://"))) {
      return directTarget;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function isSearchEngineHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "duckduckgo.com" ||
    host.endsWith(".duckduckgo.com") ||
    host === "bing.com" ||
    host.endsWith(".bing.com") ||
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "yahoo.com" ||
    host.endsWith(".yahoo.com")
  );
}

function finalizeCandidateUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isSearchEngineHost(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isOfficialSource(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    // Relaxed mode: allow any public website while discovery is being tuned.
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractGoogleSearchHits(query: string, html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const rejectedUrls: string[] = [];
  const primaryRegex =
    /<a[^>]*href=["']([^"']+)["'][^>]*>(?:[\s\S]*?)<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/a>/gi;
  let match = primaryRegex.exec(html);

  while (match) {
    const href = finalizeCandidateUrl(decodeGoogleUrl(match[1]));
    const rawTitle = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Untitled";

    if (href && isOfficialSource(href)) {
      hits.push({
        query,
        title: decodeHtmlEntities(rawTitle),
        url: href
      });
    } else if (href && rejectedUrls.length < 5) {
      rejectedUrls.push(href);
    }

    if (hits.length >= MAX_SEARCH_RESULTS_PER_QUERY) break;
    match = primaryRegex.exec(html);
  }

  if (hits.length === 0) {
    const fallbackRegex = /<a[^>]*href=["'](\/url\?q=[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let fallbackMatch = fallbackRegex.exec(html);
    while (fallbackMatch) {
      const href = finalizeCandidateUrl(decodeGoogleUrl(fallbackMatch[1]));
      const rawTitle =
        fallbackMatch[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Untitled";

      if (href && isOfficialSource(href)) {
        hits.push({
          query,
          title: decodeHtmlEntities(rawTitle),
          url: href
        });
      } else if (href && rejectedUrls.length < 5) {
        rejectedUrls.push(href);
      }

      if (hits.length >= MAX_SEARCH_RESULTS_PER_QUERY) break;
      fallbackMatch = fallbackRegex.exec(html);
    }
  }

  if (hits.length === 0 && rejectedUrls.length > 0) {
    debugLog("No usable Google hits for query", query, "Rejected URL examples:", rejectedUrls);
  }

  return hits;
}

async function searchGoogle(query: string): Promise<SearchHit[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&num=10&pws=0&gl=us`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": SEARCH_USER_AGENT
    }
  });

  if (!response.ok) return [];
  const html = await response.text();

  if (
    response.status === 429 ||
    /unusual traffic|sorry\/index|captcha|consent\.google\.com|detected unusual traffic/i.test(html)
  ) {
    debugLog(`Google challenge detected for query "${query}" (status ${response.status})`);
    return [];
  }

  return extractGoogleSearchHits(query, html);
}

async function searchSerpApi(query: string, serpApiKey: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: serpApiKey,
    hl: "en",
    gl: "us",
    num: String(Math.max(8, MAX_SEARCH_RESULTS_PER_QUERY))
  });

  const url = `${SERPAPI_SEARCH_URL}?${params.toString()}`;
  const response = await fetchWithTimeout(url, undefined, SERPAPI_TIMEOUT_MS);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`SerpAPI request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as SerpApiResponse;
  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const results = Array.isArray(data.organic_results) ? data.organic_results : [];
  const hits: SearchHit[] = [];

  for (const result of results) {
    const href = finalizeCandidateUrl(result.link ?? null);
    if (!href || !isOfficialSource(href)) continue;

    hits.push({
      query,
      title: typeof result.title === "string" && result.title.trim().length > 0 ? result.title : "Untitled",
      url: href
    });

    if (hits.length >= MAX_SEARCH_RESULTS_PER_QUERY) break;
  }

  return hits;
}

function sanitizeQueries(input: MatchInput, llmQueries: string[]): string[] {
  const fallback = [
    `${input.businessType} permit requirements ${input.location.city ?? ""} ${input.location.province}`,
    `${input.businessType} business license ${input.location.province}`,
    `${input.activities.join(" ")} permit ${input.location.city ?? ""} official site`,
    `${input.businessType} ${input.location.country} municipal permit`
  ]
    .map((q) => q.replace(/\s+/g, " ").trim())
    .filter((q) => q.length > 0);

  const combined = [...llmQueries, ...fallback];
  const unique = Array.from(
    new Set(
      combined
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
    )
  );

  return unique.slice(0, MAX_SEARCH_QUERIES);
}

function extractContentText(content: string | Array<{ type?: string; text?: string }> | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  return content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

async function callOpenAIJson<T>(
  apiKey: string,
  stage: "query-generation" | "permit-extraction",
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  const timeoutMs =
    stage === "permit-extraction" ? OPENAI_EXTRACT_TIMEOUT_MS : OPENAI_QUERY_TIMEOUT_MS;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        OPENAI_CHAT_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          })
        },
        timeoutMs
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`OpenAI request failed (${response.status}): ${text.slice(0, 300)}`);
      }

      const data = (await response.json()) as OpenAIChatResponse;
      const raw = extractContentText(data.choices?.[0]?.message?.content);

      debugLog(`LLM raw response (${stage}):`, raw || "<empty>");

      if (!raw) return null;
      const parsed = extractJson<T>(raw);
      debugLog(`LLM parsed JSON (${stage}):`, parsed);
      return parsed;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (isAbort && attempt < 2) {
        debugLog(`LLM ${stage} timed out on attempt ${attempt}, retrying once...`);
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function generateQueries(input: MatchInput, apiKey: string): Promise<string[]> {
  const systemPrompt =
    "You generate concise web search queries for permit research. Return valid JSON only: {\"queries\": string[]}.";

  const userPrompt = [
    "Generate 4 high quality search queries to find official permit and license requirements.",
    `Country code: ${input.location.country}`,
    `Province/state code: ${input.location.province}`,
    `City: ${input.location.city ?? ""}`,
    `Business type: ${input.businessType}`,
    `Activities: ${input.activities.join(", ")}`
  ].join("\n");

  const result = await callOpenAIJson<SearchQueryResponse>(
    apiKey,
    "query-generation",
    systemPrompt,
    userPrompt
  );
  if (!result?.queries || !Array.isArray(result.queries)) return [];

  return result.queries.filter((q): q is string => typeof q === "string").map((q) => q.trim());
}

async function searchWeb(queries: string[], serpApiKey: string): Promise<SearchWebResult> {
  const allHits: SearchHit[] = [];
  const seenUrls = new Set<string>();
  const warnings: string[] = [];

  for (const query of queries) {
    let hits: SearchHit[] = [];
    let provider: "serpapi" | "google-fallback" | null = null;

    try {
      hits = await searchSerpApi(query, serpApiKey);
      provider = "serpapi";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      debugLog(`SerpAPI search failed for query "${query}":`, message);

      // If SerpAPI times out/aborts for one query, continue discovery via Google fallback.
      try {
        hits = await searchGoogle(query);
        provider = "google-fallback";
        warnings.push(`SerpAPI failed for one query; used Google fallback for: "${query}"`);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message : "Unknown fallback error";
        debugLog(`Google fallback failed for query "${query}":`, fallbackMessage);
        warnings.push(`Web search failed for query "${query}": ${message}`);
        continue;
      }
    }

    debugLog(
      `Search hits for query "${query}" via ${provider ?? "unknown"}:`,
      hits.map((h) => h.url)
    );

    for (const hit of hits) {
      if (seenUrls.has(hit.url)) continue;
      seenUrls.add(hit.url);
      allHits.push(hit);
      if (allHits.length >= MAX_CANDIDATE_URLS) {
        return { hits: allHits, warnings };
      }
    }
  }

  return { hits: allHits, warnings };
}

async function scrapeSources(hits: SearchHit[]): Promise<SourcePage[]> {
  const sources: SourcePage[] = [];

  for (const hit of hits.slice(0, MAX_SCRAPED_PAGES)) {
    try {
      const response = await fetchWithTimeout(hit.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PilotPermitBot/1.0)"
        }
      });

      if (!response.ok) continue;
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();
      const text = stripHtmlToText(html).slice(0, MAX_PAGE_TEXT).trim();
      if (text.length < 300) continue;

      sources.push({
        title: hit.title,
        url: hit.url,
        excerpt: text.slice(0, 320),
        text
      });
      debugLog("Scraped source:", hit.url, `textLength=${text.length}`);
    } catch {
      // Ignore scrape errors for individual pages and continue.
    }
  }

  return sources;
}

function toReasonList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 5);
}

function toUrlOrEmpty(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    return "";
  } catch {
    return "";
  }
}

function dedupePermits(permits: ExplainedPermit[]): ExplainedPermit[] {
  const map = new Map<string, ExplainedPermit>();

  for (const permit of permits) {
    const key = [
      permit.authority.toLowerCase().trim(),
      permit.name.toLowerCase().trim(),
      permit.level,
      permit.sourceUrl.toLowerCase().trim()
    ].join("|");

    if (!map.has(key)) {
      map.set(key, permit);
    }
  }

  return Array.from(map.values());
}

async function isUsableApplyUrl(applyUrl: string): Promise<boolean> {
  if (!applyUrl) return false;

  let parsed: URL;
  try {
    parsed = new URL(applyUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (isSearchEngineHost(parsed.hostname)) return false;

  // HEAD first (cheaper), then GET fallback when needed.
  try {
    const headRes = await fetchWithTimeout(
      applyUrl,
      {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": SEARCH_USER_AGENT
        }
      },
      APPLY_URL_VALIDATE_TIMEOUT_MS
    );

    if (headRes.status === 404 || headRes.status === 410) return false;
    if (headRes.status >= 200 && headRes.status < 400) return true;

    // Some servers block HEAD or are auth-gated but still valid for users.
    if (headRes.status === 401 || headRes.status === 403) return true;
    if (headRes.status >= 500) return false;
  } catch {
    // fall through to GET check
  }

  try {
    const getRes = await fetchWithTimeout(
      applyUrl,
      {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": SEARCH_USER_AGENT
        }
      },
      APPLY_URL_VALIDATE_TIMEOUT_MS
    );

    if (getRes.status === 404 || getRes.status === 410) return false;
    if (getRes.status >= 200 && getRes.status < 400) return true;
    if (getRes.status === 401 || getRes.status === 403) return true;
    if (getRes.status >= 500) return false;

    return false;
  } catch {
    return false;
  }
}

async function filterPermitsWithUsableApplyUrl(permits: ExplainedPermit[]): Promise<ExplainedPermit[]> {
  const checks = await Promise.all(
    permits.map(async (permit) => {
      const ok = await isUsableApplyUrl(permit.applyUrl);
      return { permit, ok };
    })
  );

  const dropped = checks.filter((item) => !item.ok).map((item) => item.permit.name);
  if (dropped.length > 0) {
    debugLog("Dropped permits with unusable applyUrl:", dropped);
  }

  return checks.filter((item) => item.ok).map((item) => item.permit);
}

async function extractPermitsFromSources(
  input: MatchInput,
  sources: SourcePage[],
  apiKey: string
): Promise<ExplainedPermit[]> {
  const systemPrompt =
    "You are BizPaL. Follow the exact JSON contract from the user prompt and return valid JSON only.";

  const businessName = (input.businessName || "").trim() || "Unknown Business";
  const businessType = input.businessType.trim();
  const locationLabel = `${input.location.city ?? ""}, ${input.location.province}`.replace(/^\s*,\s*/, "");
  const permitKeywords = (input.permitKeywords || "").trim() || input.activities.join(", ");

  const compactSources = sources
    .slice(0, MAX_PROMPT_SOURCES)
    .map((source, index) => {
      return [
        `Source ${index + 1}`,
        `URL: ${source.url}`,
        `Title: ${source.title}`,
        `Content: ${source.text.slice(0, MAX_PROMPT_SOURCE_CHARS)}`
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const bizPalPrePrompt = [
    "You are BizPaL.",
    "",
    "Your job is to generate a realistic checklist of permits and licenses required to start a business.",
    "",
    "Return ONLY valid JSON.",
    "No markdown.",
    "No explanations.",
    "",
    "BUSINESS INPUT:",
    "",
    `Business Name: ${businessName}`,
    "",
    `Business Type: ${businessType}`,
    "",
    `Business Location: ${locationLabel}`,
    "",
    "Permit Keywords (optional):",
    permitKeywords,
    "",
    "---",
    "",
    "TASK:",
    "",
    "Based on the business inputs above, generate a complete list of permits and licenses required to operate this business.",
    "",
    "Include:",
    "",
    "City permits",
    "County permits",
    "State permits",
    "Federal permits (if applicable)",
    "",
    "Focus on practical real-world permits required to open and operate.",
    "",
    "Include restaurant-specific permits if the business is a restaurant.",
    "",
    "If permit keywords are provided, prioritize those permits.",
    "",
    "Prefer official government sources.",
    "",
    "---",
    "",
    "OUTPUT FORMAT:",
    "",
    "Return a JSON object:",
    "",
    "{",
    "  \"business_name\": \"string\",",
    "  \"business_type\": \"string\",",
    "  \"location\": \"City, State\",",
    "  \"permits\": [",
    "    {",
    "      \"id\": \"snake_case_id\",",
    "",
    "      \"name\": \"Permit Name\",",
    "",
    "      \"issuer\": \"Agency or Department\",",
    "",
    "      \"level\": \"city | county | state | federal\",",
    "",
    "      \"required\": true,",
    "",
    "      \"apply_url\": \"official application link\",",
    "",
    "      \"info_url\": \"information page link\",",
    "",
    "      \"description\": \"Short description\",",
    "",
    "      \"confidence\": 0.0-1.0",
    "    }",
    "  ]",
    "}",
    "",
    "---",
    "",
    "RULES:",
    "",
    "Return 10-30 permits if possible",
    "Use real government URLs",
    "Use stable snake_case IDs",
    "No duplicate permits",
    "Only include real permits",
    "Required permits should appear first",
    "No text outside JSON",
    "",
    "Generate the permit list now."
  ].join("\n");

  const userPrompt = [
    bizPalPrePrompt,
    "",
    "Use the following scraped web sources as grounding context. Prefer these URLs for apply_url and info_url when relevant:",
    "",
    compactSources,
    "",
    "Do not return markdown. Return only JSON."
  ].join("\n");

  const parsed = await callOpenAIJson<ExtractedPermitResponse>(
    apiKey,
    "permit-extraction",
    systemPrompt,
    userPrompt
  );
  if (!parsed?.permits || !Array.isArray(parsed.permits)) return [];

  const normalized: ExplainedPermit[] = [];

  for (const entry of parsed.permits as RawPermit[]) {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    const authority =
      typeof entry?.issuer === "string"
        ? entry.issuer.trim()
        : typeof entry?.authority === "string"
          ? entry.authority.trim()
          : "";

    const sourceUrl =
      toUrlOrEmpty(entry?.info_url) ||
      toUrlOrEmpty(entry?.sourceUrl) ||
      toUrlOrEmpty(entry?.apply_url) ||
      toUrlOrEmpty(entry?.applyUrl);

    const applyUrl = toUrlOrEmpty(entry?.apply_url) || toUrlOrEmpty(entry?.applyUrl);

    if (!name || !sourceUrl || !applyUrl) continue;
    if (!isOfficialSource(sourceUrl)) {
      debugLog("Dropped permit from non-http(s) source:", sourceUrl, "permitName:", name);
      continue;
    }

    const reasons = toReasonList(entry?.reasons);
    const description = typeof entry?.description === "string" ? entry.description.trim() : "";
    if (reasons.length === 0 && description) {
      reasons.push(description);
    }

    let confidence = normalizeConfidence(entry?.confidence);
    if (entry?.required === true) confidence = "required";
    if (entry?.required === false && confidence === "required") confidence = "conditional";

    normalized.push({
      name,
      level: normalizeLevel(entry?.level),
      authority: authority || "Unknown authority",
      applyUrl,
      sourceUrl,
      lastUpdated: new Date().toISOString(),
      reasons,
      confidence
    });
  }

  const deduped = dedupePermits(normalized);
  const usable = await filterPermitsWithUsableApplyUrl(deduped);
  return usable;
}

export async function discoverPermitsFromWeb(input: MatchInput): Promise<LiveDiscoveryResult> {
  const warnings: string[] = [];
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const serpApiKey = process.env.SERPAPI_API_KEY?.trim() || "";

  debugLog("Discovery input:", input);
  debugLog("OpenAI key configured:", Boolean(apiKey));
  debugLog("SerpAPI key configured:", Boolean(serpApiKey));
  debugLog("OpenAI timeout config:", {
    queryMs: OPENAI_QUERY_TIMEOUT_MS,
    extractMs: OPENAI_EXTRACT_TIMEOUT_MS,
    maxPromptSources: MAX_PROMPT_SOURCES,
    maxPromptSourceChars: MAX_PROMPT_SOURCE_CHARS
  });

  if (!apiKey) {
    return {
      permits: [],
      warnings: ["OPENAI_API_KEY is not configured, web discovery was skipped."],
      sourcesUsed: []
    };
  }

  if (!serpApiKey) {
    return {
      permits: [],
      warnings: ["SERPAPI_API_KEY is not configured, web search API was skipped."],
      sourcesUsed: []
    };
  }

  let queries: string[] = [];
  try {
    queries = await generateQueries(input, apiKey);
    debugLog("LLM-generated queries:", queries);
  } catch (error) {
    warnings.push(
      `Query generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  const preparedQueries = sanitizeQueries(input, queries);
  debugLog("Final queries after fallback/sanitize:", preparedQueries);
  if (preparedQueries.length === 0) {
    return {
      permits: [],
      warnings: [...warnings, "No valid search queries were generated."],
      sourcesUsed: []
    };
  }

  let hits: SearchHit[] = [];
  try {
    const searchResult = await searchWeb(preparedQueries, serpApiKey);
    hits = searchResult.hits;
    warnings.push(...searchResult.warnings);
    debugLog("Total search hits:", hits.length);
  } catch (error) {
    warnings.push(`Web search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  if (hits.length === 0) {
    return {
      permits: [],
      warnings: [...warnings, "No usable URLs were found from web search."],
      sourcesUsed: []
    };
  }

  const sources = await scrapeSources(hits);
  debugLog("Total scraped sources:", sources.length);
  if (sources.length === 0) {
    return {
      permits: [],
      warnings: [...warnings, "Could not scrape readable content from discovered sources."],
      sourcesUsed: []
    };
  }

  try {
    const permits = await extractPermitsFromSources(input, sources, apiKey);
    debugLog("Extracted permits count:", permits.length);
    debugLog("Extracted permits payload:", permits);
    return {
      permits,
      warnings:
        permits.length > 0
          ? warnings
          : [...warnings, "No permits were extracted confidently from scraped sources."],
      sourcesUsed: sources.map((source) => ({
        title: source.title,
        url: source.url,
        excerpt: source.excerpt
      }))
    };
  } catch (error) {
    return {
      permits: [],
      warnings: [
        ...warnings,
        `Permit extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
      ],
      sourcesUsed: sources.map((source) => ({
        title: source.title,
        url: source.url,
        excerpt: source.excerpt
      }))
    };
  }
}
