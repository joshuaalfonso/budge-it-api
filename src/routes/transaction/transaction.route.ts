import { Hono } from "hono";
import { TransactionController } from "./transaction.controller.js";
import {
  createTransactionSchema,
  paramTransactionSchema,
  queryTransactionSchema,
  updateTransactionSchema,
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
    validate("param", paramTransactionSchema),
    TransactionController.getTransaction
);

transactionRoutes.post(
  "/",
  authMiddleware, 
  validate("json", createTransactionSchema),
  TransactionController.createTransaction
);

transactionRoutes.patch(
  "/:id",
  authMiddleware, 
  validate("json", updateTransactionSchema),
  validate("param", paramTransactionSchema),
  TransactionController.updateTransaction
);

transactionRoutes.delete(
    "/:id", 
    authMiddleware, 
    validate("param", paramTransactionSchema),
    TransactionController.deleteTransaction
);

export default transactionRoutes;