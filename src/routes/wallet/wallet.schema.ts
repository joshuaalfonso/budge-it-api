import z from "zod";




export const walletRequest = z.object({
    name: z.string(),
    type: z
      .enum([
        "cash",
        "e_wallet",
        "credit_card",
        "savings",
        "other",
      ])
      ,
    initial_balance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
    // currency: z.string().optional(),
});


export type CreateWalletRequest = z.infer<typeof walletRequest>;
export type UpdateWalletRequest = z.infer<typeof walletRequest>;