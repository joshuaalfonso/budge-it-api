import z from "zod";

export const monthlyReportQuerySchema = z.object({
  id: z.coerce.number().int().positive().default(1),
  month: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
});