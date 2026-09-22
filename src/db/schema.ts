import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, boolean, date } from "drizzle-orm/mysql-core";


export const usersTable = mysqlTable("users", {
    id: int("id").autoincrement().primaryKey(),

    googleId: varchar("google_id", {
        length: 255,
    }).notNull().unique(),

    email: varchar("email", {
        length: 255,
    }).notNull().unique(),

    name: varchar("name", {
        length: 255,
    }).notNull(),

    picture: text("picture"),

    role: varchar("role", {
        length: 50,
    }).notNull().default("user"),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});


export const wallets = mysqlTable("wallets", {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id),

    name: varchar("name", { length: 100 }).notNull(),

    type: mysqlEnum("type", [
        "cash",
        "e_wallet",
        "credit_card",
        "savings",
        "other",
    ]).notNull(),

    // currency: varchar("currency", { length: 3 })
    //     .notNull()
    //     .default("PHP"),

    initialBalance: decimal("initial_balance", {
        precision: 15,
        scale: 2,
    })
        .notNull()
        .default("0.00"),

    isActive: boolean("is_active")
        .notNull()
        .default(true),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});

export const categories = mysqlTable("categories", {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
        .references(() => usersTable.id),

    name: varchar("name", { length: 100 })
        .notNull(),

    type: mysqlEnum("type", [
        "income",
        "expense",
    ]).notNull(),

    icon: varchar("icon", { length: 50 }),

    color: varchar("color", { length: 20 }),

    isDefault: boolean("is_default")
        .notNull()
        .default(false),

    isActive: boolean("is_active")
        .notNull()
        .default(true),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});


export const transactions = mysqlTable("transactions", {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id),

    walletId: int("wallet_id")
        .notNull()
        .references(() => wallets.id),

    categoryId: int("category_id")
        .notNull()
        .references(() => categories.id),

    type: mysqlEnum("type", [
        "income",
        "expense",
    ]).notNull(),

    amount: decimal("amount", {
        precision: 15,
        scale: 2,
    }).notNull(),

    description: varchar("description", {
        length: 500,
    }),

    transactionDate: date("transaction_date", {
        mode: "string",
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});


export const transfers = mysqlTable("transfers", {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id),

    fromWalletId: int("from_wallet_id")
        .notNull()
        .references(() => wallets.id),

    toWalletId: int("to_wallet_id")
        .notNull()
        .references(() => wallets.id),

    amount: decimal("amount", {
        precision: 15,
        scale: 2,
    }).notNull(),

    description: varchar("description", {
        length: 500,
    }),

    transferDate: date("transfer_date")
        .notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});


