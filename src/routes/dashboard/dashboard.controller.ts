import type { Context } from "hono";
import { getDashboard } from "./dashboard.service.js";



export const getDashboardController = async (c: Context) => {
  const userId = await c.get("userId");

  try {

    const dashboard = await getDashboard(userId);

    return c.json(dashboard);
  } 

  catch (error) {
    console.log(error);
    return c.json({
        success: false,
        message: 'Something went wrong'
    }, 500)
  }
  
}