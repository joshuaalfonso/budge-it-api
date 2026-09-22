import { Hono } from "hono";
import { CategoryController } from "./category.controller.js";
import { createCategorySchema, updateCategorySchema } from "./category.schema.js";
import { validate } from "../../middleware/zod.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const categoryRoutes = new Hono();

categoryRoutes.get(
  "/", 
  authMiddleware, 
  CategoryController.getCategories
);

categoryRoutes.get(
  "/:id",
  authMiddleware, 
  CategoryController.getCategory
);

categoryRoutes.post(
  "/",
  authMiddleware,
  validate("json", createCategorySchema),
  CategoryController.createCategory
);

categoryRoutes.patch(
  "/:id",
  authMiddleware,
  validate("json", updateCategorySchema),
  CategoryController.updateCategory
);

categoryRoutes.delete(
  "/:id",
  authMiddleware, 
  CategoryController.deleteCategory
);

export default categoryRoutes;