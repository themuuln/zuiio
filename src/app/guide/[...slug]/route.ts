import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Catch-all route: serves VitePress static pages from public/guide/
// This is needed because Next.js app router catches /guide before
// the static file fallback kicks in.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const segments = slug ?? [];
  const filePath = path.join(
    process.cwd(),
    "public",
    "guide",
    ...segments,
    segments.length > 0 && !segments[segments.length - 1]?.endsWith(".html")
      ? "index.html"
      : "",
  );

  const alternatePath = segments.length > 0
    ? path.join(process.cwd(), "public", "guide", ...segments) + ".html"
    : path.join(process.cwd(), "public", "guide", "index.html");

  const targetPath = fs.existsSync(filePath)
    ? filePath
    : fs.existsSync(alternatePath)
      ? alternatePath
      : null;

  if (!targetPath) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 },
    );
  }

  const content = fs.readFileSync(targetPath, "utf-8");
  return new NextResponse(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
