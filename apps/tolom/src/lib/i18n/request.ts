import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import enMessages from "../../messages/en.json";
import mnMessages from "../../messages/mn.json";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = locale === "mn" ? mnMessages : enMessages;

  return {
    locale,
    messages: messages as typeof enMessages,
  };
});
