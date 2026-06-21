"use client";

import { createContext, useContext } from "react";

export interface OrgSettings {
  hasSuppliers: boolean;
  hasInventory: boolean;
  hasCustomerCredit: boolean;
  hasMultiBranch: boolean;
  hasVariants: boolean;
  hasBrands: boolean;
  hasCategories: boolean;
  hasEmailReports: boolean;
  hasAuditLog: boolean;
}

const defaults: OrgSettings = {
  hasSuppliers: true,
  hasInventory: true,
  hasCustomerCredit: true,
  hasMultiBranch: false,
  hasVariants: true,
  hasBrands: true,
  hasCategories: true,
  hasEmailReports: false,
  hasAuditLog: true,
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
