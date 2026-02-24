import { NextResponse } from "next/server";
import { permitSearchSchema } from "@/validators/permitSearchSchema";
import { findMatchingPermits } from "@/app/lib/permits/matcher";
import connectToDB from "@/app/lib/mongodb";
import type { PermitSearchResponse } from "@/types/permitSearch";

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
        { error: "Please provide a valid businessType and at least one activity slug." },
        { status: 400 }
      );
    }

    // Fetch permits
    const permits = await findMatchingPermits(parsed.data);

    const response: PermitSearchResponse = {
      permits,
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
