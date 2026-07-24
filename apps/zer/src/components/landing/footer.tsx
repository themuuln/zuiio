"use client";

import { Envelope, FacebookLogo, Phone } from "@phosphor-icons/react/dist/ssr";
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
      { label: "Бидний тухай", href: "/about" },
      { label: "Холбогдох", href: "/contact" },
    ],
  },
  {
    title: "Эрх зүй",
    links: [
      { label: "Нууцлалын бодлого", href: "/privacy" },
      { label: "Үйлчилгээний нөхцөл", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/20 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link
              href="/landing"
              className="flex items-center gap-2.5 font-semibold text-lg"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 text-primary-foreground text-sm font-bold shadow-sm">
                Z
              </div>
              {APP_NAME}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Жижиг дунд бизнест зориулсан ERP систем. Бараа материалын бүртгэл,
              борлуулалт, зарлага, харилцагчийн менежмент — бүгд нэг системд.
            </p>
            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Envelope className="size-3.5 shrink-0" />
                hello@zer.mn
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                7000-0000
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-semibold">{group.title}</h4>
              <ul className="space-y-3">
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

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com/zer"
              className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              aria-label="Facebook"
            >
              <FacebookLogo className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
