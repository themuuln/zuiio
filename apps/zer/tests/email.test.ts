import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// ─── Module mocks (must be registered BEFORE importing email.ts) ─────

// nodemailer — track createTransport calls and sendMail
const sendMailMock = mock.fn(async () => ({ messageId: "test-123" }));
const createTransportMock = mock.fn(() => ({
  sendMail: sendMailMock,
}));
(mock.module as (specifier: string, opts: Record<string, unknown>) => void)(
  "nodemailer",
  { exports: { createTransport: createTransportMock } },
);

// server-only
mockMod("server-only", {});

// capture
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

// reports — needed for generateDailyReportHtml (used by sendDailyReportEmail)
const getFinancialSummaryMock = mock.fn(async () => ({
  sales: 100000,
  expenses: 50000,
  profit: 50000,
}));
const getPendingSalesMock = mock.fn(async () => []);
const getProductSalesBreakdownMock = mock.fn(async () => []);
const getStockMovementsSummaryMock = mock.fn(async () => ({
  incoming: 10,
  outgoing: 5,
}));
mockMod("@/lib/reports", {
  getFinancialSummary: getFinancialSummaryMock,
  getPendingSales: getPendingSalesMock,
  getProductSalesBreakdown: getProductSalesBreakdownMock,
  getStockMovementsSummary: getStockMovementsSummaryMock,
});

// format
mockMod("@/lib/format", {
  formatCurrency: mock.fn((n: number | null | undefined) => {
    if (n == null || Number.isNaN(n)) return "₮0";
    return `₮${n.toLocaleString()}`;
  }),
});

// validation
mockMod("@/lib/validation", {
  escapeHtml: mock.fn((s: string) => s),
});

// supabase types
mockMod("@/lib/supabase/types", {});

// supabase server
mockMod("@/lib/supabase/server", {
  createClient: mock.fn(),
});

// ─── Dynamic import helper (must be called after mocks are registered) ─
// Exception: test mocking requires import AFTER mock.module registration.
// eslint-disable-next-line ts/no-dynamic-import

let emailMod: {
  getActiveSmtpConfig: typeof import("@/lib/email").getActiveSmtpConfig;
  createTransporter: typeof import("@/lib/email").createTransporter;
  sendEmail: typeof import("@/lib/email").sendEmail;
  sendDailyReportEmail: typeof import("@/lib/email").sendDailyReportEmail;
  logEmailResult: typeof import("@/lib/email").logEmailResult;
};

async function loadEmailModule() {
  if (!emailMod) {
    // eslint-disable-next-line ts/no-dynamic-import
    emailMod = await import("@/lib/email");
  }
  return emailMod;
}

// ─── Shared mock Supabase builder ────────────────────────────────────

let mockSmtpResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

function makeSupabase() {
  const rpcMock = mock.fn(async () => ({ error: null }));
  const insertMock = mock.fn(async () => ({ error: null }));
  const fromMock = mock.fn((table: string) => {
    if (table === "smtp_configs") {
      return {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            order: mock.fn(() => ({
              limit: mock.fn(() => ({
                maybeSingle: mock.fn(async () => mockSmtpResult),
              })),
            })),
          })),
        })),
      };
    }
    if (table === "report_email_log") {
      return {
        insert: insertMock,
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from: fromMock,
    rpc: rpcMock,
    _insertMock: insertMock,
    _rpcMock: rpcMock,
  };
}

function resetMocks() {
  mockSmtpResult = { data: null, error: null };
  createTransportMock.mock.resetCalls();
  createTransportMock.mock.mockImplementation(() => ({
    sendMail: sendMailMock,
  }));
  sendMailMock.mock.resetCalls();
  sendMailMock.mock.mockImplementation(async () => ({ messageId: "test-123" }));
  captureMock.mock.resetCalls();
  getFinancialSummaryMock.mock.resetCalls();
  getFinancialSummaryMock.mock.mockImplementation(async () => ({
    sales: 100000,
    expenses: 50000,
    profit: 50000,
  }));
  getPendingSalesMock.mock.resetCalls();
  getPendingSalesMock.mock.mockImplementation(async () => []);
  getProductSalesBreakdownMock.mock.resetCalls();
  getProductSalesBreakdownMock.mock.mockImplementation(async () => []);
  getStockMovementsSummaryMock.mock.resetCalls();
  getStockMovementsSummaryMock.mock.mockImplementation(async () => ({
    incoming: 10,
    outgoing: 5,
  }));
}

