import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; return_to?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense>
      <SignupForm product={params.product} returnTo={params.return_to} />
    </Suspense>
  );
}
