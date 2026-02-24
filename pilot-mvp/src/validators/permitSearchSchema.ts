import { z } from "zod";

// Accept free-form business type and activity text from onboarding.
export const permitSearchSchema = z.object({
  businessName: z.string().min(1).optional(),
  permitKeywords: z.string().optional(),
  location: z.object({
    country: z.string().length(2),
    province: z.string().length(2),
    city: z.string().min(1)
  }),
  businessType: z.string().min(1),
  activities: z.array(z.string().min(1)).min(1),
  options: z
    .object({
      homeBased: z.boolean().optional(),
      onlineOnly: z.boolean().optional()
    })
    .optional()
});
