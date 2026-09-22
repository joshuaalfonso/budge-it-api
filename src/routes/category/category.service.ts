import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories } from "../../db/schema.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";
import { HTTPException } from "hono/http-exception";

export const CategoryService = {

    async findAll(userId: number) {
        return await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));
    },

    async findById(id: number) {
        const result = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);
        return result[0] || null;
    },

    async create(userId: number, data: CreateCategoryInput) {

        if (!userId) {
            throw new HTTPException(409, { 
                message: `No user found` 
            });
        }

        const existing = await db
        .select()
        .from(categories)
        .where(
            and(
            eq(categories.name, data.name),
            eq(categories.userId, userId)
            )
        )
        .limit(1);

        if (existing.length > 0) {
            throw new HTTPException(409, { 
                message: `Category '${data.name}' already exists for this user` 
            });
        }

        const [result] = await db.insert(categories).values({...data, userId}).$returningId();
        return this.findById(result.id);
    },

    async update(id: number, data: UpdateCategoryInput) {
        await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id));
        return this.findById(id);
    },

    async delete(id: number) {
        await db.delete(categories).where(eq(categories.id, id));
        return { success: true };
    }

};