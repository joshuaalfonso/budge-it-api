import { z } from "zod";
import type { ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";

export const validate = <T extends keyof ValidationTargets>(
  target: T,
  schema: z.ZodType
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = z.flattenError(result.error);

      return c.json(
        {
          success: false,
          errors: errors.fieldErrors,
        },
        400
      );
    }
  });