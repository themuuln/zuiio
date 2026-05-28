"use client";

import type { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";

type CustomerType = "individual" | "company";

export interface CustomerFormState {
  type: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  notes: string;
}

interface CustomerEditFormProps {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  t: ReturnType<typeof useTranslations<"customers">>;
}

export function CustomerEditForm({ form, setForm, t }: CustomerEditFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="type">
          {t("type")}
        </label>
        <select
          id="type"
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              type: event.target.value as CustomerType,
            }))
          }
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        >
          <option value="individual">{t("individual")}</option>
          <option value="company">{t("company")}</option>
        </select>
      </div>

      {form.type === "company" ? (
        <>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="companyName"
            >
              {t("companyName")}
            </label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="contactPerson"
            >
              {t("contactPerson")}
            </label>
            <Input
              id="contactPerson"
              value={form.contactPerson}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactPerson: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="firstName"
            >
              {t("firstName")}
            </label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="lastName"
            >
              {t("lastName")}
            </label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="phone">
          {t("phone")}
        </label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              phone: formatMongolianPhone(event.target.value),
            }))
          }
          className="h-11"
          {...inputProps("phone")}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          {t("email")}
        </label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          className="h-11"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="address">
          {t("address")}
        </label>
        <Input
          id="address"
          value={form.address}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              address: event.target.value,
            }))
          }
          className="h-11"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="notes">
          {t("notes")}
        </label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}
