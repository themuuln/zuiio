export const instant = false;
import { Suspense } from "react";
import { LogoutForm } from "./logout-form";

export default function LogoutPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense>
      <LogoutPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function LogoutPageInner({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Гарах</h1>
      <p className="text-sm text-muted-foreground">Гарч байна…</p>
      <LogoutForm next={params.next} />
    </div>
  );
}
