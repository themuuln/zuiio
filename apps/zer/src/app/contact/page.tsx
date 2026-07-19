"use client";

import { CheckCircle, Envelope, MapPin, Phone } from "@phosphor-icons/react";
import type { Metadata } from "next";
import { useState } from "react";

export const metadata: Metadata = {
  title: "Холбогдох — Zer",
  description: "Zer-ийн багтай холбогдож, асуулт, санал хүсэлтээ илгээнэ үү.",
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setSubmitted(true);
        form.reset();
      } else {
        // Fallback: mailto
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const subject = formData.get("subject") as string;
        const message = formData.get("message") as string;
        const body = `Нэр: ${name}\nИмэйл: ${email}\n\n${message}`;
        window.location.href = `mailto:hello@zer.mn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setSubmitted(true);
      }
    } catch {
      // Network error — fallback to mailto
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const subject = formData.get("subject") as string;
      const message = formData.get("message") as string;
      const body = `Нэр: ${name}\nИмэйл: ${email}\n\n${message}`;
      window.location.href = `mailto:hello@zer.mn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Холбогдох
          </p>
          <h1 className="mb-6 font-display text-4xl leading-tight md:text-5xl">
            Бидэнтэй холбогдох
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Асуулт, санал хүсэлтээ бидэн рүү илгээнэ үү. Бид танд туслахад
            баяртай байх болно.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Envelope className="size-5" />
              </div>
              <div>
                <h3 className="mb-1 font-medium">Имэйл</h3>
                <p className="text-sm text-muted-foreground">hello@zer.mn</p>
                <p className="text-xs text-muted-foreground">
                  Ажлын өдрүүдэд 24 цагийн дотор хариу өгнө.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-5" />
              </div>
              <div>
                <h3 className="mb-1 font-medium">Утас</h3>
                <p className="text-sm text-muted-foreground">7000-0000</p>
                <p className="text-xs text-muted-foreground">
                  Даваа — Баасан, 09:00 — 18:00
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div>
                <h3 className="mb-1 font-medium">Хаяг</h3>
                <p className="text-sm text-muted-foreground">
                  Улаанбаатар хот, Монгол улс
                </p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-12 text-center">
              <CheckCircle className="mb-4 size-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">
                Амжилттай илгээгдлээ
              </h3>
              <p className="text-sm text-muted-foreground">
                Танд баярлалаа. Бид тантай удахгүй холбогдох болно.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Дахин илгээх
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Нэр
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Таны нэр"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Имэйл
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="ta@example.com"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Гарчиг
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="Асуултын гарчиг"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Мэдээлэл
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Мэдээллээ дэлгэрэнгүй бичнэ үү..."
                  className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {sending ? "Илгээж байна..." : "Илгээх"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
