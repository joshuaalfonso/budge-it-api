import { Context } from "hono";
import { TransactionService } from "./transaction.service.js";

export const TransactionController = {
    async getTransactions(c: Context) {
        const query = c.req.valid("query" as never);
        const data = await TransactionService.findAll(query);
        return c.json({ success: true, data });
    },

    async getTransaction(c: Context) {
        const id = Number(c.req.param("id"));
        const data = await TransactionService.findById(id);
        return c.json({ success: true, data });
    },

    async createTransaction(c: Context) {
        const body = c.req.valid("json" as never);
        const userId = await c.get("userId");
        const data = await TransactionService.create(userId, body);
        return c.json({ success: true, data }, 201);
    },

    async deleteTransaction(c: Context) {
        const id = Number(c.req.param("id"));
        const userId = Number(c.get("userId"));
        
        await TransactionService.delete(id, userId);
        return c.json({ success: true, message: "Transaction deleted successfully" });
    },
};