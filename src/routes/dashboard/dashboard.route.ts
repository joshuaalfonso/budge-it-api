import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getAnalyticsController, getDashboardController } from "./dashboard.controller.js";
import { validate } from "../../middleware/zod.middleware.js";
import { monthlyReportQuerySchema } from "./dashboard.schema.js";




export const dashboardRoute = new Hono();


dashboardRoute.get(
    '',
    authMiddleware,
    getDashboardController 
)


dashboardRoute.get(
    '/analytics',
    authMiddleware,
    validate("param", monthlyReportQuerySchema),
    getAnalyticsController
)