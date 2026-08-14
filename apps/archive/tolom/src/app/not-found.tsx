import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Typography } from "@/components/ui/typography";

async function NotFoundContent() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  let isMn = localeCookie === "mn";

  if (!localeCookie) {
    const acceptLang = (await headers()).get("accept-language") ?? "";
    const preferred = acceptLang.split(",")[0]?.split("-")[0]?.trim();
    isMn = preferred === "mn";
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="text-center">
        <Typography.H1 className="text-6xl font-semibold text-muted-foreground/30">
          404
        </Typography.H1>
        <Typography.H2 className="mt-4 text-xl font-semibold">
          {isMn ? "Хуудас олдсонгүй" : "Page Not Found"}
        </Typography.H2>
        <Typography.Muted className="mt-2 text-muted-foreground">
          {isMn
            ? "Таны хайсан хуудас байхгүй эсвэл зөвшөөрөлгүй байна."
            : "The page you're looking for doesn't exist or is unavailable."}
        </Typography.Muted>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          {isMn ? "Хяналтын самбар руу буцах" : "Back to Dashboard"}
        </Link>
      </div>
    </div>
  );
}

export default function RootNotFoundPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}
