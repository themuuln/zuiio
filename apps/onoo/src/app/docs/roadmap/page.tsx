import fs from "fs";
import path from "path";
import { Markdown } from "@/components/markdown";

export default function RoadmapDocsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "docs/ROADMAP.md"),
    "utf-8",
  );
  return <Markdown content={content} />;
}
