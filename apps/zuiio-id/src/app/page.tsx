import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { logout } from "@/app/(auth)/logout/actions";
export const instant = false;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "Хэрэглэгч";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="Zuiio"
        >
          <Image
            src="/zuiio-logo.png"
            alt="Zuiio"
            width={28}
            className="rounded-lg dark:invert"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">Zuiio</span>
        </a>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <h1 className="text-lg font-semibold text-foreground">
                {displayName}
              </h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Connected products */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Холбогдсон бүтээгдэхүүд
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://zer.zuiiotech.com"
                className="active-scale flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-success/30 hover:bg-success/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10 text-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <span className="flex flex-col">
                  <span>Zer</span>
                  <span className="text-xs font-normal text-muted-foreground">Жижиг дунд бизнесийн ERP</span>
                </span>
              </a>
              <a
                href="https://tolom.zuiiotech.com"
                className="active-scale flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-info/30 hover:bg-info/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-info/10 text-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="flex flex-col">
                  <span>Tolom</span>
                  <span className="text-xs font-normal text-muted-foreground">Автомашин засварын менежмент</span>
                </span>
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-2">
            <a
              href="/account"
              className="active-scale flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Бүртгэлийн мэдээлэл
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="active-scale h-11 w-full rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Гарах
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
