import type { Context } from "hono";
import { getDashboard } from "./dashboard.service.js";



export const getDashboardController = async (c: Context) => {
  const userId = await c.get("userId");

  const dashboard = await getDashboard(userId);

  return c.json(dashboard);
}