import { Hono } from "hono";
import { createWalletController, deleteWalletController, getWalletController, getWalletsController, updateWalletController } from "./wallet.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/zod.middleware.js";
import { querySchema } from "../../schema/param.schema.js";
import { walletRequest } from "./wallet.schema.js";


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
    validate("json", walletRequest),
    createWalletController
)

walletRoute.put(
    '/:id',
    authMiddleware,
    validate("param", querySchema),
    validate("json", walletRequest),
    updateWalletController
)

walletRoute.delete(
    '/:id',
    authMiddleware,
    validate("param", querySchema),
    deleteWalletController
)