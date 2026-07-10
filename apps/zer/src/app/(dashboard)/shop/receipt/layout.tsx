import type * as React from "react";

// The shop layout stretches wide for the POS catalog; keep this page narrow.
export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-3xl">{children}</div>;
}
