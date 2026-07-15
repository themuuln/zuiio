import { Badge } from "@/components/ui/badge";

export function PublicDocumentShell({
  title,
  subtitle,
  organizationName,
  issueDate,
  status,
  statusVariant,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  organizationName?: string;
  issueDate?: string;
  status?: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const displaySubtitle =
    subtitle ?? [organizationName, issueDate].filter(Boolean).join(" · ");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
          )}
          {status && (
            <Badge variant={statusVariant ?? "outline"}>{status}</Badge>
          )}
        </div>
        {actions && <div className="print:hidden">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
