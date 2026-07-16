import assert from "node:assert/strict";
import test, { mock } from "node:test";

// ─── sendWithRetry (mirrors src/app/api/cron/daily-report/route.ts) ─────────
// Delay is injected so tests never hit real wall-clock timers.

async function sendWithRetry(
  fn: () => Promise<void>,
  maxRetries = 2,
  _label = "send",
  { delay }: { delay: (ms: number) => Promise<void> } = {
    delay: () => Promise.resolve(),
  },
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      return true;
    } catch {
      if (attempt === maxRetries) return false;
      await delay(1000 * (attempt + 1));
    }
  }
  return false;
}

// ─── Email fallback decision logic (mirrors the cron handler pattern) ────────

interface OrgEmailConfig {
  id: string;
  name: string;
  report_email_recipient?: string | null;
}

interface FallbackResult {
  telegramOk: boolean;
  emailSent: boolean;
  errors: unknown[];
}

async function handleEmailFallback(
  org: OrgEmailConfig,
  sendTelegram: () => Promise<void>,
  sendEmail: (recipient: string) => Promise<void>,
): Promise<FallbackResult> {
  const errors: unknown[] = [];
  let telegramOk = false;

  try {
    await sendTelegram();
    telegramOk = true;
  } catch (err) {
    errors.push(err);
  }

  if (!telegramOk) {
    if (org.report_email_recipient) {
      try {
        await sendEmail(org.report_email_recipient);
      } catch (err) {
        errors.push(err);
      }
    }
  }

  return {
    telegramOk,
    emailSent: !telegramOk && !!org.report_email_recipient,
    errors,
  };
}

// ─── SMTP gate (mirrors the cron handler's smtp config check) ───────────────

async function shouldSendEmails(
  getSmtpConfig: () => Promise<{ data: unknown }>,
): Promise<boolean> {
  const config = await getSmtpConfig();
  return !!config.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. sendWithRetry
// ═══════════════════════════════════════════════════════════════════════════════

test("sendWithRetry returns true on first attempt", async () => {
  const fn = mock.fn(async () => {});
  const result = await sendWithRetry(fn);
  assert.equal(result, true);
  assert.equal(fn.mock.callCount(), 1);
});

test("sendWithRetry returns true when second attempt succeeds", async () => {
  let calls = 0;
  const fn = mock.fn(async () => {
    calls++;
    if (calls === 1) throw new Error("transient");
  });
  const result = await sendWithRetry(fn);
  assert.equal(result, true);
  assert.equal(fn.mock.callCount(), 2);
});

test("sendWithRetry returns true when third attempt succeeds", async () => {
  let calls = 0;
  const fn = mock.fn(async () => {
    calls++;
    if (calls <= 2) throw new Error("transient");
  });
  const result = await sendWithRetry(fn);
  assert.equal(result, true);
  assert.equal(fn.mock.callCount(), 3);
});

test("sendWithRetry returns false when all attempts fail", async () => {
  const fn = mock.fn(async () => {
    throw new Error("permanent");
  });
  const result = await sendWithRetry(fn);
  assert.equal(result, false);
  // maxRetries=2 → 3 total attempts (0, 1, 2)
  assert.equal(fn.mock.callCount(), 3);
});

test("sendWithRetry respects custom maxRetries", async () => {
  const fn = mock.fn(async () => {
    throw new Error("fail");
  });
  const result = await sendWithRetry(fn, 0); // only 1 attempt
  assert.equal(result, false);
  assert.equal(fn.mock.callCount(), 1);
});

test("sendWithRetry calls delay with correct backoff intervals", async () => {
  const delays: number[] = [];
  const delayMock = mock.fn(async (ms: number) => {
    delays.push(ms);
  });
  const fn = mock.fn(async () => {
    throw new Error("fail");
  });

  await sendWithRetry(fn, 2, "test", { delay: delayMock });

  assert.equal(fn.mock.callCount(), 3);
  assert.equal(delayMock.mock.callCount(), 2);
  assert.deepEqual(delays, [1000, 2000]); // backoff: 1s, 2s
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Email fallback decision logic
// ═══════════════════════════════════════════════════════════════════════════════

test("telegram success → no email sent", async () => {
  const sendTelegram = mock.fn(async () => {});
  const sendEmail = mock.fn(async () => {});

  const result = await handleEmailFallback(
    { id: "org1", name: "TestOrg", report_email_recipient: "a@b.com" },
    sendTelegram,
    sendEmail,
  );

  assert.equal(result.telegramOk, true);
  assert.equal(result.emailSent, false);
  assert.equal(sendEmail.mock.callCount(), 0);
});

test("telegram failure + org has recipient → email sent", async () => {
  const sendTelegram = mock.fn(async () => {
    throw new Error("tg down");
  });
  const sendEmail = mock.fn(async (_to: string) => {});

  const result = await handleEmailFallback(
    { id: "org1", name: "TestOrg", report_email_recipient: "a@b.com" },
    sendTelegram,
    sendEmail,
  );

  assert.equal(result.telegramOk, false);
  assert.equal(result.emailSent, true);
  assert.equal(sendEmail.mock.callCount(), 1);
  assert.equal(sendEmail.mock.calls[0].arguments[0], "a@b.com");
});

test("telegram failure + no recipient → no email sent", async () => {
  const sendTelegram = mock.fn(async () => {
    throw new Error("tg down");
  });
  const sendEmail = mock.fn(async () => {});

  const result = await handleEmailFallback(
    { id: "org1", name: "TestOrg" },
    sendTelegram,
    sendEmail,
  );

  assert.equal(result.telegramOk, false);
  assert.equal(result.emailSent, false);
  assert.equal(sendEmail.mock.callCount(), 0);
});

test("both telegram and email fail → both errors captured", async () => {
  const sendTelegram = mock.fn(async () => {
    throw new Error("tg down");
  });
  const sendEmail = mock.fn(async () => {
    throw new Error("smtp down");
  });

  const result = await handleEmailFallback(
    { id: "org1", name: "TestOrg", report_email_recipient: "a@b.com" },
    sendTelegram,
    sendEmail,
  );

  assert.equal(result.telegramOk, false);
  assert.equal(result.errors.length, 2);
  assert.equal((result.errors[0] as Error).message, "tg down");
  assert.equal((result.errors[1] as Error).message, "smtp down");
});

test("telegram failure + null recipient → no email sent", async () => {
  const sendTelegram = mock.fn(async () => {
    throw new Error("tg down");
  });
  const sendEmail = mock.fn(async () => {});

  const result = await handleEmailFallback(
    { id: "org1", name: "TestOrg", report_email_recipient: null },
    sendTelegram,
    sendEmail,
  );

  assert.equal(result.telegramOk, false);
  assert.equal(result.emailSent, false);
  assert.equal(sendEmail.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SMTP health check
// ═══════════════════════════════════════════════════════════════════════════════

test("no SMTP config → email sends skipped", async () => {
  const getSmtpConfig = mock.fn(async () => ({ data: null }));
  const result = await shouldSendEmails(getSmtpConfig);
  assert.equal(result, false);
  assert.equal(getSmtpConfig.mock.callCount(), 1);
});

test("SMTP config exists → email sends proceed", async () => {
  const getSmtpConfig = mock.fn(async () => ({
    data: { host: "smtp.example.com", port: 587 },
  }));
  const result = await shouldSendEmails(getSmtpConfig);
  assert.equal(result, true);
});
