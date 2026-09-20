import { z } from "zod";



export const googleCredentialSchema = z.object({
    credential: z
        .string()
        .min(1, "Credential is required"),
});

export type GoogleCredentialInput =
    z.infer<typeof googleCredentialSchema>;
