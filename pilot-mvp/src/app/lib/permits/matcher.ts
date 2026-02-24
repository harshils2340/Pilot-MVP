import { Permit, IPermit } from "./schema";

// Input type for search
export type MatchInput = {
  businessName?: string;
  permitKeywords?: string;
  location: { country: string; province: string; city?: string };
  businessType: string;
  activities: string[];
  options?: { homeBased?: boolean; onlineOnly?: boolean };
};

// Type for explained permit returned by API
export type ExplainedPermit = {
  name: string;
  level: "municipal" | "provincial" | "federal";
  authority: string;
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: string; // ISO string for frontend/API
  reasons: string[];
  confidence: "required" | "conditional" | "informational";
};

export async function findMatchingPermits(input: MatchInput): Promise<ExplainedPermit[]> {
  const filter: Record<string, unknown> = {
    "jurisdiction.country": input.location.country,
    "jurisdiction.province": input.location.province,
    businessTypes: input.businessType,
  };
  const useAllPermits = input.activities.includes("all") || input.activities.length === 0;
  if (!useAllPermits) {
    filter.activities = { $in: input.activities };
  }

  const permits: IPermit[] = (await Permit.find(filter)) as IPermit[];

  return permits.map((permit) => {
    const reasons: string[] = [];
    let confidence: "required" | "conditional" | "informational" = "informational";

    if (permit.businessTypes.includes(input.businessType)) reasons.push("BUSINESS_TYPE");
    const activityMatch = useAllPermits || permit.activities.some((a: string) => input.activities.includes(a));
    if (activityMatch) reasons.push("ACTIVITY");
    if (!permit.jurisdiction.city || permit.jurisdiction.city === input.location.city) reasons.push("LOCATION");

    if (reasons.includes("BUSINESS_TYPE") && reasons.includes("ACTIVITY") && reasons.includes("LOCATION")) {
      confidence = "required";
    } else if (reasons.length >= 2) {
      confidence = "conditional";
    }

    return {
      name: permit.name,
      level: permit.level,
      authority: permit.authority,
      applyUrl: permit.applyUrl,
      sourceUrl: permit.sourceUrl,
      lastUpdated: permit.lastUpdated.toISOString(),
      reasons,
      confidence
    };
  });
}
