import z from "zod";





export const querySchema = z.object({
  id: z.coerce.number().int().positive().default(1),
});