export type Jurisdiction = {
  code: string;
  country: string;
  province: string;
  city: string;
};

export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: "TORONTO_ON",
    country: "CA",
    province: "ON",
    city: "Toronto"
  }
];
