import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Invoice | TOLOM",
  description: "View and pay your invoice online.",
};

export default async function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale: "en" });

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