// ─── Helper to build a SmtpConfig-like object ────────────────────────

function smtpConfig(overrides?: Record<string, unknown>) {
  return {
    id: "cfg-1",
    host: "smtp.example.com",
    port: 587,
    username: "user@example.com",
    password: "secret123",
    from_email: "sender@example.com",
    from_name: "Test Sender",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// getActiveSmtpConfig
// ═══════════════════════════════════════════════════════════════════════

test("getActiveSmtpConfig returns null when no config found", async () => {
  resetMocks();
  mockSmtpResult = { data: null, error: null };
  const sb = makeSupabase();
  const { getActiveSmtpConfig } = await loadEmailModule();

  const result = await getActiveSmtpConfig(sb as never);

  assert.equal(result.data, null);
  assert.equal(captureMock.mock.callCount(), 0);
});

test("getActiveSmtpConfig returns config when found", async () => {
  resetMocks();
  const rawRow = {
    id: "cfg-1",
    host: "smtp.example.com",
    port: 587,
    username: "user@example.com",
    password: "secret123",
    from_email: "sender@example.com",
    from_name: "Test Sender",
    priority: 10,
    is_active: true,
  };
  mockSmtpResult = { data: rawRow, error: null };
  const sb = makeSupabase();
  const { getActiveSmtpConfig } = await loadEmailModule();

  const result = await getActiveSmtpConfig(sb as never);

  assert.notEqual(result.data, null);
  assert.equal(result.data!.id, "cfg-1");
  assert.equal(result.data!.host, "smtp.example.com");
  assert.equal(result.data!.port, 587);
  assert.equal(result.data!.username, "user@example.com");
  assert.equal(result.data!.password, "secret123");
  assert.equal(result.data!.from_email, "sender@example.com");
  assert.equal(result.data!.from_name, "Test Sender");
  assert.equal(captureMock.mock.callCount(), 0);
});

test("getActiveSmtpConfig captures error when query fails", async () => {
  resetMocks();
  const dbError = new Error("DB connection lost");
  mockSmtpResult = { data: null, error: dbError };
  const sb = makeSupabase();
  const { getActiveSmtpConfig } = await loadEmailModule();

  const result = await getActiveSmtpConfig(sb as never);

  assert.equal(result.data, null);
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(captureMock.mock.calls[0].arguments[0], dbError);
});

// ═══════════════════════════════════════════════════════════════════════
// createTransporter
// ═══════════════════════════════════════════════════════════════════════

test("createTransporter calls nodemailer.createTransport with correct config", async () => {
  resetMocks();
  const config = smtpConfig();
  const { createTransporter } = await loadEmailModule();

  createTransporter(config);

  assert.equal(createTransportMock.mock.callCount(), 1);
  const callArgs = createTransportMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.host, "smtp.example.com");
  assert.equal(callArgs.port, 587);
  assert.equal(callArgs.secure, false); // port 587 → secure: false
  assert.equal(callArgs.auth.user, "user@example.com");
  assert.equal(callArgs.auth.pass, "secret123");
});

test("createTransporter sets secure=true for port 465", async () => {
  resetMocks();
  const config = smtpConfig({ port: 465 });
  const { createTransporter } = await loadEmailModule();

  createTransporter(config);

  const callArgs = createTransportMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.secure, true);
  assert.equal(callArgs.port, 465);
});

test("createTransporter sets secure=false for port 587", async () => {
  resetMocks();
  const config = smtpConfig({ port: 587 });
  const { createTransporter } = await loadEmailModule();

  createTransporter(config);

  const callArgs = createTransportMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.secure, false);
  assert.equal(callArgs.port, 587);
});

// ═══════════════════════════════════════════════════════════════════════
// sendEmail
// ═══════════════════════════════════════════════════════════════════════

