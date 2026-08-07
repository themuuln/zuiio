import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тэмдэглэгч — Оноо",
  description:
    "Шууд тоглолтын тэмдэглэгч. Тоглолтын үйл явдлыг бүртгэж, статистик тооцоолно.",
  openGraph: {
    title: "Тэмдэглэгч — Оноо",
    description:
      "Шууд тоглолтын тэмдэглэгч. Тоглолтын үйл явдлыг бүртгэж, статистик тооцоолно.",
  },
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
