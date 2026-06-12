"use client";

import { Loader2, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { BankLogo } from "@/components/banks/bank-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { DEFAULT_PAYMENT_METHOD_FEES } from "@/components/bay-view-v2/_payment-fees";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import { MONGOLIAN_BANKS } from "@/lib/payments/mongolian-banks";
import type { OrgTransferBankAccount } from "@/lib/payments/org-bank-accounts";
import { normalizeOrgTransferBankAccounts } from "@/lib/payments/org-bank-accounts";
import {
  SettingsBlock,
  SettingsFieldset,
  SettingsGroup,
} from "./_settings-layout";

interface PaymentSettingsSectionProps {
  orgId: string;
}

type FeeKey = keyof typeof DEFAULT_PAYMENT_METHOD_FEES;

function buildBankDraft(
  saved: OrgTransferBankAccount[],
): OrgTransferBankAccount[] {
  const savedById = new Map(saved.map((account) => [account.bankId, account]));
  return MONGOLIAN_BANKS.map((bank) => {
    const existing = savedById.get(bank.id);
    return {
      bankId: bank.id,
      accountNumber: existing?.accountNumber ?? "",
      accountHolder: existing?.accountHolder ?? "",
      enabled: existing?.enabled ?? false,
      isDefault: existing?.isDefault ?? false,
    };
  });
}

export function PaymentSettingsSection({ orgId }: PaymentSettingsSectionProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const { settings, isLoading } = useOrgSettings(orgId);
  const updateSettings = useUpdateOrgSettings(orgId);

  const [fees, setFees] = useState(DEFAULT_PAYMENT_METHOD_FEES);
  const [banks, setBanks] = useState<OrgTransferBankAccount[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const savedFees = settings.payment_method_fees ?? {};
    setFees({
      cash: savedFees.cash ?? DEFAULT_PAYMENT_METHOD_FEES.cash,
      card: savedFees.card ?? DEFAULT_PAYMENT_METHOD_FEES.card,
      bank_transfer:
        savedFees.bank_transfer ?? DEFAULT_PAYMENT_METHOD_FEES.bank_transfer,
      manual: savedFees.manual ?? DEFAULT_PAYMENT_METHOD_FEES.manual,
    });
    setBanks(
      buildBankDraft(
        normalizeOrgTransferBankAccounts(settings.transfer_bank_accounts),
      ),
    );
    setDirty(false);
  }, [settings]);

  const enabledBankCount = useMemo(
    () =>
      banks.filter((bank) => bank.enabled && bank.accountNumber.trim()).length,
    [banks],
  );

  function updateFee(key: FeeKey, value: string) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) return;
    setFees((prev) => ({ ...prev, [key]: parsed }));
    setDirty(true);
  }

  function updateBank(
    bankId: OrgTransferBankAccount["bankId"],
    patch: Partial<OrgTransferBankAccount>,
  ) {
    setBanks((prev) =>
      prev.map((bank) => {
        if (bank.bankId !== bankId) {
          if (patch.isDefault) return { ...bank, isDefault: false };
          return bank;
        }
        const next = { ...bank, ...patch };
        if (patch.enabled === false) next.isDefault = false;
        return next;
      }),
    );
    setDirty(true);
  }

  function setDefaultBank(bankId: OrgTransferBankAccount["bankId"]) {
    setBanks((prev) =>
      prev.map((bank) => ({
        ...bank,
        isDefault: bank.bankId === bankId,
        enabled: bank.bankId === bankId ? true : bank.enabled,
      })),
    );
    setDirty(true);
  }

  async function handleSave() {
    const transfer_bank_accounts = banks
      .filter((bank) => bank.enabled && bank.accountNumber.trim())
      .map((bank) => ({
        bankId: bank.bankId,
        accountNumber: bank.accountNumber.trim(),
        accountHolder: bank.accountHolder?.trim() || undefined,
        enabled: true,
        isDefault: bank.isDefault,
      }));

    const hasDefault = transfer_bank_accounts.some((bank) => bank.isDefault);
    if (transfer_bank_accounts.length > 0 && !hasDefault) {
      transfer_bank_accounts[0] = {
        ...transfer_bank_accounts[0],
        isDefault: true,
      };
    }

    await updateSettings.mutateAsync({
      ...(settings ?? {}),
      payment_method_fees: fees,
      transfer_bank_accounts,
    });
    setDirty(false);
  }

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  return (
    <SettingsBlock>
      <SettingsFieldset
        title={t("paymentFeesTitle")}
        description={t("paymentFeesDesc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(DEFAULT_PAYMENT_METHOD_FEES) as FeeKey[]).map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`fee-${key}`} className="text-xs">
                {t(`paymentFee_${key}`)}
              </Label>
              <div className="relative">
                <Input
                  id={`fee-${key}`}
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={fees[key]}
                  onChange={(event) => updateFee(key, event.target.value)}
                  className="h-8 pr-8"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </SettingsFieldset>

      <SettingsFieldset
        title={t("transferBanksTitle")}
        description={t("transferBanksDesc")}
      >
        <div className="flex items-center justify-end">
          <Badge variant="secondary" className="text-[10px]">
            {t("transferBanksEnabled", { count: enabledBankCount })}
          </Badge>
        </div>
        <SettingsGroup>
          {MONGOLIAN_BANKS.map((bankMeta) => {
            const bank = banks.find((item) => item.bankId === bankMeta.id);
            if (!bank) return null;
            const label = locale === "mn" ? bankMeta.nameMn : bankMeta.nameEn;
            return (
              <div
                key={bankMeta.id}
                className="flex flex-col gap-3 px-3 py-3 sm:px-4"
              >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BankLogo bank={bankMeta} size="md" />
                      <div className="min-w-0">
                        <Typography.Text className="font-medium truncate block">
                          {label}
                        </Typography.Text>
                        {bank.isDefault && (
                          <Badge variant="outline" className="mt-1">
                            {t("transferBankDefault")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={bank.enabled}
                      onCheckedChange={(checked) =>
                        updateBank(bankMeta.id, { enabled: checked })
                      }
                      aria-label={t("transferBankEnable", { bank: label })}
                    />
                  </div>

                  {bank.enabled && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label htmlFor={`account-${bankMeta.id}`}>
                          {t("transferBankAccountNumber")}
                        </Label>
                        <Input
                          id={`account-${bankMeta.id}`}
                          value={bank.accountNumber}
                          onChange={(event) =>
                            updateBank(bankMeta.id, {
                              accountNumber: event.target.value,
                            })
                          }
                          placeholder="MN00 0000 0000 0000 0000"
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label htmlFor={`holder-${bankMeta.id}`}>
                          {t("transferBankAccountHolder")}
                        </Label>
                        <Input
                          id={`holder-${bankMeta.id}`}
                          value={bank.accountHolder ?? ""}
                          onChange={(event) =>
                            updateBank(bankMeta.id, {
                              accountHolder: event.target.value,
                            })
                          }
                          placeholder={t("transferBankAccountHolderPlaceholder")}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!bank.accountNumber.trim()}
                          onClick={() => setDefaultBank(bankMeta.id)}
                          className="gap-1.5"
                        >
                          <Star className="size-3.5" />
                          {t("transferBankSetDefault")}
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </SettingsGroup>
      </SettingsFieldset>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={!dirty || updateSettings.isPending}
        >
          {updateSettings.isPending && (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          )}
          {t("savePayments")}
        </Button>
      </div>
    </SettingsBlock>
  );
}
