"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/i18n/navigation";

export default function NewCustomerRedirect() {
  const { replace } = useRouter();

  useEffect(() => {
    replace("/dashboard/customers?new=1");
  }, [replace]);

  return null;
}
