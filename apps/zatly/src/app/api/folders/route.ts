import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  // Query folders from the folders table
  const foldersUrl = new URL(`${context.baseUrl}/folders`);
  foldersUrl.searchParams.set("select", "id,name,created_at");
  foldersUrl.searchParams.set("order", "name.asc");

  const foldersResponse = await fetch(foldersUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  const managedFolders = foldersResponse.ok
    ? ((await foldersResponse.json()) as { id: string; name: string; created_at: string }[])
    : [];

  // Also get folder names from automations (backward compat)
  const autoUrl = new URL(`${context.baseUrl}/automations`);
  autoUrl.searchParams.set("select", "folder");
  autoUrl.searchParams.set("order", "folder.asc");

  const autoResponse = await fetch(autoUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  const autoFolders: string[] = [];
  if (autoResponse.ok) {
    const rows = (await autoResponse.json()) as { folder: string }[];
    autoFolders.push(...new Set(rows.map((r) => r.folder).filter(Boolean)));
  }

  // Union: managed folders first, then any extra folder names from automations
  const managedNames = new Set(managedFolders.map((f) => f.name));
  const extraFolders = autoFolders.filter((f) => !managedNames.has(f));

  const allFolders = [
    ...managedFolders.map((f) => ({ id: f.id, name: f.name, createdAt: f.created_at })),
    ...extraFolders.map((f) => ({ id: f, name: f, createdAt: null })),
  ];

  return NextResponse.json({ folders: allFolders });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  // Check if folder already exists
  const checkUrl = new URL(`${context.baseUrl}/folders`);
  checkUrl.searchParams.set("name", `eq.${name}`);
  checkUrl.searchParams.set("select", "id");
  checkUrl.searchParams.set("limit", "1");

  const checkResponse = await fetch(checkUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (checkResponse.ok) {
    const existing = await checkResponse.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: `Folder "${name}" already exists.` }, { status: 409 });
    }
  }

  // Create the folder
  const createUrl = new URL(`${context.baseUrl}/folders`);
  createUrl.searchParams.set("select", "id,name,created_at");

  const createResponse = await fetch(createUrl.toString(), {
    method: "POST",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    return NextResponse.json({ error: `Failed to create folder: ${text}` }, { status: 500 });
  }

  const rows = await createResponse.json();
  const folder = Array.isArray(rows) ? rows[0] : null;

  return NextResponse.json({
    success: true,
    folder: folder
      ? { id: folder.id, name: folder.name, createdAt: folder.created_at }
      : { id: name, name, createdAt: null },
  });
}
