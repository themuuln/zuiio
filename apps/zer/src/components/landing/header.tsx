"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const navLinks = [
  { href: "#features", label: "Онцлогууд" },
  { href: "#testimonials", label: "Сэтгэгдэл" },
  { href: "#pricing", label: "Үнэ" },
  { href: "#faq", label: "Түгээмэл асуултууд" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/landing"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            Z
          </div>
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Нэвтрэх</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Эхлэх</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="flex items-center justify-center md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Цэс"
        >
          {isOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="border-t md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Нэвтрэх</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/login">Эхлэх</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
