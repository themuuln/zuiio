"use client";

import { useRouter } from "next/navigation";
import { DynamicProductCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";

/**
 * /products/new — opens the ProductCreateDrawer from any page.
 * On close, navigates back to /products so the user sees the list.
 */
export default function NewProductPage() {
  const router = useRouter();
  const { companyType } = useOrgSettings();

  return (
    <DynamicProductCreateDrawer
      companyType={companyType}
      open
      onOpenChange={(open) => {
        if (!open) router.replace("/products");
      }}
      hideTrigger
    />
  );
}
