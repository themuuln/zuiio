import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zuiio ID — Нэвтрэх систем",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
