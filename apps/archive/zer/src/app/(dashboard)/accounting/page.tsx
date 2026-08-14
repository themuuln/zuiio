import { AccountingContent } from "./accounting-content";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; consolidated?: string }>;
}) {
  const { branch, consolidated } = await searchParams;
  return (
    <AccountingContent
      urlBranch={branch}
      initialConsolidated={consolidated === "true"}
    />
  );
}
