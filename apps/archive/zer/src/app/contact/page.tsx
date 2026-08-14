import type { Metadata } from "next";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Холбогдох — Zer",
  description: "Zer-ийн багтай холбогдож, асуулт, санал хүсэлтээ илгээнэ үү.",
};

export default function ContactPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Холбогдох
          </p>
          <h1 className="mb-6 font-display text-4xl leading-tight text-balance md:text-5xl">
            Бидэнтэй холбогдох
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Асуулт, санал хүсэлтээ бидэн рүү илгээнэ үү. Бид танд туслахад
            баяртай байх болно.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
