import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getAnalyticsController, getDashboardController, getYearlyReportController } from "./dashboard.controller.js";
import { validate } from "../../middleware/zod.middleware.js";
import { monthlyReportQuerySchema } from "./dashboard.schema.js";




export const dashboardRoute = new Hono();


dashboardRoute.get(
    '',
    authMiddleware,
    getDashboardController 
)


dashboardRoute.get(
    '/monthly-report',
    authMiddleware,
    validate("param", monthlyReportQuerySchema),
    getAnalyticsController
)

dashboardRoute.get(
    '/yearly-report',
    authMiddleware,
    validate("param", monthlyReportQuerySchema),
    getYearlyReportController
)