"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const navLinks = [
  { href: "#features", label: "Онцлогууд" },
  { href: "#pricing", label: "Үнэ" },
  { href: "#testimonials", label: "Сэтгэгдэл" },
  { href: "/about", label: "Бидний тухай" },
  { href: "/contact", label: "Холбогдох" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "border-b bg-background/85 backdrop-blur-lg"
          : "border-b border-transparent bg-background/50 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/landing"
          className="flex items-center gap-2.5 font-semibold text-lg"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 text-primary-foreground text-sm font-bold shadow-sm">
            Z
          </div>
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        className={`overflow-hidden border-t transition-all duration-200 md:hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Нэвтрэх</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/login">Эхлэх</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
