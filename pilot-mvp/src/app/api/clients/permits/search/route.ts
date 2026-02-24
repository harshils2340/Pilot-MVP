import { NextResponse } from "next/server";
import { permitSearchSchema } from "@/validators/permitSearchSchema";
import { findMatchingPermits } from "@/app/lib/permits/matcher";
import connectToDB from "@/app/lib/mongodb";
import type { PermitSearchResponse } from "@/types/permitSearch";
import { discoverPermitsFromWeb } from "@/app/lib/permits/liveDiscovery";

const PERMIT_DISCOVERY_DEBUG = process.env.PERMIT_DISCOVERY_DEBUG === "true";

export async function POST(req: Request) {
  // Connect to MongoDB
  await connectToDB();

  try {
    const body = await req.json();

    // Validate request body
    const parsed = permitSearchSchema.safeParse(body);
    if (!parsed.success) {
      const validationMessage =
        parsed.error.issues
          .map((issue) => {
            const fieldPath = issue.path.join(".");
            return fieldPath ? `${fieldPath}: ${issue.message}` : issue.message;
          })
          .join("; ") || "Invalid permit search request payload.";

      return NextResponse.json(
        {
          error: validationMessage,
          details: parsed.error.format()
        },
        { status: 400 }
      );
    }

    const { businessType, activities } = parsed.data;

    if (!businessType || !Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json(
        { error: "Please provide a valid businessType and at least one activity." },
        { status: 400 }
      );
    }

    const warnings: string[] = [];
    let discoveryMode: "web-llm" | "database" = "database";

    const liveDiscovery = await discoverPermitsFromWeb(parsed.data);
    let permits = liveDiscovery.permits;
    warnings.push(...liveDiscovery.warnings);

    if (PERMIT_DISCOVERY_DEBUG) {
      console.log("[permit-discovery] API live result", {
        permitsCount: liveDiscovery.permits.length,
        warnings: liveDiscovery.warnings,
        sourcesUsed: liveDiscovery.sourcesUsed.map((s) => s.url)
      });
    }

    if (permits.length > 0) {
      discoveryMode = "web-llm";
    } else {
      // Fallback only to existing database permits (no static UI fallback).
      permits = await findMatchingPermits(parsed.data);
      discoveryMode = "database";
    }

    const response: PermitSearchResponse = {
      permits,
      disclaimer: "AI-assisted results. Always verify requirements with official sources before filing.",
      discoveryMode,
      warnings,
      sourcesUsed: liveDiscovery.sourcesUsed
    };

    if (PERMIT_DISCOVERY_DEBUG) {
      console.log("[permit-discovery] API response summary", {
        discoveryMode,
        permitsCount: permits.length
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Permit search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
