import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import "dotenv/config";

export const authMiddleware = async (
    c: Context,
    next: Next
) => {
    const token = getCookie(c, "access_token");

    if (!token) {
        return c.json(
            { message: "Unauthorized" },
            401
        );
    }

    try {

        console.log("JWT_SECRET:", process.env.JWT_SECRET!);
        const payload = await verify(
            token,
            process.env.JWT_SECRET!,
            "HS256",
        );
        

        if (!payload.sub) {
            return c.json(
                {
                    message: "Invalid token",
                },
                401
            );
        }

        console.log('ppayload' + payload)

        c.set("userId", payload.sub);

        await next();

    } catch(error) {
         console.error("JWT VERIFY ERROR:", error);

        return c.json(
            { message: "Invalid or expired token" },
            401
        );
    }
};
