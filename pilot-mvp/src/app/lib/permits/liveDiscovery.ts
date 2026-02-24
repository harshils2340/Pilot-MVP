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
  name?: unknown;
  level?: unknown;
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

export type LiveDiscoveryResult = {
  permits: ExplainedPermit[];
  warnings: string[];
  sourcesUsed: Array<{ title: string; url: string; excerpt: string }>;
};

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_SEARCH_QUERIES = 4;
const MAX_SEARCH_RESULTS_PER_QUERY = 6;
const MAX_CANDIDATE_URLS = 12;
const MAX_SCRAPED_PAGES = 8;
const MAX_PAGE_TEXT = 12000;
const FETCH_TIMEOUT_MS = 12000;
const PERMIT_DISCOVERY_DEBUG = process.env.PERMIT_DISCOVERY_DEBUG === "true";
const SEARCH_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function debugLog(...args: unknown[]) {
  if (!PERMIT_DISCOVERY_DEBUG) return;
  console.log("[permit-discovery]", ...args);
}

function normalizeLevel(level: unknown): "municipal" | "provincial" | "federal" {
  const value = typeof level === "string" ? level.toLowerCase().trim() : "";
  if (value === "federal") return "federal";
  if (value === "provincial" || value === "state") return "provincial";
  return "municipal";
}

