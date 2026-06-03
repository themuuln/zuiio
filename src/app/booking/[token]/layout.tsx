import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Service | TOLOM",
  description: "Request an appointment with your trusted auto service shop.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
