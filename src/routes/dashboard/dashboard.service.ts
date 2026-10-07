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

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;

    const lastDay = new Date(targetYear, targetMonth, 0).getDate();

    const endDate =
        `${targetYear}-${String(targetMonth).padStart(2, "0")}-${lastDay}`;

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

    const savings = totalIncome - totalExpense;

    const incomePercentage =
        previousIncome === 0
            ? null
            : ((totalIncome - previousIncome) / previousIncome) * 100;

    const expensePercentage =
        previousExpense === 0
            ? null
            : ((totalExpense - previousExpense) / previousExpense) * 100;

    const savingsPercentage =
        totalIncome === 0
            ? null
            : (savings / totalIncome) * 100;

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


    const spendingMap = new Map(
        rawSpending.map((row) => [
            new Date(row.date).toISOString().split("T")[0],
            Number(row.totalExpense),
        ])
    );

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

            incomePercentage,
            expensePercentage,

            savingsPercentage,
        },

        dailySpending,

        spendingByCategory,
    };
};

export const getYearlyReport = async (
    userId: number,
    year?: number
) => {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();

    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const rawMonthlySummary = await db
        .select({
            month: sql<number>`
                extract(month from ${transactions.transactionDate})
            `,

            totalIncome: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'income'
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            totalExpense: sql<number>`
                coalesce(
                    sum(
                        case
                            when ${transactions.type} = 'expense'
                            then ${transactions.amount}
                            else 0
                        end
                    ),
                    0
                )
            `,

            totalTransactions: sql<number>`
                count(${transactions.id})
            `,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                gte(transactions.transactionDate, startDate),
                lte(transactions.transactionDate, endDate)
            )
        )
        .groupBy(
            sql`extract(month from ${transactions.transactionDate})`
        )
        .orderBy(
            sql`extract(month from ${transactions.transactionDate})`
        );

    // Map months that actually have transactions
    const monthlyMap = new Map(
        rawMonthlySummary.map((row) => [
            Number(row.month),
            {
                totalIncome: Number(row.totalIncome),
                totalExpense: Number(row.totalExpense),
                totalTransactions: Number(row.totalTransactions),
            },
        ])
    );

    // ALWAYS return all 12 months
    const monthlySummary = Array.from(
        { length: 12 },
        (_, index) => {
            const month = index + 1;

            const data = monthlyMap.get(month) ?? {
                totalIncome: 0,
                totalExpense: 0,
                totalTransactions: 0,
            };

            return {
                month: new Date(2000, index).toLocaleString("en-US", {
                    month: "long",
                }),
                totalIncome: data.totalIncome,
                totalExpense: data.totalExpense,
                savings: data.totalIncome - data.totalExpense,
                totalTransactions: data.totalTransactions,
            };
        }
    );

    // Yearly totals
    const totalIncome = monthlySummary.reduce(
        (sum, month) => sum + month.totalIncome,
        0
    );

    const totalExpense = monthlySummary.reduce(
        (sum, month) => sum + month.totalExpense,
        0
    );

    const totalTransactions = monthlySummary.reduce(
        (sum, month) => sum + month.totalTransactions,
        0
    );

    const savings = totalIncome - totalExpense;

    const savingsPercentage =
        totalIncome === 0
            ? null
            : (savings / totalIncome) * 100;

    const spendingByCategory = await db
    .select({
        categoryId: categories.id,
        categoryName: categories.name,
        icon: categories.icon,
        color: categories.color,

        total: sql<number>`
            coalesce(
                sum(${transactions.amount}),
                0
            )
        `.as("total"),
    })
    .from(transactions)
    .innerJoin(
        categories,
        eq(
            transactions.categoryId,
            categories.id
        )
    )
    .where(
        and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(
                transactions.transactionDate,
                startDate
            ),
            lte(
                transactions.transactionDate,
                endDate
            )
        )
    )
    .groupBy(
        categories.id,
        categories.name,
        categories.icon,
        categories.color
    )
    .orderBy(sql`total DESC`);

    return {
        filters: {
            year: targetYear,
        },

        summary: {
            totalIncome,
            totalExpense,
            savings,
            totalTransactions,
            savingsPercentage,
        },

        monthlySummary,
        spendingByCategory
    };
};
