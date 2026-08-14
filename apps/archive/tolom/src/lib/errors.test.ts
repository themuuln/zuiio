import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it("sets name, message, code, and statusCode", () => {
    const err = new AppError("Something broke", "custom_error", 500);
    expect(err.message).toBe("Something broke");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("custom_error");
    expect(err.name).toBe("AppError");
  });
});

describe("NotFoundError", () => {
  it("defaults statusCode to 404", () => {
    const err = new NotFoundError("Customer not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Customer not found");
  });
});

describe("ValidationError", () => {
  it("defaults statusCode to 400", () => {
    const err = new ValidationError("Name is required");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("ConflictError", () => {
  it("defaults statusCode to 409", () => {
    const err = new ConflictError("Phone already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("UnauthorizedError", () => {
  it("defaults statusCode to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Unauthorized");
  });
});

describe("ForbiddenError", () => {
  it("defaults statusCode to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});
