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
    async findAll(userId: number, query: QueryTransactionInput) {
        const { wallet_id, category_id, type, start_date, end_date, page, limit } = query;
        const offset = (page - 1) * limit;

        const conditions = [eq(transactions.userId, userId)];

        if (wallet_id) conditions.push(eq(transactions.walletId, wallet_id));
        if (category_id) conditions.push(eq(transactions.categoryId, category_id));
        if (type) conditions.push(eq(transactions.type, type));
        if (start_date) conditions.push(gte(transactions.transactionDate, start_date));
        if (end_date) conditions.push(lte(transactions.transactionDate, end_date));

        const data = await db
        .select({
            id: transactions.id,
            userId: transactions.userId,
            walletId: transactions.walletId,
            walletName: wallets.name,
            categoryId: transactions.categoryId,
            categoryName: categories.name,
            type: transactions.type,
            amount: transactions.amount,
            description: transactions.description,
            transactionDate: transactions.transactionDate,
            createdAt: transactions.createdAt,
            updatedAt: transactions.updatedAt,
        })
        .from(transactions)
        .leftJoin(wallets, eq(transactions.walletId, wallets.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
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

        const transaction = {
            userId: userId,
            walletId: data.wallet_id,
            categoryId: data.category_id,
            type: data.type,
            amount: data.amount ?? "0.00",
            description: data.description,
            transactionDate: "2026-09-22"
        }

        // will fail if the reference id does not exists

        const [result] = await db.insert(transactions).values(transaction).$returningId();
        return this.findById(result.id);
        
    },

    async delete(id: number) {
        return await db.transaction(async (tx) => {

        // 3. Delete record
        await tx.delete(transactions).where(eq(transactions.id, id));

        return { success: true };
        });
    },
};