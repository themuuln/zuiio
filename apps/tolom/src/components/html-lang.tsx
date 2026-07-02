"use client";

import { useLocale } from "next-intl";

/**
 * Synchronous inline script that sets <html lang> before React hydrates.
 * Prevents the brief flash where the root layout's default lang is visible.
 */
export function HtmlLang() {
  const locale = useLocale();

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${locale}'`,
      }}
    />
  );
}
