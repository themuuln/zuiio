import type { Metadata } from "next";
import { QualityContent } from "./quality-content";

export const metadata: Metadata = {
  title: "Чанарын хяналт — Зэр",
};

export default function QualityPage() {
  return <QualityContent />;
}
