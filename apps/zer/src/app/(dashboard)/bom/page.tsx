import type { Metadata } from "next";
import { BomContent } from "./bom-content";

export const metadata: Metadata = {
  title: "BOM — Зэр",
};

export default function BomPage() {
  return <BomContent />;
}
