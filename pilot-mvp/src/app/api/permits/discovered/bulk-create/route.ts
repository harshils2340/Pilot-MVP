import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import DiscoveredPermit, { PermitConfidence } from "@/app/lib/permits/discoveredSchema";

type DiscoveredPermitPayload = {
  name?: unknown;
  level?: unknown;
  authority?: unknown;
  applyUrl?: unknown;
  sourceUrl?: unknown;
  lastUpdated?: unknown;
  reasons?: unknown;
  confidence?: unknown;
};

type NormalizedPermit = {
  clientId: string;
  name: string;
  level: string;
  authority: string;
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: Date;
  reasons: string[];
  confidence: PermitConfidence;
};

function toHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function toConfidence(value: unknown): PermitConfidence {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "required") return "required";
  if (normalized === "informational") return "informational";
  return "conditional";
}

function normalizePermit(
  clientId: string,
  payload: DiscoveredPermitPayload
): NormalizedPermit | null {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const authority = typeof payload.authority === "string" ? payload.authority.trim() : "";
  const level = typeof payload.level === "string" ? payload.level.trim().toLowerCase() : "municipal";
  const applyUrl = toHttpUrl(payload.applyUrl);
  const sourceUrl = toHttpUrl(payload.sourceUrl);

  if (!name || !authority || !applyUrl || !sourceUrl) return null;

  const reasons = Array.isArray(payload.reasons)
    ? payload.reasons
        .filter((reason): reason is string => typeof reason === "string")
        .map((reason) => reason.trim())
        .filter((reason) => reason.length > 0)
        .slice(0, 10)
    : [];

  const lastUpdated =
    typeof payload.lastUpdated === "string" && !Number.isNaN(Date.parse(payload.lastUpdated))
      ? new Date(payload.lastUpdated)
      : new Date();

  return {
    clientId,
    name,
    level,
    authority,
    applyUrl,
    sourceUrl,
    lastUpdated,
    reasons,
    confidence: toConfidence(payload.confidence)
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();

    const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
    const permits: unknown[] = Array.isArray(body?.permits) ? body.permits : [];

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    if (permits.length === 0) {
      return NextResponse.json({ error: "permits array is required" }, { status: 400 });
    }

    const normalizedPermits: NormalizedPermit[] = permits
      .map((permit: unknown) => normalizePermit(clientId, permit as DiscoveredPermitPayload))
      .filter((permit: NormalizedPermit | null): permit is NormalizedPermit => permit !== null);

    if (normalizedPermits.length === 0) {
      return NextResponse.json(
        { error: "No valid permits to create after URL and field validation." },
        { status: 400 }
      );
    }

    const created = await DiscoveredPermit.insertMany(normalizedPermits);

    return NextResponse.json(
      {
        success: true,
        created: created.length,
        permits: created.map((permit) => ({
          id: permit._id.toString(),
          clientId: permit.clientId,
          name: permit.name,
          level: permit.level,
          authority: permit.authority,
          applyUrl: permit.applyUrl,
          sourceUrl: permit.sourceUrl,
          lastUpdated: permit.lastUpdated,
          reasons: permit.reasons,
          confidence: permit.confidence
        }))
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to bulk create discovered permits:", error);
    return NextResponse.json(
      { error: "Failed to create discovered permits", details: error.message },
      { status: 500 }
    );
  }
}
