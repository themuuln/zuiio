import { describe, expect, it } from "vitest";
import {
  findTransferBankById,
  getDefaultTransferBank,
  maskAccountNumber,
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "./org-bank-accounts";

describe("org bank accounts", () => {
  const accounts = resolveOrgTransferBanks([
    {
      bankId: "khanbank",
      accountNumber: "MN110005005431666225",
      enabled: true,
      isDefault: false,
    },
    {
      bankId: "tdb",
      accountNumber: "MN960004000423063343",
      accountHolder: "TOLOM LLC",
      enabled: true,
      isDefault: true,
    },
    {
      bankId: "golomt",
      accountNumber: "",
      enabled: true,
    },
  ]);

  it("resolves only enabled accounts with account numbers", () => {
    expect(accounts).toHaveLength(2);
    expect(accounts[0]?.id).toBe("khanbank");
    expect(accounts[1]?.accountHolder).toBe("TOLOM LLC");
  });

  it("picks default transfer bank", () => {
    expect(getDefaultTransferBank(accounts)?.id).toBe("tdb");
  });

  it("finds bank by id with fallback", () => {
    expect(findTransferBankById(accounts, "khanbank")?.id).toBe("khanbank");
    expect(findTransferBankById(accounts, null)?.id).toBe("tdb");
  });

  it("masks account numbers", () => {
    expect(maskAccountNumber("MN110005005431666225")).toBe("•••• 6225");
  });

  it("normalizes raw settings payload", () => {
    const normalized = normalizeOrgTransferBankAccounts([
      {
        bankId: "xacbank",
        accountNumber: "MN123",
        enabled: true,
      },
      { bankId: "invalid", accountNumber: "x" },
      null,
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.bankId).toBe("xacbank");
  });
});
