import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const footerLinks = [
  {
    title: "Бүтээгдэхүүн",
    links: [
      { label: "Онцлогууд", href: "#features" },
      { label: "Үнэ", href: "#pricing" },
      { label: "Түгээмэл асуултууд", href: "#faq" },
    ],
  },
  {
    title: "Компани",
    links: [
      { label: "Бидний тухай", href: "#" },
      { label: "Блог", href: "#" },
      { label: "Холбогдох", href: "#" },
    ],
  },
  {
    title: "Эрх зүй",
    links: [
      { label: "Нууцлалын бодлого", href: "#" },
      { label: "Үйлчилгээний нөхцөл", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link
              href="/landing"
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                Z
              </div>
              {APP_NAME}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Жижиг дунд бизнест зориулсан ERP систем.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-sm font-medium">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. Бүх эрх хуулиар
          хамгаалагдсан.
        </div>
      </div>
    </footer>
  );
}
