import { mysqlTable, int, varchar, text, timestamp } from "drizzle-orm/mysql-core";


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