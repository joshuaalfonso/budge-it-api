import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, transactions, wallets } from "../../db/schema.js";




export async function getDashboard(userId: number) {
    // Get wallets and their balances
    const walletRows = await db
        .select({
            id: wallets.id,
            name: wallets.name,
            type: wallets.type,
            initialBalance: wallets.initialBalance,
            balance: sql<string>`
                ${wallets.initialBalance}
                + COALESCE(
                    SUM(
                    CASE
                        WHEN ${transactions.type} = 'income'
                        THEN ${transactions.amount}
                        WHEN ${transactions.type} = 'expense'
                        THEN -${transactions.amount}
                        ELSE 0
                    END
                    ),
                    0
                )
            `,
        })
        .from(wallets)
        .leftJoin(
            transactions,
            eq(wallets.id, transactions.walletId)
        )
        .where(eq(wallets.userId, userId))
        .groupBy(
            wallets.id,
            wallets.name,
            wallets.type,
            wallets.initialBalance
        );

    // Get total income and expense
    const [summary] = await db
        .select({
            totalIncome: sql<string>`
                COALESCE(
                SUM(
                    CASE
                    WHEN ${transactions.type} = 'income'
                        THEN ${transactions.amount}
                    ELSE 0
                    END
                ),
                0
                )
            `,

            totalExpense: sql<string>`
                COALESCE(
                SUM(
                    CASE
                    WHEN ${transactions.type} = 'expense'
                        THEN ${transactions.amount}
                    ELSE 0
                    END
                ),
                0
                )
            `,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId));

    const totalIncome = Number(summary.totalIncome);
    const totalExpense = Number(summary.totalExpense);

    const totalBalance = walletRows.reduce(
        (total, wallet) => total + Number(wallet.balance),
        0
    );

    // Recent transactions
    const recentTransactions = await db
        .select({
            id: transactions.id,
            type: transactions.type,
            amount: transactions.amount,
            description: transactions.description,
            transactionDate: transactions.transactionDate,

            walletId: wallets.id,
            walletName: wallets.name,

            categoryId: categories.id,
            categoryName: categories.name,
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
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate))
        .limit(5);

    return {
        totalBalance,
        totalIncome,
        totalExpense,

        wallets: walletRows,

        recentTransactions,
    };
}