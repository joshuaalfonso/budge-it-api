import type { Context } from "hono";
import { SettingService } from "./settings.service.js";


export const settingController = {

    async deleteAllTransaction (c: Context) {
        const userId = Number(c.get("userId")) ?? 0;
        await SettingService.deleteAllTransaction(userId);
        return c.json({
            success: true,
            message: "All transactions deleted successfully",
        }, 200);
    },

    async deleteAllData(c: Context) {
        const userId = Number(c.get("userId")) ?? 0;
        await SettingService.deleteAllData(userId);
        return c.json({
            success: true,
            message: "All your budget data has been deleted ",
        }, 200);
    }


}