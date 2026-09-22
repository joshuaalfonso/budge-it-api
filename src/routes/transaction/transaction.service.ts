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
        if (start_date) conditions.push(gte(transactions.transactionDate, new Date(start_date)));
        if (end_date) conditions.push(lte(transactions.transactionDate, new Date(end_date)));

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

        const transaction = {
            walletId: data.wallet_id,
            categoryId: data.category_id,
            type: data.type,
            amount: data.amount ?? "0.00",
            userId,
            transactionDate: new Date(data.transaction_date),
        }

        const [result] = await db.insert(transactions).values(transaction).$returningId();
        return this.findById(result.id);


        // return await db.transaction(async (tx) => {

        //     const transaction = {
        //         ...data,
        //         userId,
        //         transactionDate: new Date(data.transactionDate),
        //     }

        //     const [inserted] = await tx.insert(transactions).values(transaction).$returningId();

        //     const [newTransaction] = await tx
        //         .select()
        //         .from(transactions)
        //         .where(eq(transactions.id, inserted.id));

        //     return newTransaction;

        // });
    },

    async delete(id: number) {
        return await db.transaction(async (tx) => {

        // 3. Delete record
        await tx.delete(transactions).where(eq(transactions.id, id));

        return { success: true };
        });
    },
};