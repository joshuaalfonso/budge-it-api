import { Hono } from "hono";
import { authGoogleController, meController } from "./auth.controller.js";
import { validate } from "../middleware/zod.middleware.js";
import { googleCredentialSchema } from "./auth.schema.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


export const authRoute = new Hono();

authRoute.post(
    "/google",
    validate("json", googleCredentialSchema), 
    authGoogleController
);

authRoute.get(
    "/me",
    authMiddleware,
    meController
);
