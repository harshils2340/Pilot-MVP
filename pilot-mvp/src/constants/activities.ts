export type Activity = {
  label: string;
  slug: string;
};

export const ACTIVITIES: Activity[] = [
  { label: "Sell prepared food", slug: "sell-prepared-food" },
  { label: "Indoor dining", slug: "indoor-dining" },
  { label: "Outdoor seating", slug: "outdoor-seating" },
  { label: "Sell alcohol", slug: "sell-alcohol" },
  { label: "Hire employees", slug: "hire-employees" },
  { label: "Food preparation and service", slug: "food-preparation" },
  { label: "All permits and licenses", slug: "all-permits" },
  { label: "Health permit", slug: "health-permit" },
  { label: "Building permit", slug: "building-permit" },
  { label: "Signage", slug: "signage" },
  { label: "Retail sales", slug: "retail-sales" },
  { label: "Mobile vending", slug: "mobile-vending" },
];
