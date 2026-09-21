import { Hono } from "hono";
import { authGoogleController, logoutController, meController } from "./auth.controller.js";
import { validate } from "../middleware/zod.middleware.js";
import { googleCredentialSchema } from "./auth.schema.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


export const authRoute = new Hono();

authRoute.post(
    "/google",
    validate("json", googleCredentialSchema), 
    authGoogleController
);


authRoute.post(
    "/logout",
     authMiddleware,
     logoutController
)

authRoute.get(
    "/me",
    authMiddleware,
    meController
);

