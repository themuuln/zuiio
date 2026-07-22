import fs from "fs";
import path from "path";
import { Markdown } from "@/components/markdown";

export default function ArchitectureDocsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "docs/ARCHITECTURE.md"),
    "utf-8",
  );
  return <Markdown content={content} />;
}
