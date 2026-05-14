import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toApiError,
} from "./errors";

describe("AppError", () => {
  it("sets name, message, and status", () => {
    const err = new AppError("Something broke", 500, "custom_error");
    expect(err.message).toBe("Something broke");
    expect(err.status).toBe(500);
    expect(err.code).toBe("custom_error");
    expect(err.name).toBe("AppError");
  });
});

describe("NotFoundError", () => {
  it("defaults status to 404", () => {
    const err = new NotFoundError("Customer not found");
    expect(err.status).toBe(404);
    expect(err.code).toBe("not_found");
    expect(err.message).toBe("Customer not found");
  });
});

describe("ValidationError", () => {
  it("defaults status to 422", () => {
    const err = new ValidationError("Name is required");
    expect(err.status).toBe(422);
    expect(err.code).toBe("validation_error");
    expect(err.message).toBe("Name is required");
  });
});

describe("ConflictError", () => {
  it("defaults status to 409", () => {
    const err = new ConflictError("Phone already exists");
    expect(err.status).toBe(409);
    expect(err.code).toBe("conflict");
  });
});

describe("UnauthorizedError", () => {
  it("defaults status to 401", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe("unauthorized");
    expect(err.message).toBe("Authentication required");
  });
});

describe("ForbiddenError", () => {
  it("defaults status to 403", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.code).toBe("forbidden");
  });
});

describe("toApiError", () => {
  it("returns structured error for AppError instances", () => {
    const result = toApiError(new ValidationError("Bad input"));
    expect(result).toEqual({
      error: {
        message: "Bad input",
        code: "validation_error",
      },
    });
  });

  it("returns generic internal error for non-AppErrors", () => {
    const result = toApiError(new Error("Raw crash"));
    expect(result).toEqual({
      error: {
        message: "Internal server error",
        code: "internal_error",
      },
    });
  });
});
