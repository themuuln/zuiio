"use server";

import { capture } from "@zuiio/capture";
import {
  suggestDomainNames,
  suggestStoreNames,
} from "@/lib/ai/business-naming";

export interface SuggestNamesResult {
  names?: string[];
  error?: string;
}

export interface SuggestDomainsResult {
  domains?: string[];
  error?: string;
}

export async function suggestStoreNamesAction(
  formData: FormData,
): Promise<SuggestNamesResult> {
  try {
    const businessType = formData.get("businessType") as string;
    const keywordsRaw = formData.get("keywords") as string;
    const count = Number(formData.get("count")) || 5;

    if (!businessType?.trim()) {
      return { error: "Бизнесийн төрөл оруулна уу." };
    }

    const keywords = keywordsRaw
      ? keywordsRaw
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : undefined;

    const result = await suggestStoreNames({ businessType, keywords, count });

    return {
      names: result.names,
      error: result.error,
    };
  } catch (e) {
    capture(e, { context: "suggestStoreNamesAction" });
    return { error: "Нэр санал болгоход алдаа гарлаа. Дахин оролдоно уу." };
  }
}

export async function suggestDomainNamesAction(
  formData: FormData,
): Promise<SuggestDomainsResult> {
  try {
    const storeName = formData.get("storeName") as string;

    if (!storeName?.trim()) {
      return { error: "Дэлгүүрийн нэр оруулна уу." };
    }

    const result = await suggestDomainNames({ storeName });

    return {
      domains: result.domains,
      error: result.error,
    };
  } catch (e) {
    capture(e, { context: "suggestDomainNamesAction" });
    return {
      error: "Домэйн нэр санал болгоход алдаа гарлаа. Дахин оролдоно уу.",
    };
  }
}
