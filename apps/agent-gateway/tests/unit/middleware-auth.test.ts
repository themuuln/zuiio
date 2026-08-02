import { describe, expect, it, vi } from "vitest";
import { createSessionValue } from "@/middleware";

vi.mock("server-only", () => ({}));

describe("dashboard middleware auth", () => {
	it("produces a deterministic session value for a secret", async () => {
		const a = await createSessionValue("secret-1");
		const b = await createSessionValue("secret-1");
		expect(a).toBe(b);
		expect(a.startsWith("v1:")).toBe(true);
	});

	it("produces different values for different secrets", async () => {
		const a = await createSessionValue("secret-1");
		const b = await createSessionValue("secret-2");
		expect(a).not.toBe(b);
	});

	it("session value does not contain the raw secret", async () => {
		const value = await createSessionValue("super-secret-value");
		expect(value).not.toContain("super-secret-value");
	});
});
