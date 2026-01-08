import { Permit } from "./schema";

export async function seedPermits() {
  await Permit.create([
    {
      name: "Food Premises Inspection",
      level: "municipal",
      authority: "Toronto Public Health",
      jurisdiction: {
        country: "CA",
        province: "ON",
        city: "Toronto"
      },
      businessTypes: ["restaurant"],
      activities: ["sell-prepared-food"],
      applyUrl: "https://www.toronto.ca/food-inspection",
      sourceUrl: "https://www.toronto.ca/food-inspection",
      lastUpdated: new Date()
    }
  ]);
}
