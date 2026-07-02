import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

// Serves VitePress index.html from public/guide/
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "guide", "index.html");

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
