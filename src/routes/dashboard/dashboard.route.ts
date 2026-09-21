import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getDashboardController } from "./dashboard.controller.js";




export const dashboardRoute = new Hono();


dashboardRoute.get(
    '',
    authMiddleware,
    getDashboardController 
)