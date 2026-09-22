import { Hono } from "hono";
import { TransactionController } from "./transaction.controller.js";
import {
  createTransactionSchema,
  queryTransactionSchema,
} from "./transaction.schema.js";
import { validate } from "../../middleware/zod.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const transactionRoutes = new Hono();

transactionRoutes.get(
  "/",
  authMiddleware,
  validate("query", queryTransactionSchema),
  TransactionController.getTransactions
);

transactionRoutes.get(
    "/:id",  
    authMiddleware, 
    TransactionController.getTransaction
);

transactionRoutes.post(
  "/",
  authMiddleware, 
  validate("json", createTransactionSchema),
  TransactionController.createTransaction
);

transactionRoutes.delete(
    "/:id", 
    authMiddleware, 
    TransactionController.deleteTransaction
);

export default transactionRoutes;