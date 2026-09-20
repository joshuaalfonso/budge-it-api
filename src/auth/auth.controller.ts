import type { Context } from "hono";
import { createAccessToken, findOrCreateUser, verifyGoogleCredential } from "./auth.service.js";
import { setCookie } from "hono/cookie";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";


export const authGoogleController = async (c: Context) => {

    const { credential } = await c.req.json();

    try {

        const googleUser = await verifyGoogleCredential(
            credential
        ); 

        const user =
            await findOrCreateUser(googleUser);

        const token =
            await createAccessToken(user.id);

        setCookie(
            c,
            "access_token",
            token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            }
        );

        return c.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        });

    }

    catch (error) {
        console.error(error);

        return c.json(
            {
                message: "Authentication failed",
            },
            401
        );
    }

}


export const meController = async (c: Context) => {
    try {
        const userId = c.get("userId");

        console.log("User ID from context:", userId);

        const [user] = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                picture: usersTable.picture,
            })
            .from(usersTable)
            .where(eq(usersTable.id, Number(userId)))
            .limit(1);

        if (!user) {
            return c.json(
                { message: "User not found" },
                404
            );
        }

        return c.json({
            user,
        });

    } catch (error) {
        console.error(error);

        return c.json(
            { 
                message: "Something went wrong" 
            },
            500
        );
    }

};
