"use client";

interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  joined_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэн",
  admin: "Админ",
  member: "Гишүүн",
  viewer: "Үзэгч",
};

export function OrgList({ memberships }: { memberships: Membership[] }) {
  if (memberships.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Та ямар нэг байгууллагад харьяалагдахгүй байна.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Байгууллага үүсгэх эсвэл урилга хүлээн авна уу.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {memberships.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {m.org_id.slice(0, 8)}
            </span>
            <span className="text-xs text-muted-foreground">
              Эрх: {ROLE_LABELS[m.role_name] ?? m.role_name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(m.joined_at).toLocaleDateString("mn-MN")}
          </span>
        </div>
      ))}
    </div>
  );
}
