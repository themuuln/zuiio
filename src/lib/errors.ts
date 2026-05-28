/**
 * Base custom error for the application.
 * Extends Error with a machine-readable code and HTTP status code.
 *
 * Framework-agnostic — no Next.js imports. Use toApiErrorResponse() to
 * convert to a wire format, or let api-handler.ts construct the NextResponse.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
  }
}

// ── Framework-agnostic error response ─────────────────────────

export interface ApiErrorResponse {
  status: number;
  body: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
  headers?: Record<string, string>;
}

/**
 * Convert any error into a serializable API error response.
 * Framework-agnostic — returns a plain object, not a NextResponse.
 */
export function toApiErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      headers:
        error instanceof UnauthorizedError
          ? { "X-Auth-Required": "true" }
          : undefined,
    };
  }

  // Log the unexpected error server-side but never expose internals
  console.error("Unhandled API error:", error);

  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
  };
}
