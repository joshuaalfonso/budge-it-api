import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
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

export const getMonthlyReport = async (userId: number, year?: number, month?: number) => {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // Format start and end date bounds for the SQL range query
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

    // 1. Summary Cards Query
    const summaryQuery = await db
        .select({
            totalIncome: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
            totalExpense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
            totalTransactions: count(transactions.id),
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        );

    const summary = summaryQuery[0];
    const savings = Number(summary.totalIncome) - Number(summary.totalExpense);

    // 2. Spending Trend (Daily Expenses)
    const dailySpending = await db
        .select({
            date: transactions.transactionDate,
            totalExpense: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, 'expense'),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        )
        .groupBy(transactions.transactionDate)
        .orderBy(transactions.transactionDate);

    // 3. Spending by Category
    const spendingByCategory = await db
        .select({
            categoryId: categories.id,
            categoryName: categories.name,
            icon: categories.icon,
            color: categories.color,
            total: sql<number>`coalesce(sum(${transactions.amount}), 0)`.as("total"), 
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, 'expense'),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        )
        .groupBy(categories.id, categories.name, categories.icon, categories.color)
        .orderBy(sql`total DESC`);

    return {
        filters: { year: targetYear, month: targetMonth },
        summary: {
            totalIncome: Number(summary.totalIncome),
            totalExpense: Number(summary.totalExpense),
            savings,
            totalTransactions: summary.totalTransactions,
        },
        dailySpending,
        spendingByCategory,
    };
}