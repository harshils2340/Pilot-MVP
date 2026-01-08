import { z } from "zod";

export const adminPermitSchema = z.object({
  name: z.string().min(3),
  level: z.enum(["municipal", "provincial", "federal"]),
  authority: z.string().min(3),
  jurisdiction: z.object({
    country: z.string().min(2),
    province: z.string().min(2),
    city: z.string().optional()
  }),
  businessTypes: z.array(z.string()).min(1),
  activities: z.array(z.string()).min(1),
  conditions: z.object({
    homeBased: z.boolean().optional(),
    onlineOnly: z.boolean().optional()
  }).optional(),
  applyUrl: z.string().url(),
  sourceUrl: z.string().url(),
  confidenceHints: z.object({
    required: z.boolean().optional(),
    conditional: z.boolean().optional()
  }).optional()
});