function normalizeConfidence(value: unknown): "required" | "conditional" | "informational" {
  const confidence = typeof value === "string" ? value.toLowerCase().trim() : "";
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

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

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

function decodeDuckDuckGoUrl(rawHref: string): string | null {
  try {
    const decodedHref = decodeHtmlEntities(rawHref);

    if (decodedHref.startsWith("//")) return `https:${decodedHref}`;
    if (decodedHref.startsWith("http://") || decodedHref.startsWith("https://")) return decodedHref;

    const url = new URL(decodedHref, "https://duckduckgo.com");
    const redirected = url.searchParams.get("uddg");
    if (redirected) {
      return decodeURIComponent(redirected);
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function decodeBingUrl(rawHref: string): string | null {
  try {
    const decodedHref = decodeHtmlEntities(rawHref);
    const url = new URL(decodedHref, "https://www.bing.com");

    const maybeEncodedTarget = url.searchParams.get("u");
    if (maybeEncodedTarget) {
      const decodedTarget = decodeURIComponent(maybeEncodedTarget);
      const base64Target = decodedTarget.startsWith("a1") ? decodedTarget.slice(2) : decodedTarget;

      try {
        const maybeUrl = Buffer.from(base64Target, "base64").toString("utf8");
        if (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://")) {
          return maybeUrl;
        }
      } catch {
        // ignore and fall through
      }

      if (decodedTarget.startsWith("http://") || decodedTarget.startsWith("https://")) {
        return decodedTarget;
      }
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

function extractSearchHits(query: string, html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const rejectedUrls: string[] = [];
  const anchorRegex = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = anchorRegex.exec(html);

  while (match) {
    const href = finalizeCandidateUrl(decodeDuckDuckGoUrl(match[1]));
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
    match = anchorRegex.exec(html);
  }

  if (hits.length === 0 && rejectedUrls.length > 0) {
    debugLog("No usable hits for query", query, "Rejected URL examples:", rejectedUrls);
  }

  return hits;
}

function extractBingSearchHits(query: string, html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const rejectedUrls: string[] = [];
  const resultRegex =
    /<li[^>]*class=["'][^"']*b_algo[^"']*["'][\s\S]*?<h2[^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match = resultRegex.exec(html);
  while (match) {
    const href = finalizeCandidateUrl(decodeBingUrl(match[1]));
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
    match = resultRegex.exec(html);
  }

  if (hits.length === 0 && rejectedUrls.length > 0) {
    debugLog("No usable Bing hits for query", query, "Rejected URL examples:", rejectedUrls);
  }

  return hits;
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": SEARCH_USER_AGENT
    }
  });

  if (!response.ok) return [];
  const html = await response.text();

  if (
    response.status === 202 ||
    /bots use duckduckgo too|anomaly-modal|challenge-form|anomaly\.js/i.test(html)
  ) {
    debugLog(`DuckDuckGo challenge detected for query "${query}" (status ${response.status})`);
    return [];
  }

  return extractSearchHits(query, html);
}

async function searchBing(query: string): Promise<SearchHit[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en-us&ensearch=1`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": SEARCH_USER_AGENT
    }
  });

  if (!response.ok) return [];
  const html = await response.text();
  return extractBingSearchHits(query, html);
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
  const response = await fetchWithTimeout(OPENAI_CHAT_URL, {
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
  });

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

async function searchWeb(queries: string[]): Promise<SearchHit[]> {
  const allHits: SearchHit[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    const ddgHits = await searchDuckDuckGo(query);
    const bingHits = ddgHits.length > 0 ? [] : await searchBing(query);
    const hits = ddgHits.length > 0 ? ddgHits : bingHits;
    const provider = ddgHits.length > 0 ? "duckduckgo" : "bing";

    debugLog(`Search hits for query "${query}" via ${provider}:`, hits.map((h) => h.url));

    for (const hit of hits) {
      if (seenUrls.has(hit.url)) continue;
      seenUrls.add(hit.url);
      allHits.push(hit);
      if (allHits.length >= MAX_CANDIDATE_URLS) return allHits;
    }
  }

  return allHits;
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

async function extractPermitsFromSources(
  input: MatchInput,
  sources: SourcePage[],
  apiKey: string
): Promise<ExplainedPermit[]> {
  const systemPrompt =
    "You are a permit compliance analyst. Extract permits and licenses required for this business from source text. Return valid JSON only.";

  const compactSources = sources
    .map((source, index) => {
      return [
        `Source ${index + 1}`,
        `URL: ${source.url}`,
        `Title: ${source.title}`,
        `Content: ${source.text.slice(0, 2400)}`
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const userPrompt = [
    "Return JSON with shape:",
    "{\"permits\":[{\"name\":\"string\",\"level\":\"municipal|provincial|federal\",\"authority\":\"string\",\"applyUrl\":\"https://...\",\"sourceUrl\":\"https://...\",\"reasons\":[\"string\"],\"confidence\":\"required|conditional|informational\"}]}",
    "",
    "Rules:",
    "- Only include permits supported by these sources.",
    "- Prefer official application URLs.",
    "- Skip duplicates.",
    "",
    `Business type: ${input.businessType}`,
    `Location country: ${input.location.country}`,
    `Location province/state: ${input.location.province}`,
    `Location city: ${input.location.city ?? ""}`,
    `Activities: ${input.activities.join(", ")}`,
    "",
    compactSources
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
    const authority = typeof entry?.authority === "string" ? entry.authority.trim() : "";
    const sourceUrl = toUrlOrEmpty(entry?.sourceUrl);
    const applyUrl = toUrlOrEmpty(entry?.applyUrl);

    if (!name || !sourceUrl) continue;
    if (!isOfficialSource(sourceUrl)) {
      debugLog("Dropped permit from non-http(s) source:", sourceUrl, "permitName:", name);
      continue;
    }

    normalized.push({
      name,
      level: normalizeLevel(entry?.level),
      authority: authority || "Unknown authority",
      applyUrl,
      sourceUrl,
      lastUpdated: new Date().toISOString(),
      reasons: toReasonList(entry?.reasons),
      confidence: normalizeConfidence(entry?.confidence)
    });
  }

  return dedupePermits(normalized);
}

export async function discoverPermitsFromWeb(input: MatchInput): Promise<LiveDiscoveryResult> {
  const warnings: string[] = [];
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";

  debugLog("Discovery input:", input);
  debugLog("OpenAI key configured:", Boolean(apiKey));

  if (!apiKey) {
    return {
      permits: [],
      warnings: ["OPENAI_API_KEY is not configured, web discovery was skipped."],
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
    hits = await searchWeb(preparedQueries);
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