test("sendEmail returns error when no SMTP config found and none provided", async () => {
  resetMocks();
  mockSmtpResult = { data: null, error: null };
  const sb = makeSupabase();
  const { sendEmail } = await loadEmailModule();

  const result = await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "Test",
    html: "<p>Hello</p>",
  });

  assert.equal(result.success, false);
  assert.match(result.error!, /SMTP/);
  assert.equal(sendMailMock.mock.callCount(), 0);
});

test("sendEmail sends successfully with provided config", async () => {
  resetMocks();
  const sb = makeSupabase();
  const config = smtpConfig();
  const { sendEmail } = await loadEmailModule();

  const result = await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "Test Subject",
    html: "<p>Hello</p>",
    smtpConfig: config,
  });

  assert.equal(result.success, true);
  assert.equal(sendMailMock.mock.callCount(), 1);
  const mailOptions = sendMailMock.mock.calls[0].arguments[0];
  assert.equal(mailOptions.to, "recipient@example.com");
  assert.equal(mailOptions.subject, "Test Subject");
  assert.equal(mailOptions.html, "<p>Hello</p>");
  // from_name is present → from includes both name and email
  assert.equal(mailOptions.from, '"Test Sender" <sender@example.com>');
});

test("sendEmail sends successfully with auto-selected config", async () => {
  resetMocks();
  const config = smtpConfig();
  mockSmtpResult = {
    data: { ...config, priority: 10, is_active: true },
    error: null,
  };
  const sb = makeSupabase();
  const { sendEmail } = await loadEmailModule();

  const result = await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "Auto Config Test",
    html: "<p>Auto</p>",
  });

  assert.equal(result.success, true);
  assert.equal(sendMailMock.mock.callCount(), 1);
});

test("sendEmail returns error when nodemailer throws", async () => {
  resetMocks();
  const sb = makeSupabase();
  const config = smtpConfig();
  sendMailMock.mock.mockImplementation(async () => {
    throw new Error("Connection refused");
  });
  const { sendEmail } = await loadEmailModule();
  const result = await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "Fail Test",
    html: "<p>Fail</p>",
    smtpConfig: config,
  });
  assert.equal(result.success, false);
  assert.match(result.error!, /Connection refused/);
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(
    captureMock.mock.calls[0].arguments[0].message,
    "Connection refused",
  );
});

test("sendEmail calls increment_smtp_count RPC on success", async () => {
  resetMocks();
  const sb = makeSupabase();
  const config = smtpConfig();
  const { sendEmail } = await loadEmailModule();

  await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "RPC Test",
    html: "<p>RPC</p>",
    smtpConfig: config,
  });

  assert.equal(sb._rpcMock.mock.callCount(), 1);
  assert.equal(sb._rpcMock.mock.calls[0].arguments[0], "increment_smtp_count");
  assert.deepEqual(sb._rpcMock.mock.calls[0].arguments[1], {
    config_id: "cfg-1",
  });
});

test("sendEmail uses from_email only when from_name is null", async () => {
  resetMocks();
  const sb = makeSupabase();
  const config = smtpConfig({ from_name: null });
  const { sendEmail } = await loadEmailModule();

  await sendEmail(sb as never, {
    to: "recipient@example.com",
    subject: "No Name",
    html: "<p>No name</p>",
    smtpConfig: config,
  });

  const mailOptions = sendMailMock.mock.calls[0].arguments[0];
  assert.equal(mailOptions.from, "sender@example.com");
});

// ═══════════════════════════════════════════════════════════════════════
// sendDailyReportEmail
// ═══════════════════════════════════════════════════════════════════════

test("sendDailyReportEmail generates HTML and sends email", async () => {
  resetMocks();
  const config = smtpConfig();
  mockSmtpResult = {
    data: { ...config, priority: 10, is_active: true },
    error: null,
  };
  const sb = makeSupabase();
  const { sendDailyReportEmail } = await loadEmailModule();
  const result = await sendDailyReportEmail(
    sb as never,
    "org-1",
    "Test Company",
    "boss@test.mn",
  );
  assert.equal(
    result.success,
    true,
    `sendDailyReportEmail failed: ${result.error}`,
  );
  assert.equal(getFinancialSummaryMock.mock.callCount(), 1);
  assert.equal(getPendingSalesMock.mock.callCount(), 1);
  assert.equal(getProductSalesBreakdownMock.mock.callCount(), 1);
  assert.equal(getStockMovementsSummaryMock.mock.callCount(), 1);
  assert.equal(sendMailMock.mock.callCount(), 1);
  assert.equal(sb._insertMock.mock.callCount(), 1);
  assert.equal(sb._insertMock.mock.calls[0].arguments[0].status, "sent");
});

