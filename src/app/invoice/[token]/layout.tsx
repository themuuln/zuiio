import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice | TOLOM",
  description: "View and pay your invoice online.",
};

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
