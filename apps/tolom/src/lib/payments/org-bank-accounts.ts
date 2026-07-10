import {
  getMongolianBank,
  type MongolianBank,
  type MongolianBankId,
} from "./mongolian-banks";

/** Org-configured transfer account stored in organization.settings.transfer_bank_accounts */
export interface OrgTransferBankAccount {
  bankId: MongolianBankId;
  accountNumber: string;
  accountHolder?: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface ResolvedTransferBank extends MongolianBank {
  accountNumber: string;
  accountHolder?: string;
  isDefault: boolean;
}

export function resolveOrgTransferBanks(
  accounts?: OrgTransferBankAccount[] | null,
): ResolvedTransferBank[] {
  if (!accounts?.length) return [];

  return accounts
    .filter((account) => account.enabled && account.accountNumber.trim())
    .map((account) => {
      const bank = getMongolianBank(account.bankId);
      if (!bank) return null;
      return {
        ...bank,
        accountNumber: account.accountNumber.trim(),
        accountHolder: account.accountHolder?.trim() || undefined,
        isDefault: account.isDefault ?? false,
      };
    })
    .filter(
      (bank): bank is NonNullable<typeof bank> => bank !== null,
    ) as ResolvedTransferBank[];
}

export function getDefaultTransferBank(
  accounts: ResolvedTransferBank[],
): ResolvedTransferBank | null {
  if (!accounts.length) return null;
  return accounts.find((account) => account.isDefault) ?? accounts[0];
}

export function findTransferBankById(
  accounts: ResolvedTransferBank[],
  bankId: string | null | undefined,
): ResolvedTransferBank | null {
  if (!bankId) return getDefaultTransferBank(accounts);
  return accounts.find((account) => account.id === bankId) ?? null;
}

/** Mask account number for display: show last 4 digits. */
export function maskAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.replace(/\s/g, "");
  if (trimmed.length <= 4) return trimmed;
  return `•••• ${trimmed.slice(-4)}`;
}

export function normalizeOrgTransferBankAccounts(
  raw: unknown,
): OrgTransferBankAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const bankId = record.bankId;
      const accountNumber = record.accountNumber;
      if (typeof bankId !== "string" || typeof accountNumber !== "string") {
        return null;
      }
      if (!getMongolianBank(bankId)) return null;
      return {
        bankId: bankId as MongolianBankId,
        accountNumber,
        accountHolder:
          typeof record.accountHolder === "string"
            ? record.accountHolder
            : undefined,
        enabled: record.enabled !== false,
        isDefault: record.isDefault === true,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> => item !== null,
    ) as OrgTransferBankAccount[];
}
