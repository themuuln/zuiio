"use client";

import dynamic from "next/dynamic";

// Both consumers are lazy-loaded after hydration:
// - sonner's Toaster and toast() were statically imported in the root
//   layout, shipping ~12KB of JS to every page including the public
//   login/signup. Toasts only fire on user interaction or post-hydration
//   effects, so a post-hydration mount loses nothing.
// - `ssr: false` is only allowed in Client Components, so this wrapper
//   exists as the client boundary for both.
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), {
  ssr: false,
});

const LinkedAccountsNotification = dynamic(
  () =>
    import("@/components/linked-accounts-notification").then(
      (m) => m.LinkedAccountsNotification,
    ),
  { ssr: false },
);

export function LazyProviders() {
  return (
    <>
      <LinkedAccountsNotification />
      <Toaster richColors position="top-center" />
    </>
  );
}
