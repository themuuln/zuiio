import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "./_form";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-xl font-bold">Admin sign in</h1>
      <LoginForm />
    </main>
  );
}
