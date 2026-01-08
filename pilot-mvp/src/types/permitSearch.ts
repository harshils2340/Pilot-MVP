export type PermitSearchRequest = {
  location: {
    country: string;
    province: string;
    city: string;
  };
  businessType: string;
  activities: string[];
  options?: {
    homeBased?: boolean;
    onlineOnly?: boolean;
  };
};

export type PermitResult = {
  name: string;
  level: "municipal" | "provincial" | "federal";
  authority: string;
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: string;
};

export type PermitSearchResponse = {
  permits: PermitResult[];
  disclaimer: string;
};

export type PermitMatchReason =
  | "BUSINESS_TYPE"
  | "ACTIVITY"
  | "LOCATION"
  | "CONDITION";

export type ExplainedPermit = {
  name: string;
  level: "municipal" | "provincial" | "federal";
  authority: string;
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: string;
  reasons: PermitMatchReason[];
};
