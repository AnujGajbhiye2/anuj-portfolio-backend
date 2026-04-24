import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

// Generic middleware factory — wraps any Zod schema into an Express middleware.
//
// Usage in a router:
//   router.post('/contact', validate(contactSchema), contactHandler);
//
// On success: req.body is replaced with the parsed + coerced Zod output.
// On failure: returns 400 with field-level errors (no stack trace, no 500).
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        // flatten() gives { fieldErrors: { field: [messages] }, formErrors: [] }
        issues: result.error.flatten().fieldErrors,
        requestId: req.id,
      });
      return;
    }

    // Replace body with the parsed output — coercions and defaults are applied
    req.body = result.data;
    next();
  };
}
