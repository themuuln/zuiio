import type { Metadata } from "next";
import { AttributeSettingsContent } from "./attribute-settings-content";

export const metadata: Metadata = {
  title: "Бүтээгдэхүүний шинж чанар",
};

export default function AttributeSettingsPage() {
  return <AttributeSettingsContent />;
}
