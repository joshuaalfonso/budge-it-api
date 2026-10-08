import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, transactions, wallets } from "../../db/schema.js";



export const SettingService = {

    async deleteAllTransaction(userId: number) {
        return await db.transaction(async (tx) => {
            await tx
                .delete(transactions)
                .where(eq(transactions.userId, userId));
        });
    },

    async deleteAllData(userId: number) {
        return await db.transaction(async (tx) => {
            await tx
                .delete(transactions)
                .where(eq(transactions.userId, userId));

            await tx
                .delete(wallets)
                .where(eq(wallets.userId, userId));

            await tx
                .delete(categories)
                .where(eq(categories.userId, userId));
        });
    },

};