test("sendDailyReportEmail logs failure when sendEmail fails", async () => {
  resetMocks();
  // No SMTP config → sendEmail returns error
  mockSmtpResult = { data: null, error: null };
  const sb = makeSupabase();
  const { sendDailyReportEmail } = await loadEmailModule();

  const result = await sendDailyReportEmail(
    sb as never,
    "org-1",
    "Test Company",
    "boss@test.mn",
  );

  assert.equal(result.success, false);
  assert.equal(sb._insertMock.mock.callCount(), 1);
  const logPayload = sb._insertMock.mock.calls[0].arguments[0];
  assert.equal(logPayload.status, "failed");
  assert.equal(logPayload.organization_id, "org-1");
  assert.equal(logPayload.recipient_email, "boss@test.mn");
});

test("sendDailyReportEmail captures exception and returns error", async () => {
  resetMocks();
  getFinancialSummaryMock.mock.mockImplementation(async () => {
    throw new Error("Reports service down");
  });
  const sb = makeSupabase();
  const { sendDailyReportEmail } = await loadEmailModule();
  const result = await sendDailyReportEmail(
    sb as never,
    "org-1",
    "Test Company",
    "boss@test.mn",
  );
  assert.match(result.error!, /Reports service down/);
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(sb._insertMock.mock.callCount(), 1);
  assert.equal(sb._insertMock.mock.calls[0].arguments[0].status, "failed");
});

test("logEmailResult inserts with correct fields for sent status", async () => {
  resetMocks();
  const sb = makeSupabase();
  const date = new Date("2025-03-15T10:00:00Z");
  const { logEmailResult } = await loadEmailModule();

  await logEmailResult(
    sb as never,
    "org-1",
    "user@test.mn",
    date,
    "sent",
    undefined,
    "cfg-1",
  );

  assert.equal(sb._insertMock.mock.callCount(), 1);
  const payload = sb._insertMock.mock.calls[0].arguments[0];
  assert.equal(payload.organization_id, "org-1");
  assert.equal(payload.recipient_email, "user@test.mn");
  assert.equal(payload.report_date, "2025-03-15");
  assert.equal(payload.status, "sent");
  assert.ok(payload.sent_at, "sent_at should be set for sent status");
  assert.equal(payload.smtp_config_id, "cfg-1");
  assert.equal(payload.error_message, undefined);
});

test("logEmailResult inserts with error_message for failed status", async () => {
  resetMocks();
  const sb = makeSupabase();
  const date = new Date("2025-03-15T10:00:00Z");
  const { logEmailResult } = await loadEmailModule();

  await logEmailResult(
    sb as never,
    "org-1",
    "user@test.mn",
    date,
    "failed",
    "SMTP connection timeout",
  );

  const payload = sb._insertMock.mock.calls[0].arguments[0];
  assert.equal(payload.status, "failed");
  assert.equal(payload.error_message, "SMTP connection timeout");
  assert.equal(payload.sent_at, undefined);
  assert.equal(payload.smtp_config_id, undefined);
});

test("logEmailResult captures error when insert fails", async () => {
  resetMocks();
  const insertErrorMock = mock.fn(async () => ({
    error: new Error("RLS policy violation"),
  }));
  const sb = {
    from: mock.fn(() => ({
      insert: insertErrorMock,
    })),
    rpc: mock.fn(),
  };
  const { logEmailResult } = await loadEmailModule();

  await logEmailResult(
    sb as never,
    "org-1",
    "user@test.mn",
    new Date("2025-03-15"),
    "sent",
  );

  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(
    (captureMock.mock.calls[0].arguments[0] as Error).message,
    "RLS policy violation",
  );
});
