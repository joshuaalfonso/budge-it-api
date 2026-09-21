import { Hono } from "hono";
import { createWalletController, deleteWalletController, getWalletController, getWalletsController, updateWalletController } from "./wallet.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/zod.middleware.js";
import { querySchema } from "../../schema/param.schema.js";


export const walletRoute = new Hono();

walletRoute.get(
    '',
    authMiddleware,
    getWalletsController
)

walletRoute.get(
    '/:id',
    authMiddleware,
    validate("param", querySchema),
    getWalletController
)

walletRoute.post(
    '',
    authMiddleware,
    createWalletController
)

walletRoute.put(
    ':/id',
    authMiddleware,
    validate("param", querySchema),
    updateWalletController
)

walletRoute.delete(
    ':/id',
    authMiddleware,
    validate("param", querySchema),
    deleteWalletController
)