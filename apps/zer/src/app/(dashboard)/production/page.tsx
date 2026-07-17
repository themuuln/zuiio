import type { Metadata } from "next";
import { ProductionContent } from "./production-content";

export const metadata: Metadata = {
  title: "Үйлдвэрлэл — Зэр",
};

export default function ProductionPage() {
  return <ProductionContent />;
}
