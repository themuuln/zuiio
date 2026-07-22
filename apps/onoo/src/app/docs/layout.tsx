import Link from "next/link";

const DOCS_NAV = [
  {
    label: "Getting Started",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/vision", label: "Product Vision" },
      { href: "/docs/architecture", label: "Architecture" },
      { href: "/docs/roadmap", label: "Roadmap" },
    ],
  },
  {
    label: "Design System",
    items: [
      { href: "/docs/design", label: "Brandbook & Design" },
    ],
  },
  {
    label: "Features",
    items: [
      { href: "/docs/features", label: "Feature Inventory" },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Sidebar */}
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

      {/* Main content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
