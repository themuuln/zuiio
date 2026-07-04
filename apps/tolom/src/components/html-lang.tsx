"use client";

import Script from "next/script";
import { useLocale } from "next-intl";

/**
 * Synchronous inline script that sets <html lang> before React hydrates.
 * Prevents the brief flash where the root layout's default lang is visible.
 */
export function HtmlLang() {
  const locale = useLocale();

  return (
    <Script
      id="html-lang"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${locale}'`,
      }}
    />
  );
}
