import { Suspense } from "react";
import { cookies } from "next/headers";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense>
      <LoginPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageInner({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  let lastProvider: string | null = null;
  try {
    const cookieStore = await cookies();
    lastProvider = cookieStore.get("last_provider")?.value ?? null;
  } catch {
    // cookies() may fail in some render contexts — safe to ignore
  }

  return <LoginForm redirectTo={params.next} lastProvider={lastProvider} />;
}
