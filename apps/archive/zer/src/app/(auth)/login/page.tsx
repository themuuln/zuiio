import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; detail?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <LoginFormLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginFormLoader({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; detail?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      next={params.next ?? "/"}
      error={params.error}
      detail={params.detail}
    />
  );
}
