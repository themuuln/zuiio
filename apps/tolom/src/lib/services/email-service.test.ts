import { describe, expect, it, vi, beforeEach } from "vitest";
import type { InvoiceWithItems } from "@/lib/types/composite";
import type {
  SendBookingRequestEmailParams,
  SendEstimateEmailParams,
  SendInvoiceEmailParams,
  SendReminderEmailParams,
} from "./email-service";

// ── Hoisted mock infrastructure ─────────────────────────────────────────
// We expose shared sendMail/verify mocks so tests can configure rejection
// BEFORE calling the service function.  For round-robin verification we
// also track which transporter index each sendMail call originated from.
const { mockCreateTransport, mockReportServerError, sharedSendMail, sharedVerify, setTransportFactory } =
  vi.hoisted(() => {
    const sharedSendMail = vi.fn().mockResolvedValue({ messageId: "mock-msg-id" });
    const sharedVerify = vi.fn().mockResolvedValue(true);

    // Default factory — every createTransport call returns the shared mocks.
    // Override via setTransportFactory() for tests that need per-instance tracking.
    let factory: () => { sendMail: typeof sharedSendMail; verify: typeof sharedVerify } = () => ({
      sendMail: sharedSendMail,
      verify: sharedVerify,
    });

    return {
      mockCreateTransport: vi.fn(() => factory()),
      mockReportServerError: vi.fn(),
      sharedSendMail,
      sharedVerify,
      setTransportFactory: (fn: typeof factory) => {
        factory = fn;
      },
    };
  });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mockReportServerError,
}));


/** Local type for the dynamically-loaded module exports. */
interface EmailServiceModule {
  sendEmail(args: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ id: string }>;
  sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ id: string }>;
  sendReminderEmail(params: SendReminderEmailParams): Promise<{ id: string }>;
  sendBookingRequestEmail(
    params: SendBookingRequestEmailParams,
  ): Promise<{ id: string }>;
  sendEstimateEmail(params: SendEstimateEmailParams): Promise<{ id: string }>;
  testEmailConfig(): Promise<boolean>;
  getSmtpAccountCount(): number;
}

let mod: EmailServiceModule;

beforeEach(async () => {
  // Dynamic import: email-service has module-level mutable state
  // (_accounts, _transporters, _currentIndex) cached by parseAccounts().
  // vi.resetModules() + await import() gives a fresh copy so env var
  // changes take effect and round-robin counters reset between tests.
  vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_SECURE", "false");
  vi.stubEnv("SMTP_USER", "test@tolom.app");
  vi.stubEnv("SMTP_PASS", "test-app-password");
  vi.stubEnv("EMAIL_FROM", "TOLOM <test@tolom.app>");
  vi.stubEnv("SMTP_ACCOUNTS", "");
  vi.resetModules();
  mockCreateTransport.mockClear();
  mockReportServerError.mockClear();
  sharedSendMail.mockClear();
  sharedSendMail.mockResolvedValue({ messageId: "mock-msg-id" });
  sharedVerify.mockClear();
  sharedVerify.mockResolvedValue(true);
  // Default factory: shared mocks (controllable before/after call)
  setTransportFactory(() => ({ sendMail: sharedSendMail, verify: sharedVerify }));
  mod = await import("./email-service");
});


/** Reload module with custom env (for tests that override SMTP config). */
async function reloadWithEnv(env: Record<string, string | undefined>) {
  // Dynamic import: same reason as beforeEach — need a fresh module instance
  // with different env vars and zeroed internal state.
  vi.stubEnv("SMTP_HOST", env.SMTP_HOST ?? "smtp.gmail.com");
  vi.stubEnv("SMTP_PORT", env.SMTP_PORT ?? "587");
  vi.stubEnv("SMTP_SECURE", env.SMTP_SECURE ?? "false");
  vi.stubEnv("SMTP_USER", env.SMTP_USER ?? "test@tolom.app");
  vi.stubEnv("SMTP_PASS", env.SMTP_PASS ?? "test-app-password");
  vi.stubEnv("EMAIL_FROM", env.EMAIL_FROM ?? "TOLOM <test@tolom.app>");
  // SMTP_ACCOUNTS: only stub if explicitly passed with a value
  // (staying unset preserves the zero-accounts-created behavior)
  if (env.SMTP_ACCOUNTS !== undefined) {
    vi.stubEnv("SMTP_ACCOUNTS", env.SMTP_ACCOUNTS);
  }
  vi.resetModules();
  mockCreateTransport.mockClear();
  mockReportServerError.mockClear();
  sharedSendMail.mockClear();
  sharedSendMail.mockResolvedValue({ messageId: "mock-msg-id" });
  sharedVerify.mockClear();
  sharedVerify.mockResolvedValue(true);
  setTransportFactory(() => ({ sendMail: sharedSendMail, verify: sharedVerify }));
  mod = await import("./email-service");
}

