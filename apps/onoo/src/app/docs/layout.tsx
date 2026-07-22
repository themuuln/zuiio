import Link from "next/link";

import { DocsMobileNav } from "./docs-mobile-nav";
import { DOCS_NAV } from "./docs-nav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 lg:hidden">
        <DocsMobileNav />
      </div>

      <div className="flex gap-8 lg:flex-row">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 flex flex-col gap-6">
            {DOCS_NAV.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
