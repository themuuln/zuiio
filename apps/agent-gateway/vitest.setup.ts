/**
 * Vitest setup — sets env vars and mocks Next.js server-only modules.
 */
import { vi } from "vitest";

// Mock `server-only` so Vitest can import Next.js server modules.
// In tests, `server-only` is a no-op — we never run server code in test.
vi.mock("server-only", () => ({}));

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.TOKEN_SIGNING_SECRET = "test-secret-for-unit-tests-2026";
process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret-2026";
process.env.TELEGRAM_BOT_TOKEN = "123456:test-bot-token";
process.env.TELEGRAM_BOT_USERNAME = "test_bot";
process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
process.env.SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJtest-service-role-key";
