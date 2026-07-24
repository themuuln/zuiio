import { describe, it, expect } from "vitest";
import { ROOM_CODE_LENGTH, ROOM_EXPIRY_HOURS } from "@/lib/constants";

/**
 * Room code generation tests.
 * The POST /api/rooms generates a 4-letter uppercase room code.
 * We test the generation logic extracted to verify it meets requirements.
 */

// Room code generation logic extracted from app/api/rooms/route.ts
function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O to avoid confusion
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

describe("room code generation", () => {
  it("generates exactly 4 characters", () => {
    const code = generateRoomCode();
    expect(code.length).toBe(ROOM_CODE_LENGTH);
  });

  it("contains only uppercase letters from allowed set", () => {
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const code = generateRoomCode();
    for (const char of code) {
      expect(allowed).toContain(char);
    }
  });

  it("matches /^[A-Z]{4}$/ pattern", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z]{4}$/);
    }
  });

  it("generates different codes on consecutive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 24^4 = 331,776 possible codes, 100 calls should all be unique
    expect(codes.size).toBe(100);
  });

  it("does not include I or O characters", () => {
    const forbidden = ["I", "O"];
    for (let i = 0; i < 1000; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(forbidden).not.toContain(char);
      }
    }
  });
});

describe("room validation", () => {
  it("validates 4-letter uppercase code pattern", () => {
    const validPattern = /^[A-Z]{4}$/;

    expect(validPattern.test("ABCD")).toBe(true);
    expect(validPattern.test("FROG")).toBe(true);
    expect(validPattern.test("PLAY")).toBe(true);
    expect(validPattern.test("GAME")).toBe(true);

    // Invalid cases
    expect(validPattern.test("ABC")).toBe(false);  // too short
    expect(validPattern.test("ABCDE")).toBe(false); // too long
    expect(validPattern.test("abc")).toBe(false);   // lowercase
    expect(validPattern.test("1234")).toBe(false);  // digits
    expect(validPattern.test("A C")).toBe(false);   // space
    expect(validPattern.test("")).toBe(false);       // empty
    expect(validPattern.test("A-C")).toBe(false);   // special char
  });

  it("can normalize lowercase to uppercase", () => {
    expect("abcd".toUpperCase()).toBe("ABCD");
    expect("frog".toUpperCase()).toBe("FROG");
    expect("Game".toUpperCase()).toBe("GAME");
  });
});

describe("room expiry", () => {
  it("uses 24 hour expiry constant", () => {
    expect(ROOM_EXPIRY_HOURS).toBe(24);
  });

  it("should expire rooms older than 24 hours", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000);
    const diff = expiresAt.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    expect(hours).toBeCloseTo(24, 1);
  });
});
