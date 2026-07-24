import { describe, it, expect } from "vitest";
import {
  DISPLAY_NAME_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/lib/constants";

/**
 * Display name validation tests.
 * Names must be 2-20 characters, non-empty, not whitespace-only.
 */

function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Display name is required";
  }

  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
    return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters`;
  }

  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`;
  }

  // Check for whitespace-only after trimming (already handled above but just in case)
  if (/^\s*$/.test(name)) {
    return "Display name cannot be only whitespace";
  }

  return null;
}

/**
 * HTML sanitization for display names (XSS prevention).
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate a deterministic emoji avatar based on index.
 */
const AVATAR_EMOJIS = [
  "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🦄",
  "🐧", "🐥", "🦉", "🐺", "🦋", "🐝", "🐙", "🦑",
  "🐬", "🦈", "🐊", "🦕", "🦖", "🐳", "🦚", "🦜",
  "🐲", "🐉", "🦓", "🦍", "🐘", "🦛", "🦒", "🦘",
];

function assignAvatar(existingCount: number): string {
  return AVATAR_EMOJIS[existingCount % AVATAR_EMOJIS.length];
}

describe("display name validation", () => {
  it("rejects empty name", () => {
    expect(validateDisplayName("")).toBe("Display name is required");
    expect(validateDisplayName("   ")).toBe("Display name is required");
  });

  it("rejects name shorter than minimum length", () => {
    expect(validateDisplayName("A")).toBe(
      "Display name must be at least 2 characters"
    );
  });

  it("rejects whitespace-only name", () => {
    expect(validateDisplayName("   ")).toBe("Display name is required");
  });

  it("accepts name at minimum length", () => {
    expect(validateDisplayName("Al")).toBeNull();
  });

  it("accepts name at maximum length", () => {
    const name = "A".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(validateDisplayName(name)).toBeNull();
  });

  it("rejects name over maximum length", () => {
    const name = "A".repeat(DISPLAY_NAME_MAX_LENGTH + 1);
    expect(validateDisplayName(name)).toBe(
      `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`
    );
  });

  it("accepts valid name with leading/trailing spaces", () => {
    // trim handling
    expect(validateDisplayName("  Alex  ")).toBeNull();
  });

  it("accepts names with special characters", () => {
    expect(validateDisplayName("Alex-42")).toBeNull();
    expect(validateDisplayName("🐱‍💻Dev")).toBeNull();
  });
});

describe("HTML sanitization", () => {
  it("escapes <script> tags", () => {
    const sanitized = escapeHtml("<script>alert('xss')</script>");
    expect(sanitized).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
    // No raw script tags remain
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("</script>");
  });

  it("escapes HTML entities", () => {
    expect(escapeHtml("<b>bold</b>")).toBe("&lt;b&gt;bold&lt;/b&gt;");
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
    expect(escapeHtml("it's")).toBe("it&#039;s");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
    expect(escapeHtml("Alex")).toBe("Alex");
  });

  it("handles mixed content", () => {
    const input = "<img src=x onerror=alert(1)>";
    const sanitized = escapeHtml(input);
    expect(sanitized).not.toContain("<img");
    expect(sanitized).toContain("&lt;img");
  });
});

describe("emoji avatar assignment", () => {
  it("assigns first avatar to first player", () => {
    expect(assignAvatar(0)).toBe("🦊");
  });

  it("assigns second avatar to second player", () => {
    expect(assignAvatar(1)).toBe("🐼");
  });

  it("cycles through avatars", () => {
    const total = AVATAR_EMOJIS.length;
    expect(assignAvatar(total)).toBe("🦊"); // wraps around
    expect(assignAvatar(total + 1)).toBe("🐼");
  });

  it("assigns different avatars to different indices", () => {
    const assigned = new Set<string>();
    for (let i = 0; i < 10; i++) {
      assigned.add(assignAvatar(i));
    }
    // With 10 consecutive indices, we should get 10 unique avatars
    expect(assigned.size).toBe(10);
  });
});
