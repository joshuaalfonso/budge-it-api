import type { Context } from "hono";
import { getDashboard, getMonthlyReport } from "./dashboard.service.js";



export const getDashboardController = async (c: Context) => {
  const userId = await c.get("userId");

  const dashboard = await getDashboard(userId);

  return c.json(dashboard);
}

export const getAnalyticsController = async (c: Context) => {
  const userId = c.get("userId");

  const analytics = await getMonthlyReport(userId);

  return c.json(analytics)
  
}