import type { Metadata } from "next";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

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
