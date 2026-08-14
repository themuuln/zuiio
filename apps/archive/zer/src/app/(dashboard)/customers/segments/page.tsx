import type { Metadata } from "next";
import { SegmentSettingsContent } from "./segment-settings-content";

export const metadata: Metadata = {
  title: "Үйлчлүүлэгчийн бүлэг",
};

export default function SegmentSettingsPage() {
  return <SegmentSettingsContent />;
}
