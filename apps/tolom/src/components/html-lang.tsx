import Script from "next/script";
import { useLocale } from "next-intl";

/**
 * Sets the HTML lang attribute based on the current locale.
 * This is necessary because Next.js App Router doesn't set it automatically.
 */
export function HtmlLang() {
  const locale = useLocale();

  return (
    <Script
      id="html-lang"
      strategy="beforeInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for setting html lang attribute via script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${locale}'`,
      }}
    />
  );
}
