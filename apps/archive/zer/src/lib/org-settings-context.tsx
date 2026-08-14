"use client";

import { createContext, useContext, useMemo } from "react";

export interface OrgSettings {
  /** Current organization ID */
  organizationId: string;
  /** Organization company type (retail, wholesale, gym, etc.) */
  companyType: string;
  hasSuppliers: boolean;
  hasInventory: boolean;
  hasCustomerCredit: boolean;
  hasMultiBranch: boolean;
  hasVariants: boolean;
  hasBrands: boolean;
  hasCategories: boolean;
  hasEmailReports: boolean;
  hasAuditLog: boolean;
  hasDeliveryTracking: boolean;
  hasCoupons: boolean;
  hasGiftCards: boolean;
  hasPromotions: boolean;
  /** Show the customer/staff section in the shop checkout drawer */
  hasCheckoutCustomer: boolean;
  /** Show banknote quick-amount chips in the shop checkout drawer */
  hasCheckoutQuickAmounts: boolean;
  /** Show receipt as a drawer after checkout */
  hasReceiptDrawer: boolean;
  /** Whether the shop enforces stock levels (false = treat all products as available) */
  trackStock: boolean;
  /** Pre-selected payment method at shop checkout */
  shopDefaultPaymentMethod: string;
}

const defaults: OrgSettings = {
  organizationId: "",
  companyType: "other",
  hasSuppliers: true,
  hasInventory: true,
  hasCustomerCredit: true,
  hasMultiBranch: false,
  hasVariants: true,
  hasBrands: true,
  hasCategories: true,
  hasEmailReports: false,
  hasAuditLog: true,
  hasDeliveryTracking: false,
  hasCoupons: true,
  hasGiftCards: true,
  hasPromotions: true,
  hasCheckoutCustomer: true,
  hasCheckoutQuickAmounts: true,
  hasReceiptDrawer: true,
  trackStock: true,
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
  const merged = useMemo(() => ({ ...defaults, ...value }), [value]);
  return (
    <OrgSettingsContext.Provider value={merged}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

export function useOrgSettings(): OrgSettings {
  return useContext(OrgSettingsContext);
}
