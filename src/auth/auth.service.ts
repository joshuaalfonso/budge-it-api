import { OAuth2Client } from "google-auth-library";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { sign } from "hono/utils/jwt/jwt";

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export async function verifyGoogleCredential(
    credential: string
) {
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error("Invalid Google credential");
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
}

export const findOrCreateUser = async (
    googleUser: {
        googleId: string;
        email: string | undefined;
        name: string | undefined ;
        picture: string | undefined;
    }
) => {
    const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.googleId, googleUser.googleId))
        .limit(1);

    if (existingUser.length > 0) {
        return existingUser[0];
    }

    const insertedUser = await db
        .insert(usersTable)
        .values({
            googleId: googleUser.googleId,
            email: googleUser.email ?? '',
            name: googleUser.name ?? '',
            picture: googleUser.picture,
        });

    const userId = insertedUser[0].insertId;

    const [newUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, Number(userId)))
        .limit(1);

    if (!newUser) {
        throw new Error("Failed to create user");
    }

    return newUser;
};


export const createAccessToken = async (
    userId: number
) => {
    const now = Math.floor(Date.now() / 1000);

    return sign(
        {
            sub: String(userId),
            iat: now,
            exp: now + 60 * 60 * 24 * 7,
        },
        process.env.JWT_SECRET!
    );
};