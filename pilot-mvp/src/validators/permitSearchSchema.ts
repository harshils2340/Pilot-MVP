import { z } from "zod";
import { BUSINESS_TYPES } from "@/constants/businessTypes";
import { ACTIVITIES } from "@/constants/activities";

export const permitSearchSchema = z.object({
  location: z.object({
    country: z.string().length(2),
    province: z.string().length(2),
    city: z.string().min(1)
  }),
  businessType: z.enum(
    BUSINESS_TYPES.map(b => b.slug) as [string, ...string[]]
  ),
  activities: z.array(
    z.enum(ACTIVITIES.map(a => a.slug) as [string, ...string[]])
  ),
  options: z
    .object({
      homeBased: z.boolean().optional(),
      onlineOnly: z.boolean().optional()
    })
    .optional()
});
