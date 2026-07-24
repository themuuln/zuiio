import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { listProviderNames } from "@/lib/provider/registry";
import { syncAllProvidersFormAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Required env vars per provider for it to be functional.
 * Empty array = always available (mock).
 */
const PROVIDER_ENV_VARS: Record<string, string[]> = {
  mock: [],
  firsty: ["FIRSTY_CLIENT_ID", "FIRSTY_CLIENT_SECRET"],
  "citrus-mobile": ["CITRUS_API_KEY"],
  roamic: ["ROAMIC_EMAIL", "ROAMIC_PASSWORD"],
  bappy: ["BAPPY_CLIENT_ID", "BAPPY_CLIENT_SECRET"],
};

function isConfigured(name: string): boolean {
  const vars = PROVIDER_ENV_VARS[name];
  if (!vars) return false;
  return vars.every((v) => !!process.env[v]);
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

interface ProviderHealth {
  name: string;
  configured: boolean;
  packageCount: number;
  lastSync: string | null;
  avgCost: number;
}

export default async function AdminProvidersPage() {
  const db = getDb();
  const allPackages = await db.listPackages();
  const activePackages = allPackages.filter((p) => !p.is_archived);

  const providerNames = listProviderNames();

  const providers: ProviderHealth[] = providerNames.map((name): ProviderHealth => {
    const pkgs = activePackages.filter((p) => p.provider === name);

    let lastSync: string | null = null;
    let totalCost = 0;

    for (const pkg of pkgs) {
      if (pkg.synced_at && (!lastSync || pkg.synced_at > lastSync)) {
        lastSync = pkg.synced_at;
      }
      totalCost += Number(pkg.cost_usd);
    }

    return {
      name,
      configured: isConfigured(name),
      packageCount: pkgs.length,
      lastSync,
      avgCost: pkgs.length > 0 ? totalCost / pkgs.length : 0,
    };
  });

  const totalPackages = activePackages.length;
  const activeProviders = providers.filter((p) => p.configured).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Provider Health</h1>
        <form action={syncAllProvidersFormAction}>
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sync All Providers
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total packages</p>
            <p className="mt-1 text-2xl font-bold">{totalPackages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active providers</p>
            <p className="mt-1 text-2xl font-bold">{activeProviders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Provider
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Packages
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Last sync
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Avg cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block size-2.5 rounded-full ${
                          p.configured ? "bg-green-500" : "bg-gray-300"
                        }`}
                        role="img"
                        aria-label={
                          p.configured ? "Configured" : "Not configured"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.packageCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTime(p.lastSync)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.packageCount > 0 ? formatUsd(p.avgCost) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
