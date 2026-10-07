import type { Context } from "hono";
import { getDashboard, getMonthlyReport, getYearlyReport } from "./dashboard.service.js";



export const getDashboardController = async (c: Context) => {
  const userId = await c.get("userId");

  const dashboard = await getDashboard(userId);

  return c.json(dashboard);
}

export const getAnalyticsController = async (c: Context) => {
  const userId = c.get("userId");
  const { month, year } = c.req.query();

  const analytics = await getMonthlyReport(userId, +year, +month);

  return c.json(analytics)
  
}


export const getYearlyReportController = async (c: Context) => {
  const userId = c.get("userId");
  const { year } = c.req.query();

  const yearlyReports = await getYearlyReport(userId, +year);

  return c.json(yearlyReports)
}