import { NextResponse } from "next/server";
import { permitSearchSchema } from "@/validators/permitSearchSchema";
import { findMatchingPermits } from "@/app/lib/permits/matcher";
import type { PermitSearchResponse } from "@/types/permitSearch";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = permitSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    // Get explained permits from matcher (already returns lastUpdated as string)
    const permits = await findMatchingPermits(parsed.data);

    const response: PermitSearchResponse = {
      permits, // type now matches PermitResult[]
      disclaimer: "Always verify with official sources."
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Permit search error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
