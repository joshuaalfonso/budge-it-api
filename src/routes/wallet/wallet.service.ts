import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { transactions, wallets } from "../../db/schema.js";
import type { CreateWalletRequest, UpdateWalletRequest } from "./wallet.schema.js";


export const getWallets = async (userId: number) => {
    return await db
        .select({
            id: wallets.id,
            name: wallets.name,
            type: wallets.type,
            initialBalance: wallets.initialBalance,
            totalTransactions: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
            // Current balance = initial balance + sum of transactions
            balance: sql<number>`
                ${wallets.initialBalance} + coalesce(sum(
                    CASE 
                        WHEN ${transactions.type} = 'expense' THEN -${transactions.amount}
                        ELSE ${transactions.amount}
                    END
                ), 0)
            `
        })
        .from(wallets)
        .leftJoin(transactions, eq(transactions.walletId, wallets.id))
        .where(eq(wallets.userId, userId))
        .groupBy(wallets.id);
        }

export const getWalletById = async (
    userId: number,
    walletId: number
    ) => {
    const [wallet] = await db
        .select()
        .from(wallets)
        .where(
        and(
            eq(wallets.id, walletId),
            eq(wallets.userId, userId)
        )
        )
        .limit(1);

    return wallet ?? null;
}

export const  createWallet = async (
    userId: number,
    data: CreateWalletRequest
) => {
    const [result] = await db
        .insert(wallets)
        .values({
            userId,
            name: data.name,
            type: data.type,
            initialBalance: data.initial_balance ?? "0.00",
        });

    return getWalletById(userId, result.insertId);
}

export const updateWallet = async (
    userId: number,
    walletId: number,
    data: UpdateWalletRequest
) => {
    const result = await db
        .update(wallets)
        .set({
            userId,
            name: data.name,
            type: data.type,
            initialBalance: data.initial_balance ?? "0.00",
        })
        .where(
        and(
            eq(wallets.id, walletId),
            eq(wallets.userId, userId)
        )
        );

    if (result[0].affectedRows === 0) {
        return null;
    }

    return getWalletById(userId, walletId);
}

export const deleteWallet = async (
    userId: number,
    walletId: number
) => {
    const result = await db
        .delete(wallets)
        .where(
        and(
            eq(wallets.id, walletId),
            eq(wallets.userId, userId)
        )
        );

    return result[0].affectedRows > 0;
}
