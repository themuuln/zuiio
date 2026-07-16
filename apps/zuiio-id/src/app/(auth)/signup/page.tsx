export const instant = false;
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; return_to?: string }>;
}) {
  return (
    <Suspense>
      <SignupPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupPageInner({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; return_to?: string }>;
}) {
  const params = await searchParams;

  return <SignupForm product={params.product} returnTo={params.return_to} />;
}
