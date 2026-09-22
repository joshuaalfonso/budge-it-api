import { Context } from "hono";
import { CategoryService } from "./category.service.js";

export const CategoryController = {

    async getCategories(c: Context) {
        const userId = await c.get("userId");
        
        if (!userId) {
            return c.json({ error: "userId is required" }, 400);
        }

        const data = await CategoryService.findAll(userId);
        return c.json(data);
    },

    async getCategory(c: Context) {
        const id = Number(c.req.param("id"));
        const category = await CategoryService.findById(id);
        
        if (!category) {
            return c.json({ error: "Category not found" }, 404);
        }
        return c.json(category);
    },

    async createCategory(c: Context) {
        const userId = await c.get("userId");
        const body = await c.req.json(); 
        const newCategory = await CategoryService.create(userId, body);
        
        return c.json({
            success: true,
            message: "Category updated successfully",
            data: newCategory
        }, 201);
    },

    async updateCategory(c: Context) {
        const id = Number(c.req.param("id"));
        const body = await c.req.json()
        
        const updatedCategory = await CategoryService.update(id, body);
        if (!updatedCategory) {
            return c.json({ error: "Category not found" }, 404);
        }
        
        return c.json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });
    },

    async deleteCategory(c: Context) {
        const id = Number(c.req.param("id"));
        await CategoryService.delete(id);
        return c.json({ success: true, message: "Category deleted successfully" });
    }

};