"use client";

import { createContext, useContext } from "react";

export interface OrgSettings {
  /** Current organization ID */
  organizationId: string;
  hasSuppliers: boolean;
  hasInventory: boolean;
  hasCustomerCredit: boolean;
  hasMultiBranch: boolean;
  hasVariants: boolean;
  hasBrands: boolean;
  hasCategories: boolean;
  hasEmailReports: boolean;
  hasAuditLog: boolean;
  /** Show the customer/staff section in the shop checkout drawer */
  hasCheckoutCustomer: boolean;
  /** Show banknote quick-amount chips in the shop checkout drawer */
  hasCheckoutQuickAmounts: boolean;
  /** Show receipt as a drawer after checkout */
  hasReceiptDrawer: boolean;
  /** Pre-selected payment method at shop checkout */
  shopDefaultPaymentMethod: string;
}

const defaults: OrgSettings = {
  organizationId: "",
  hasSuppliers: true,
  hasInventory: true,
  hasCustomerCredit: true,
  hasMultiBranch: false,
  hasVariants: true,
  hasBrands: true,
  hasCategories: true,
  hasEmailReports: false,
  hasAuditLog: true,
  hasCheckoutCustomer: true,
  hasCheckoutQuickAmounts: true,
  hasReceiptDrawer: true,
  shopDefaultPaymentMethod: "card",
};

const OrgSettingsContext = createContext<OrgSettings>(defaults);

export function OrgSettingsProvider({
  value,
  children,
}: {
  value: Partial<OrgSettings>;
  children: React.ReactNode;
}) {
  return (
    <OrgSettingsContext.Provider value={{ ...defaults, ...value }}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

export function useOrgSettings(): OrgSettings {
  return useContext(OrgSettingsContext);
}
