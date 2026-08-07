import fs from "node:fs";
import path from "node:path";
import { Markdown } from "@/components/markdown";

export default function FeaturesDocsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "docs/FEATURES.md"),
    "utf-8",
  );
  return <Markdown content={content} />;
}
