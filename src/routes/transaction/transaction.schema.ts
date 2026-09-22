import { z } from "zod";

export const createTransactionSchema = z.object({
    // userId: z.number().int().positive(),
    walletId: z.number().int().positive(),
    categoryId: z.number().int().positive(),
    type: z.enum(["income", "expense"]),
    amount: z
        .number()
        .positive("Amount must be greater than 0")
        .transform((val) => val.toFixed(2)), 
    description: z.string().max(500).optional(),
    transactionDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
  userId: z.string().transform((val) => Number(val)),
  walletId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  categoryId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  type: z.enum(["income", "expense"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().default("1").transform((val) => Number(val)),
  limit: z.string().optional().default("20").transform((val) => Number(val)),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionInput = z.infer<typeof queryTransactionSchema>;