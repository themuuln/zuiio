import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = {
  title: "Имэйл баталгаажуулах — Zuiio ID",
};

/** PPR: static shell renders immediately, searchParams streams in via Suspense. */
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";

  return <VerifyEmailForm email={email} />;
}
