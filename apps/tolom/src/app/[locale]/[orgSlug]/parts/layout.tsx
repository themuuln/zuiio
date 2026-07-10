import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parts Catalog | TOLOM",
  description: "Browse auto parts available at this shop.",
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
