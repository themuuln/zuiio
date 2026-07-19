import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zer — Монгол жижиг дунд бизнест зориулсан ERP систем",
  description:
    "Бараа материалын бүртгэл, борлуулалт, AI туслах, нягтлан бодох бүртгэл — бүгд нэг системд. Монголын жижиг дунд бизнест зориулсан энгийн, хэрэгцээт ERP.",
  openGraph: {
    title: "Zer — Монгол жижиг дунд бизнест зориулсан ERP систем",
    description:
      "Бараа материалын бүртгэл, борлуулалт, AI туслах, нягтлан бодох бүртгэл — бүгд нэг системд.",
  },
};

import { CTA } from "@/components/landing/cta";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  );
}
