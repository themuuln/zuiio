import * as fs from "fs";
import * as path from "path";
import Module from "module";

// Mock @/lib/supabase/server
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (
    request === "@/lib/supabase/server" ||
    request.endsWith("supabase/server") ||
    request.includes("lib/supabase/server")
  ) {
    return {
      createClient: async () => {
        return {
          auth: {
            signInWithPassword: async ({ email, password }: any) => {
              console.log("Mocked signInWithPassword called with email:", email);
              return { data: { user: { id: "mock-uid" } }, error: null };
            },
          },
        };
      },
    };
  }
  if (request === "next/headers") {
    return {
      cookies: async () => ({
        getAll: () => [],
        set: () => {},
        get: () => undefined,
      }),
    };
  }
  return originalLoad.apply(this, arguments);
};

// Load environment variables
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

import { login } from "../src/app/[locale]/auth/login/actions";

async function main() {
  const formData = new FormData();
  formData.append("identifier", "mechanic4");
  formData.append("password", "Tolom!11");

  console.log("Calling login action...");
  const result = await login({}, formData);
  console.log("Result:", result);
}

main().catch(console.error);
