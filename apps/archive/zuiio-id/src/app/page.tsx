import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type CSSProperties, Suspense } from "react";
import { logout } from "@/app/(auth)/logout/actions";
import { createClient } from "@/lib/supabase/server";

/** PPR: static header renders instantly, profile data streams in via Suspense. */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Static header — instant from CDN */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="Zuiio"
        >
          <Image
            src="/zuiio-logo.png"
            alt="Zuiio"
            width={28}
            height={28}
            className="rounded-lg dark:invert"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">Zuiio</span>
        </Link>
      </header>

      {/* Main — streams in user profile + connected products */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="flex w-full max-w-sm flex-col items-center gap-8">
              {/* Avatar skeleton */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
                <div className="flex flex-col items-center gap-1">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
              {/* Products skeleton */}
              <div className="flex w-full flex-col gap-2">
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          }
        >
          <HomePageContent />
        </Suspense>
      </main>
    </div>
  );
}

async function HomePageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      {/* Avatar + name */}
      <div
        className="stagger-item flex flex-col items-center gap-3"
        style={{ "--i": 0 } as CSSProperties}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-foreground">
          {initials}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <h1 className="text-lg font-semibold text-foreground">
            {displayName}
          </h1>
          {profile?.username && (
            <p className="text-sm text-foreground/70">@{profile.username}</p>
          )}
          <p className="text-sm text-foreground/70">{user.email}</p>
        </div>
      </div>

      {/* Connected products */}
      <div className="flex w-full flex-col gap-3">
        <p
          className="stagger-item text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
          style={{ "--i": 1 } as CSSProperties}
        >
          Холбогдсон бүтээгдэхүүн
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://zer.zuiiotech.com"
            className="active-scale group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{ "--i": 2 } as CSSProperties}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span className="flex flex-1 flex-col">
              <span>Zer</span>
              <span className="text-xs font-normal text-muted-foreground">
                Жижиг дунд бизнесийн ERP
              </span>
            </span>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground transition-transform duration-base group-hover:translate-x-0.5 group-hover:text-foreground"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <a
            href="https://tolom.zuiiotech.com"
            className="active-scale group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{ "--i": 3 } as CSSProperties}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="flex flex-1 flex-col">
              <span>Tolom</span>
              <span className="text-xs font-normal text-muted-foreground">
                Автомашин засварын менежмент
              </span>
            </span>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground transition-transform duration-base group-hover:translate-x-0.5 group-hover:text-foreground"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>

      {/* Actions */}
      <div
        className="stagger-item flex w-full flex-col gap-2"
        style={{ "--i": 4 } as CSSProperties}
      >
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
  );
}
