# Testing

Agent Gateway uses [Vitest](https://vitest.dev/) for testing with a three-tier test structure.

## Test Structure

```
tests/
├── unit/                    # Pure function tests, no I/O
│   ├── tokens.test.ts       # HMAC token creation/verification
│   ├── rate-limit.test.ts   # Sliding window rate limiter
│   ├── security.test.ts     # Security audit checks
│   └── sanitize.test.ts     # Input sanitization
├── integration/             # Tests with mocked external services
│   ├── tools.test.ts        # Tool execution against mocked Supabase
│   ├── audit.test.ts        # Audit logging wrapper
│   ├── link-code.test.ts    # Link code generation/redemption
│   └── session-budget.test.ts  # Session + budget interactions
├── e2e/                     # Full webhook flow tests
│   ├── webhook.test.ts      # Telegram webhook handler
│   └── link-routes.test.ts  # Link generation routes
└── scenarios/               # Complex multi-step scenarios
    ├── mongolian-language.test.ts  # Mongolian NLP edge cases
    └── org-owner-scenarios.test.ts # Org owner workflows
```

## Running Tests

```bash
pnpm test              # All tests
pnpm test:unit         # Unit only
pnpm test:integration  # Integration only
pnpm test:e2e          # End-to-end only
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

## Test Fixtures

Shared test utilities live in `tests/fixtures/`:

### `test-data-factory.ts`

Factory functions for creating test data:

```typescript
import { createMockLink, createMockSession, createMockToolContext } from "../fixtures/test-data-factory";

const link = createMockLink({ organization_id: "org-123" });
const session = createMockSession({ orgId: "org-123", chatId: 12345 });
const context = createMockToolContext({ orgId: "org-123" });
```

### `supabase-mock.ts`

Mock Supabase client for integration tests:

```typescript
import { createMockSupabase } from "../fixtures/supabase-mock";

const mock = createMockSupabase({
  "telegram_links": [{ id: "link-1", organization_id: "org-123", is_active: true }],
});
```

## Writing Unit Tests

Unit tests cover pure functions with no external dependencies:

```typescript
import { describe, it, expect } from "vitest";
import { createCompactToken, verifyCompactToken } from "@/lib/tokens";

describe("createCompactToken", () => {
  it("creates a token under 64 characters", () => {
    const token = createCompactToken("org-id", "user-id", "zer");
    expect(token.length).toBeLessThanOrEqual(64);
  });

  it("verifies a valid token", () => {
    const token = createCompactToken("org-id", "user-id", "zer");
    const result = verifyCompactToken(token);
    expect(result).not.toBeNull();
    expect(result?.orgId).toBe("org-id");
  });

  it("rejects an expired token", () => {
    // Test with a token that has already expired
    // ...
  });
});
```

## Writing Integration Tests

Integration tests use mocked Supabase but test real business logic:

```typescript
import { describe, it, expect, vi } from "vitest";
import { checkDailyBudget, recordUsageAtomic } from "@/state/budget";

describe("budget", () => {
  it("allows requests under daily limit", async () => {
    const mockSb = createMockSupabase({
      "agent_daily_spend": [{ tokens_used: 100_000 }],
    });

    const result = await checkDailyBudget(mockSb, "org-123");
    expect(result.allowed).toBe(true);
  });

  it("rejects requests over hard cap", async () => {
    const mockSb = createMockSupabase({
      "agent_daily_spend": [{ tokens_used: 1_000_001 }],
    });

    const result = await checkDailyBudget(mockSb, "org-123");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("хязгаар");
  });
});
```

## Writing E2E Tests

E2E tests simulate full webhook flows:

```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/telegram/webhook/route";

describe("webhook", () => {
  it("responds 200 to valid message", async () => {
    const request = new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "test-secret",
      },
      body: JSON.stringify({
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 12345, type: "private" },
          from: { id: 67890, first_name: "Test" },
          text: "/start",
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Conventions

- **Describe blocks** use the module or function name
- **Test names** describe the behavior, not the implementation: "rejects expired token" not "test verifyCompactToken with expired token"
- **One assertion per concept** — don't chain unrelated assertions
- **Mock at the boundary** — mock Supabase and external APIs, not internal functions
- **Use factories** — don't hardcode test data inline
- **Mongolian text** — test assertions on user-facing strings should check for Mongolian keywords
