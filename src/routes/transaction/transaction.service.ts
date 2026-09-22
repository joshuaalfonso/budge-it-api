import { eq, and, gte, lte, desc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { sql } from "drizzle-orm";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  QueryTransactionInput,
} from "./transaction.schema.js";
import { categories, transactions, wallets } from "../../db/schema.js";
import { db } from "../../db/index.js";

export const TransactionService = {
    async findAll(query: QueryTransactionInput) {
        const { userId, walletId, categoryId, type, startDate, endDate, page, limit } = query;
        const offset = (page - 1) * limit;

        const conditions = [eq(transactions.userId, userId)];

        if (walletId) conditions.push(eq(transactions.walletId, walletId));
        if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
        if (type) conditions.push(eq(transactions.type, type));
        if (startDate) conditions.push(gte(transactions.transactionDate, new Date(startDate)));
        if (endDate) conditions.push(lte(transactions.transactionDate, new Date(endDate)));

        const data = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.transactionDate))
        .limit(limit)
        .offset(offset);

        return data;
    },

    async findById(id: number) {
        const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

        if (!transaction) {
        throw new HTTPException(404, { message: "Transaction not found" });
        }
        return transaction;
    },

    async create(userId: number, data: CreateTransactionInput) {
        return await db.transaction(async (tx) => {
        // 1. Verify Wallet exists
        const [wallet] = await tx
            .select()
            .from(wallets)
            .where(and(eq(wallets.id, data.walletId), eq(wallets.userId, userId)))
            .limit(1);

        if (!wallet) {
            throw new HTTPException(404, { message: "Wallet not found for this user" });
        }

        // 2. Verify Category exists
        const [category] = await tx
            .select()
            .from(categories)
            .where(eq(categories.id, data.categoryId))
            .limit(1);

        if (!category) {
            throw new HTTPException(404, { message: "Category not found" });
        }

        const transaction = {
            ...data,
            userId,
            transactionDate: new Date(data.transactionDate),
        }

        // 3. Insert Transaction
        const [inserted] = await tx.insert(transactions).values(transaction).$returningId();

        // 4. Update Wallet Balance atomically
        //   const adjustment = data.type === "income" 
        //     ? sql`${wallets.balance} + ${data.amount}`
        //     : sql`${wallets.balance} - ${data.amount}`;

        //   await tx
        //     .update(wallets)
        //     .set({ balance: adjustment })
        //     .where(eq(wallets.id, data.walletId));

        // Any error thrown above automatically triggers a ROLLBACK
        const [newTransaction] = await tx
            .select()
            .from(transactions)
            .where(eq(transactions.id, inserted.id));

        return newTransaction;
        });
    },

    async delete(id: number, userId: number) {
        return await db.transaction(async (tx) => {
        // 1. Get existing transaction
        const [existing] = await tx
            .select()
            .from(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .limit(1);

        if (!existing) {
            throw new HTTPException(404, { message: "Transaction not found" });
        }

        // 2. Reverse balance adjustment
        //   const reversal = existing.type === "income"
        //     ? sql`${wallets.balance} - ${existing.amount}`
        //     : sql`${wallets.balance} + ${existing.amount}`;

        //   await tx
        //     .update(wallets)
        //     .set({ balance: reversal })
        //     .where(eq(wallets.id, existing.walletId));

        // 3. Delete record
        await tx.delete(transactions).where(eq(transactions.id, id));

        return { success: true };
        });
    },
};