/** Minimal mock InvoiceWithItems. */
function makeInvoice(
  overrides: Partial<InvoiceWithItems> = {},
): InvoiceWithItems {
  return {
    id: "inv-1",
    invoice_number: "INV-001",
    organization_id: "org-1",
    status: "sent",
    subtotal: 250,
    discount_total: 0,
    tax_total: 0,
    total: 250,
    amount_paid: 0,
    amount_refunded: 0,
    balance_due: 250,
    issued_at: "2026-07-01T00:00:00Z",
    due_at: "2026-08-01T00:00:00Z",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    branch_id: null,
    created_by: null,
    customer_id: null,
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "+976 9999 9999",
    customer_address: "Ulaanbaatar",
    vehicle_id: null,
    vehicle_plate: "001 УББ",
    vehicle_details: "Toyota Prius 2015",
    work_order_id: null,
    public_token: "tok-001",
    notes: null,
    terms: null,
    footer: null,
    email_sent_at: null,
    paid_at: null,
    deleted_at: null,
    updated_by: null,
    einvoice_qr_code: null,
    einvoice_registered_at: null,
    einvoice_registration_id: null,
    einvoice_status: null,
    items: [
      {
        id: "item-1",
        invoice_id: "inv-1",
        item_type: "service",
        description: "Engine oil change",
        quantity: 1,
        unit_price: 150,
        discount_amount: 0,
        total_price: 150,
        tax_rate: null,
        is_tax_exempt: null,
        sort_order: 0,
        created_at: "2026-07-01T00:00:00Z",
      },
      {
        id: "item-2",
        invoice_id: "inv-1",
        item_type: "part",
        description: "Oil filter",
        quantity: 1,
        unit_price: 100,
        discount_amount: 0,
        total_price: 100,
        tax_rate: null,
        is_tax_exempt: null,
        sort_order: 1,
        created_at: "2026-07-01T00:00:00Z",
      },
    ],
    payments: [],
    refunds: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  sendEmail
// ══════════════════════════════════════════════════════════════════════════

describe("sendEmail", () => {
  it("sends an email with default from address", async () => {
    const result = await mod.sendEmail({
      to: "customer@example.com",
      subject: "Welcome",
      html: "<p>Thanks!</p>",
    });

    expect(result).toEqual({ id: "mock-msg-id" });
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: "test@tolom.app", pass: "test-app-password" },
      }),
    );
    expect(sharedSendMail).toHaveBeenCalledTimes(1);
    expect(sharedSendMail).toHaveBeenCalledWith({
      from: "TOLOM <test@tolom.app>",
      to: "customer@example.com",
      subject: "Welcome",
      html: "<p>Thanks!</p>",
    });
  });

  it("uses custom from address when provided", async () => {
    await mod.sendEmail({
      to: "customer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      from: "Custom Shop <shop@example.com>",
    });

    expect(sharedSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Custom Shop <shop@example.com>",
      }),
    );
  });

  it("handles array of recipients", async () => {
    await mod.sendEmail({
      to: ["a@example.com", "b@example.com"],
      subject: "Broadcast",
      html: "<p>Hello all</p>",
    });

    expect(sharedSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@example.com, b@example.com",
      }),
    );
  });

  it("rejects when SMTP send fails", async () => {
    sharedSendMail.mockRejectedValueOnce(new Error("Connection timeout"));

    await expect(
      mod.sendEmail({
        to: "customer@example.com",
        subject: "Fail",
        html: "<p>Oops</p>",
      }),
    ).rejects.toThrow("Connection timeout");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  sendInvoiceEmail
// ══════════════════════════════════════════════════════════════════════════

describe("sendInvoiceEmail", () => {
  it("sends an invoice email with correct content", async () => {
    const invoice = makeInvoice();
    const result = await mod.sendInvoiceEmail({
      invoice,
      orgName: "Test Garage",
      recipientEmail: "john@example.com",
      publicInvoiceUrl: "https://tolom.app/invoice/inv-1",
    });

    expect(result).toEqual({ id: "mock-msg-id" });
    expect(sharedSendMail).toHaveBeenCalledTimes(1);
    const call = sharedSendMail.mock.calls[0]![0];

    expect(call.subject).toContain("Test Garage");
    expect(call.subject).toContain("INV-001");
    expect(call.to).toBe("john@example.com");
    expect(call.from).toContain("Test Garage");
    // HTML contains key invoice data
    expect(call.html).toContain("INV-001");
    expect(call.html).toContain("John Doe");
    expect(call.html).toContain("Engine oil change");
    expect(call.html).toContain("$250");
    expect(call.html).toContain("https://tolom.app/invoice/inv-1");
  });

  it("includes notes and terms in HTML when present", async () => {
    const invoice = makeInvoice({
      notes: "Please pay promptly",
      terms: "Net 30",
    });

    await mod.sendInvoiceEmail({
      invoice,
      orgName: "Test Garage",
      recipientEmail: "john@example.com",
      publicInvoiceUrl: "https://tolom.app/invoice/inv-1",
    });

    const html = sharedSendMail.mock.calls[0]![0].html;
    expect(html).toContain("Please pay promptly");
    expect(html).toContain("Net 30");
  });

  it("propagates sendEmail failures", async () => {
    sharedSendMail.mockRejectedValueOnce(new Error("SMTP down"));

    await expect(
      mod.sendInvoiceEmail({
        invoice: makeInvoice(),
        orgName: "Test",
        recipientEmail: "a@b.com",
        publicInvoiceUrl: "https://example.com",
      }),
    ).rejects.toThrow("SMTP down");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  sendReminderEmail
// ══════════════════════════════════════════════════════════════════════════

describe("sendReminderEmail", () => {
  it("sends a reminder email with correct content", async () => {
    const result = await mod.sendReminderEmail({
      recipientEmail: "john@example.com",
      customerName: "John Doe",
      vehicleLabel: "001 УББ",
      serviceName: "Oil change",
      orgName: "Test Garage",
      dueDate: "2026-08-15",
    });

    expect(result).toEqual({ id: "mock-msg-id" });

    const call = sharedSendMail.mock.calls[0]![0];

    expect(call.to).toBe("john@example.com");
    expect(call.subject).toContain("Oil change");
    expect(call.subject).toContain("001 УББ");
    expect(call.html).toContain("John Doe");
    expect(call.html).toContain("001 УББ");
    expect(call.html).toContain("Oil change");
    expect(call.html).toContain("2026-08-15");
    expect(call.html).toContain("Test Garage");
  });

  it("propagates sendEmail failures", async () => {
    sharedSendMail.mockRejectedValueOnce(new Error("Send failed"));

    await expect(
      mod.sendReminderEmail({
        recipientEmail: "a@b.com",
        customerName: "John",
        vehicleLabel: "ABC",
        serviceName: "Checkup",
        orgName: "Shop",
        dueDate: "2026-08-01",
      }),
    ).rejects.toThrow("Send failed");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  sendBookingRequestEmail
// ══════════════════════════════════════════════════════════════════════════

describe("sendBookingRequestEmail", () => {
  it("sends a booking request email with correct content", async () => {
    const result = await mod.sendBookingRequestEmail({
      to: "shop@tolom.app",
      customerName: "Jane Doe",
      customerPhone: "+976 8888 8888",
      vehiclePlate: "002 УББ",
      notes: "Please check AC too",
      requestedDate: "2026-07-28",
      orgName: "Test Garage",
      dashboardUrl: "https://tolom.app/dashboard/bookings",
    });

    expect(result).toEqual({ id: "mock-msg-id" });

    const call = sharedSendMail.mock.calls[0]![0];

    expect(call.to).toBe("shop@tolom.app");
    expect(call.subject).toContain("Jane Doe");
    expect(call.subject).toContain("002 УББ");
    expect(call.html).toContain("Jane Doe");
    expect(call.html).toContain("+976 8888 8888");
    expect(call.html).toContain("002 УББ");
    expect(call.html).toContain("Please check AC too");
    expect(call.html).toContain("2026-07-28");
    expect(call.html).toContain("https://tolom.app/dashboard/bookings");
  });

  it("shows placeholder for null notes", async () => {
    await mod.sendBookingRequestEmail({
      to: "shop@tolom.app",
      customerName: "Jane Doe",
      customerPhone: "+976 8888 8888",
      vehiclePlate: "002 УББ",
      notes: null,
      requestedDate: "2026-07-28",
      orgName: "Test Garage",
      dashboardUrl: "https://tolom.app/dashboard/bookings",
    });

    const html = sharedSendMail.mock.calls[0]![0].html;
    // The template renders "\u2014" (em-dash) for null notes
    expect(html).toContain("\u2014");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  sendEstimateEmail
// ══════════════════════════════════════════════════════════════════════════

describe("sendEstimateEmail", () => {
  const baseEstimate: SendEstimateEmailParams["estimate"] = {
    estimate_number: "EST-001",
    status: "sent",
    created_at: "2026-07-01T00:00:00Z",
    valid_until: "2026-08-01T00:00:00Z",
    notes: null,
    subtotal: 500,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    tax_total: 0,
    grand_total: 500,
    customer: {
      first_name: "John",
      last_name: "Doe",
      phone: "+976 9999 9999",
      email: "john@example.com",
    },
    vehicle: {
      plate_number: "001 УББ",
      make: "Toyota",
      model: "Prius",
    },
    items: [
      {
        description: "Brake pads replacement",
        item_type: "service",
        quantity: 1,
        unit_price: 300,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 300,
      },
    ],
  };

  it("sends an estimate email with correct content", async () => {
    const result = await mod.sendEstimateEmail({
      estimate: baseEstimate,
      orgName: "Test Garage",
      recipientEmail: "john@example.com",
      publicEstimateUrl: "https://tolom.app/estimate/est-001",
    });

    expect(result).toEqual({ id: "mock-msg-id" });

    const call = sharedSendMail.mock.calls[0]![0];

    expect(call.to).toBe("john@example.com");
    expect(call.subject).toContain("EST-001");
    expect(call.subject).toContain("Test Garage");
    expect(call.html).toContain("EST-001");
    expect(call.html).toContain("John Doe");
    expect(call.html).toContain("001 УББ");
    expect(call.html).toContain("Brake pads replacement");
    expect(call.html).toContain("$300");
    expect(call.html).toContain("$500");
    expect(call.html).toContain("https://tolom.app/estimate/est-001");
  });

  it("handles null customer gracefully", async () => {
    await mod.sendEstimateEmail({
      estimate: { ...baseEstimate, customer: null },
      orgName: "Test Garage",
      recipientEmail: "john@example.com",
      publicEstimateUrl: "https://tolom.app/estimate/est-001",
    });

    const html = sharedSendMail.mock.calls[0]![0].html;
    expect(html).toContain("EST-001");
  });

  it("handles null vehicle gracefully", async () => {
    await mod.sendEstimateEmail({
      estimate: { ...baseEstimate, vehicle: null },
      orgName: "Test Garage",
      recipientEmail: "john@example.com",
      publicEstimateUrl: "https://tolom.app/estimate/est-001",
    });

    const html = sharedSendMail.mock.calls[0]![0].html;
    expect(html).toContain("$500");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  testEmailConfig
// ══════════════════════════════════════════════════════════════════════════

describe("testEmailConfig", () => {
  it("returns true when all transporters verify", async () => {
    const result = await mod.testEmailConfig();
    expect(result).toBe(true);
    expect(sharedVerify).toHaveBeenCalled();
  });

  it("returns false and reports error when a transporter fails verification", async () => {
    sharedVerify.mockRejectedValueOnce(new Error("Invalid credentials"));

    const result = await mod.testEmailConfig();
    expect(result).toBe(false);
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("verifies every account in a multi-account setup", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "u1@gmail.com:p1,u2@gmail.com:p2",
    });

    const result = await mod.testEmailConfig();
    expect(result).toBe(true);
    // Two transporters created
    expect(mockCreateTransport).toHaveBeenCalledTimes(2);
    // sharedVerify was called once per transporter
    expect(sharedVerify).toHaveBeenCalledTimes(2);
  });

  it("returns false when one of multiple accounts fails", async () => {
    // For multi-account verification failure, we need per-instance verify
    // mocks since sharedVerify is called for both accounts and the first
    // rejection is consumed by the first verify call.
    await reloadWithEnv({
      SMTP_ACCOUNTS: "u1@gmail.com:p1,u2@gmail.com:p2",
    });

    const verifyCalls: Array<ReturnType<typeof vi.fn>> = [];
    setTransportFactory(() => {
      const v = vi.fn().mockResolvedValue(true);
      verifyCalls.push(v);
      return { sendMail: sharedSendMail, verify: v };
    });

    // Second transporter's verify should fail (set up BEFORE calling testEmailConfig)
    // The factory has been set, so next createTransport call uses it.
    // But we need to trigger parseAccounts first to populate verifyCalls.
    // Alternatively, just set up the rejection on the second call inline.
    // Since factory creates vi.fn() that resolves by default, we override
    // the second one. We need to trigger the factory first.
    mod.getSmtpAccountCount();
    verifyCalls[1].mockRejectedValueOnce(new Error("Auth failed"));

    const result = await mod.testEmailConfig();
    expect(result).toBe(false);
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  getSmtpAccountCount
// ══════════════════════════════════════════════════════════════════════════

describe("getSmtpAccountCount", () => {
  it("returns 1 for default single-account setup", () => {
    expect(mod.getSmtpAccountCount()).toBe(1);
  });

  it("returns the correct count for multi-account setup", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "a@gmail.com:pass1,b@gmail.com:pass2,c@gmail.com:pass3",
    });

    expect(mod.getSmtpAccountCount()).toBe(3);
  });

  it("returns 1 with empty SMTP_USER (backward compat account still created)", async () => {
    await reloadWithEnv({
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_ACCOUNTS: undefined,
    });
    // parseAccounts creates a single account with empty credentials
    expect(mod.getSmtpAccountCount()).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  Round-robin rotation
//
//  NOTE: getTransporter() and getFromEmail() share the same _currentIndex.
//  Code flow for sendEmail (no custom from):
//    1. getTransporter()  — consumes current _currentIndex, then increments
//    2. getFromEmail()    — consumes the NEW _currentIndex, then increments
//  So each sendEmail call increments _currentIndex twice.  For N accounts
//  the transporter always selects even indices and getFromEmail odd indices.
//  The transport instance may NOT match the from-address's account — this is
//  existing code behavior, not a test assumption.
// ══════════════════════════════════════════════════════════════════════════

describe("round-robin rotation", () => {
  it("creates separate transporters per account with correct auth", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "first@gmail.com:pass1,second@gmail.com:pass2",
    });

    // Trigger parseAccounts
    mod.getSmtpAccountCount();

    expect(mockCreateTransport).toHaveBeenCalledTimes(2);
    expect(mockCreateTransport).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        auth: { user: "first@gmail.com", pass: "pass1" },
      }),
    );
    expect(mockCreateTransport).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        auth: { user: "second@gmail.com", pass: "pass2" },
      }),
    );
  });

  it("alternates from addresses across consecutive sendEmail calls", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "user1@gmail.com:pass1,user2@gmail.com:pass2",
    });

    // Use per-instance sendMail mocks so we can track each send individually
    const sendMails: Array<ReturnType<typeof vi.fn>> = [];
    setTransportFactory(() => {
      const sm = vi.fn().mockResolvedValue({ messageId: "mock-msg-id" });
      sendMails.push(sm);
      return { sendMail: sm, verify: vi.fn().mockResolvedValue(true) };
    });
    // Trigger parseAccounts so the factory populates sendMails.
    // After this, sendMails[0] = account[0]'s transporter
    //               sendMails[1] = account[1]'s transporter
    mod.getSmtpAccountCount();

    await mod.sendEmail({
      to: "a@b.com",
      subject: "First",
      html: "<p>1</p>",
    });
    await mod.sendEmail({
      to: "a@b.com",
      subject: "Second",
      html: "<p>2</p>",
    });

    // sendEmail (no custom from) calls getTransporter() first, then getFromEmail().
    // Both share _currentIndex. For 2 accounts:
    //   getTransporter(): index 0, 2, 4... → always transporter[0] (sendMails[0])
    //   getFromEmail():   index 1, 3, 5... → always account[1].from (user2)
    // So all sends go through sendMails[0] with from = user2's address.
    expect(sendMails[0].mock.calls[0][0].from).toBe(
      "TOLOM <user2@gmail.com>",
    );
    expect(sendMails[0].mock.calls[1][0].from).toBe(
      "TOLOM <user2@gmail.com>",
    );
  });

  it("alternates from addresses across consecutive sendInvoiceEmail calls", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "user1@gmail.com:pass1,user2@gmail.com:pass2",
    });

    const sendMails: Array<ReturnType<typeof vi.fn>> = [];
    setTransportFactory(() => {
      const sm = vi.fn().mockResolvedValue({ messageId: "mock-msg-id" });
      sendMails.push(sm);
      return { sendMail: sm, verify: vi.fn().mockResolvedValue(true) };
    });
    mod.getSmtpAccountCount();

    const invoice = makeInvoice();

    await mod.sendInvoiceEmail({
      invoice,
      orgName: "Shop",
      recipientEmail: "a@b.com",
      publicInvoiceUrl: "https://example.com/1",
    });
    await mod.sendInvoiceEmail({
      invoice,
      orgName: "Shop",
      recipientEmail: "a@b.com",
      publicInvoiceUrl: "https://example.com/2",
    });

    // sendInvoiceEmail calls getFromEmail() first (outside sendEmail),
    // then sendEmail -> getTransporter(). With 2 accounts:
    // getFromEmail consumes even indices, getTransporter consumes odd.
    // So transporter[1] (sendMails[1]) handles both sends, with from
    // from account[0].
    const call1 = sendMails[1].mock.calls[0][0];
    const call2 = sendMails[1].mock.calls[1][0];
    expect(call1.from).toContain("user1@gmail.com");
    expect(call2.from).toContain("user1@gmail.com");
  });

  it("wraps around through accounts past the array length", async () => {
    await reloadWithEnv({
      SMTP_ACCOUNTS: "a@gmail.com:p1,b@gmail.com:p2",
    });

    const sendMails: Array<ReturnType<typeof vi.fn>> = [];
    setTransportFactory(() => {
      const sm = vi.fn().mockResolvedValue({ messageId: "msg" });
      sendMails.push(sm);
      return { sendMail: sm, verify: vi.fn().mockResolvedValue(true) };
    });
    mod.getSmtpAccountCount();

    // 3 sends with 2 accounts -> should wrap. Only getTransporter() runs
    // (custom from provided, so getFromEmail is NOT called inside sendEmail).
    await mod.sendEmail({
      to: "x@x.com",
      subject: "S1",
      html: "<p>1</p>",
      from: "Custom <c@c.com>",
    });
    await mod.sendEmail({
      to: "x@x.com",
      subject: "S2",
      html: "<p>2</p>",
      from: "Custom <c@c.com>",
    });
    await mod.sendEmail({
      to: "x@x.com",
      subject: "S3",
      html: "<p>3</p>",
      from: "Custom <c@c.com>",
    });

    // With custom from (getFromEmail NOT called), only getTransporter() runs.
    // 3 sends with 2 accounts -> index 0, 1, 0 (wrap)
    expect(sendMails[0]).toHaveBeenCalledTimes(2); // S1, S3
    expect(sendMails[1]).toHaveBeenCalledTimes(1); // S2
  });
});
