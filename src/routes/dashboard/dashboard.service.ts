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
        .orderBy(desc(transactions.createdAt))
        .limit(10);

    return {
        totalBalance,
        totalIncome,
        totalExpense,

        wallets: walletRows,

        recentTransactions,
    };
}

export const getMonthlyReport = async (
    userId: number,
    year?: number,
    month?: number
) => {
    const now = new Date();

    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // ============================================================
    // Current month
    // ============================================================

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;

    const lastDay = new Date(targetYear, targetMonth, 0).getDate();

    const endDate =
        `${targetYear}-${String(targetMonth).padStart(2, "0")}-${lastDay}`;


    // ============================================================
    // Previous month
    // ============================================================

    const previousDate = new Date(
        targetYear,
        targetMonth - 2,
        1
    );

    const previousYear = previousDate.getFullYear();
    const previousMonth = previousDate.getMonth() + 1;

    const previousStartDate =
        `${previousYear}-${String(previousMonth).padStart(2, "0")}-01`;

    const previousLastDay =
        new Date(previousYear, previousMonth, 0).getDate();

    const previousEndDate =
        `${previousYear}-${String(previousMonth).padStart(2, "0")}-${previousLastDay}`;


    // ============================================================
    // 1. Summary
    // Current + previous month in ONE query
    // ============================================================

    const summaryQuery = await db
        .select({
            // Current month income
            totalIncome: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'income'
                            and ${transactions.transactionDate} >= ${startDate}
                            and ${transactions.transactionDate} <= ${endDate}
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            // Current month expense
            totalExpense: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'expense'
                            and ${transactions.transactionDate} >= ${startDate}
                            and ${transactions.transactionDate} <= ${endDate}
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            // Previous month income
            previousIncome: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'income'
                            and ${transactions.transactionDate} >= ${previousStartDate}
                            and ${transactions.transactionDate} <= ${previousEndDate}
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            // Previous month expense
            previousExpense: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'expense'
                            and ${transactions.transactionDate} >= ${previousStartDate}
                            and ${transactions.transactionDate} <= ${previousEndDate}
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            // Only count transactions in the current month
            totalTransactions: sql<number>`
                count(
                    case
                        when ${transactions.transactionDate} >= ${startDate}
                        and ${transactions.transactionDate} <= ${endDate}
                        then ${transactions.id}
                    end
                )
            `,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),

                // Only scan previous + current month
                gte(transactions.transactionDate, previousStartDate),
                lte(transactions.transactionDate, endDate)
            )
        );

    const summary = summaryQuery[0];

    const totalIncome = Number(summary.totalIncome);
    const totalExpense = Number(summary.totalExpense);

    const previousIncome = Number(summary.previousIncome);
    const previousExpense = Number(summary.previousExpense);

    const totalTransactions = Number(summary.totalTransactions);


    // ============================================================
    // Savings
    // ============================================================

    const savings = totalIncome - totalExpense;


    // ============================================================
    // Percentage calculations
    // ============================================================

    // Income change compared to previous month
    const incomePercentage =
        previousIncome === 0
            ? null
            : ((totalIncome - previousIncome) / previousIncome) * 100;

    // Expense change compared to previous month
    const expensePercentage =
        previousExpense === 0
            ? null
            : ((totalExpense - previousExpense) / previousExpense) * 100;

    // Savings as % of income
    const savingsPercentage =
        totalIncome === 0
            ? null
            : (savings / totalIncome) * 100;


    // ============================================================
    // 2. Spending Trend (Daily Expenses)
    // ============================================================

    const rawSpending = await db
        .select({
            date: transactions.transactionDate,
            totalExpense: sql<number>`
                coalesce(sum(${transactions.amount}), 0)
            `,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, "expense"),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        )
        .groupBy(transactions.transactionDate);


    // Create quick lookup map
    const spendingMap = new Map(
        rawSpending.map((row) => [
            new Date(row.date).toISOString().split("T")[0],
            Number(row.totalExpense),
        ])
    );


    // ============================================================
    // Fill in days with zero spending
    // ============================================================

    const dailySpending = [];

    let curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
        const dateStr = curr.toISOString().split("T")[0];

        dailySpending.push({
            date: dateStr,
            totalExpense: spendingMap.get(dateStr) || 0,
        });

        curr.setDate(curr.getDate() + 1);
    }


    // ============================================================
    // 3. Spending by Category
    // ============================================================

    const spendingByCategory = await db
        .select({
            categoryId: categories.id,
            categoryName: categories.name,
            icon: categories.icon,
            color: categories.color,

            total: sql<number>`
                coalesce(sum(${transactions.amount}), 0)
            `.as("total"),
        })
        .from(transactions)
        .innerJoin(
            categories,
            eq(transactions.categoryId, categories.id)
        )
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, "expense"),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        )
        .groupBy(
            categories.id,
            categories.name,
            categories.icon,
            categories.color
        )
        .orderBy(sql`total DESC`);


    // ============================================================
    // Return
    // ============================================================

    return {
        filters: {
            year: targetYear,
            month: targetMonth,
        },

        summary: {
            totalIncome,
            totalExpense,
            savings,
            totalTransactions,

            // Compared to previous month
            incomePercentage,
            expensePercentage,

            // Savings / income
            savingsPercentage,
        },

        dailySpending,

        spendingByCategory,
    };
};