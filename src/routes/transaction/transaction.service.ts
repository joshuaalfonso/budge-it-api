import { eq, and, gte, lte, desc, or, lt, gt, SQL, asc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
// import { sql } from "drizzle-orm";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  QueryTransactionInput,
} from "./transaction.schema.js";
import { categories, transactions, wallets } from "../../db/schema.js";
import { db } from "../../db/index.js";

export const TransactionService = {


    // async findAll(userId: number, query: QueryTransactionInput) {
    //     const { wallet_id, category_id, type, start_date, end_date, page, limit } = query;
    //     const offset = (page - 1) * limit;

    //     const conditions = [eq(transactions.userId, userId)];

    //     if (wallet_id) conditions.push(eq(transactions.walletId, wallet_id));
    //     if (category_id) conditions.push(eq(transactions.categoryId, category_id));
    //     if (type) conditions.push(eq(transactions.type, type));
    //     if (start_date) conditions.push(gte(transactions.transactionDate, start_date));
    //     if (end_date) conditions.push(lte(transactions.transactionDate, end_date));

    //     const data = await db
    //     .select({
    //         id: transactions.id,
    //         userId: transactions.userId,
    //         walletId: transactions.walletId,
    //         walletName: wallets.name,
    //         categoryId: transactions.categoryId,
    //         categoryName: categories.name,
    //         type: transactions.type,
    //         amount: transactions.amount,
    //         description: transactions.description,
    //         transactionDate: transactions.transactionDate,
    //         createdAt: transactions.createdAt,
    //         updatedAt: transactions.updatedAt,
    //     })
    //     .from(transactions)
    //     .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    //     .leftJoin(categories, eq(transactions.categoryId, categories.id))
    //     .where(and(...conditions))
    //     .orderBy(desc(transactions.transactionDate))
    //     .limit(limit)
    //     .offset(offset);

    //     return data;
    // },

   async findAll(userId: number, query: QueryTransactionInput) {
        const {
            wallet_id,
            category_id,
            type,
            start_date,
            end_date,
            limit,
            cursor_date,
            cursor_id,
            direction = "next",
        } = query;

        const conditions: SQL<unknown>[] = [
            eq(transactions.userId, userId),
        ];


        if (wallet_id !== undefined && wallet_id !== null) {
            conditions.push(
                eq(transactions.walletId, wallet_id)
            );
        }

        if (category_id !== undefined && category_id !== null) {
            conditions.push(
                eq(transactions.categoryId, category_id)
            );
        }

        if (type !== undefined && type !== null) {
            conditions.push(
                eq(transactions.type, type)
            );
        }

        if (start_date) {
            conditions.push(
                gte(transactions.transactionDate, start_date)
            );
        }

        if (end_date) {
            conditions.push(
                lte(transactions.transactionDate, end_date)
            );
        }

        if (
            cursor_date !== undefined &&
            cursor_date !== null &&
            cursor_id !== undefined &&
            cursor_id !== null
        ) {
            let cursorCondition: SQL<unknown> | undefined;

            if (direction === "previous") {

                cursorCondition = or(
                    gt(
                        transactions.transactionDate,
                        cursor_date
                    ),
                    and(
                        eq(
                            transactions.transactionDate,
                            cursor_date
                        ),
                        gt(
                            transactions.id,
                            +cursor_id
                        )
                    )
                );
            } else {

                cursorCondition = or(
                    lt(
                        transactions.transactionDate,
                        cursor_date
                    ),
                    and(
                        eq(
                            transactions.transactionDate,
                            cursor_date
                        ),
                        lt(
                            transactions.id,
                            +cursor_id
                        )
                    )
                );
            }

            if (cursorCondition) {
                conditions.push(cursorCondition);
            }
        }

        const orderBy =
            direction === "previous"
                ? [
                    asc(transactions.transactionDate),
                    asc(transactions.id),
                ]
                : [
                    desc(transactions.transactionDate),
                    desc(transactions.id),
                ];

        const safeLimit = Math.min(
            Math.max(limit, 1),
            100
        );

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
            .leftJoin(
                wallets,
                eq(transactions.walletId, wallets.id)
            )
            .leftJoin(
                categories,
                eq(transactions.categoryId, categories.id)
            )
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(safeLimit + 1);

        const hasMore = data.length > safeLimit;

        let pageData = hasMore
            ? data.slice(0, safeLimit)
            : data;

        if (direction === "previous") {
            pageData.reverse();
        }

        const firstItem = pageData[0];
        const lastItem = pageData[pageData.length - 1];

        const nextCursor = lastItem
            ? {
                cursor_date: lastItem.transactionDate,
                cursor_id: lastItem.id,
            }
            : null;

        const previousCursor = firstItem
            ? {
                cursor_date: firstItem.transactionDate,
                cursor_id: firstItem.id,
            }
            : null;

        let hasNextPage = false;
        let hasPreviousPage = false;

        if (direction === "next") {
            hasNextPage = hasMore;

            hasPreviousPage =
                cursor_date !== undefined &&
                cursor_date !== null &&
                cursor_id !== undefined &&
                cursor_id !== null;
        } else {
            hasPreviousPage = hasMore;

            hasNextPage =
                cursor_date !== undefined &&
                cursor_date !== null &&
                cursor_id !== undefined &&
                cursor_id !== null;
        }

        return {
            data: pageData,

            pagination: {
                limit: safeLimit,

                hasNextPage,
                hasPreviousPage,

                nextCursor,
                previousCursor,
            },
        };

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
            transactionDate: data.transaction_date
        }

        const [result] = await db.insert(transactions).values(transaction).$returningId();
        return this.findById(result.id);
    },

    async update(id: number, userId: number, data: UpdateTransactionInput) {

        const transaction = {
            userId: userId,
            walletId: data.wallet_id,
            categoryId: data.category_id,
            type: data.type,
            amount: data.amount ?? "0.00",
            description: data.description,
            transactionDate: data.transaction_date
        }

        await db.update(transactions).set(transaction).where(eq(transactions.id, id));
        return this.findById(id);
    },

    async delete(id: number) {
        return await db.transaction(async (tx) => {

        // 3. Delete record
        await tx.delete(transactions).where(eq(transactions.id, id));

        return { success: true };
        });
    },
};