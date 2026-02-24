import { NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const BIZPAL_SYSTEM_PROMPT = `You are BizPaL.

Your job is to generate a realistic checklist of permits and licenses required to start a business.

Return ONLY valid JSON.
No markdown.
No explanations.`;

function buildUserPrompt(params: {
  businessName: string;
  businessType: string;
  businessLocation: string;
  permitKeywords?: string;
}) {
  return `BUSINESS INPUT:

Business Name: ${params.businessName}

Business Type: ${params.businessType}

Business Location: ${params.businessLocation}

Permit Keywords (optional):
${params.permitKeywords || "all permits and licenses"}

---

TASK:

Based on the business inputs above, generate a complete list of permits and licenses required to operate this business.

Include:

- City permits
- County permits
- State permits
- Federal permits (if applicable)

Focus on practical real-world permits required to open and operate.

Include restaurant-specific permits if the business is a restaurant.

If permit keywords are provided, prioritize those permits.

Prefer official government sources.

---

OUTPUT FORMAT:

Return a JSON object:

{
  "business_name": "string",
  "business_type": "string",
  "location": "City, State",
  "permits": [
    {
      "id": "snake_case_id",
      "name": "Permit Name",
      "issuer": "Agency or Department",
      "level": "city | county | state | federal",
      "required": true,
      "apply_url": "official application link",
      "info_url": "information page link",
      "description": "Short description",
      "confidence": 0.0-1.0
    }
  ]
}

---

RULES:

- Return 10–30 permits if possible
- Use real government URLs
- Use stable snake_case IDs
- No duplicate permits
- Only include real permits
- Required permits should appear first
- No text outside JSON

Generate the permit list now.`;
}

function extractJson<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim()
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
      try {
        return JSON.parse(candidate.slice(first, last + 1)) as T;
      } catch {
        // continue
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const businessName = String(body.business_name ?? body.businessName ?? "").trim() || "My Business";
    const businessType = String(body.business_type ?? body.businessType ?? "").trim();
    const businessLocation = String(
      body.business_location ?? body.location ?? body.businessLocation ?? ""
    ).trim();
    const permitKeywords = String(
      body.permit_keywords ?? body.permitKeywords ?? ""
    ).trim();

    if (!businessType || !businessLocation) {
      return NextResponse.json(
        { error: "business_type and business_location (or location) are required" },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt({
      businessName,
      businessType,
      businessLocation,
      permitKeywords: permitKeywords || undefined
    });

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: BIZPAL_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenAI request failed (${response.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";

    const parsed = extractJson<{ business_name?: string; business_type?: string; location?: string; permits?: unknown[] }>(raw);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse LLM response as JSON", raw: raw.slice(0, 500) },
        { status: 502 }
      );
    }

    // Normalize for PermitDiscovery: return { permits } at top level
    const permits = Array.isArray(parsed.permits) ? parsed.permits : [];
    return NextResponse.json({
      business_name: parsed.business_name ?? businessName,
      business_type: parsed.business_type ?? businessType,
      location: parsed.location ?? businessLocation,
      permits,
      raw: parsed
    });
  } catch (err) {
    console.error("BizPaL search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
