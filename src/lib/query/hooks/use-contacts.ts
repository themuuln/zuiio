"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { contactKeys } from "@/lib/query/keys";

export const useContacts = createSimpleQuery({
  keys: contactKeys,
  table: "contacts",
});
