import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { settingController } from "./setting.controller.js";




export const settingRoute = new Hono();


settingRoute.delete(
    '/delete-transaction',
    authMiddleware,
    settingController.deleteAllTransaction
)

settingRoute.delete(
    '/delete-all-data',
    authMiddleware,
    settingController.deleteAllData
)