import fs from "node:fs";
import path from "node:path";
import { Markdown } from "@/components/markdown";

export default function DesignDocsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "docs/DESIGN.md"),
    "utf-8",
  );
  return <Markdown content={content} />;
}
