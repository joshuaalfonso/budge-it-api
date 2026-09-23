import { z } from "zod";

export const createTransactionSchema = z.object({
    // userId: z.number().int().positive(),
    wallet_id: z.number().int().positive(),
    category_id: z.number().int().positive(),
    type: z.enum(["income", "expense"]),
    amount: z
       .string()
       .regex(/^\d+(\.\d{1,2})?$/)
       .optional(),
    description: z.string().max(500).optional(),
    transaction_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
//   userId: z.string().transform((val) => Number(val)),
  wallet_id: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  category_id: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  type: z.enum(["income", "expense"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.string().optional().default("1").transform((val) => Number(val)),
  limit: z.string().optional().default("10").transform((val) => Number(val)),
  cursor_date: z.string().optional(),
  cursor_id: z.string().optional(),
  direction: z.enum(['next', 'previous']).optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionInput = z.infer<typeof queryTransactionSchema>;