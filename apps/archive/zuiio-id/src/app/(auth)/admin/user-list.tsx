"use client";

import { useState } from "react";

interface User {
  id: string;
  full_name: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export function UserList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Хайх…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Нэр
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Нэвтрэх нэр
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Бүртгүүлсэн
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-foreground">{u.full_name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {u.username ?? "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("mn-MN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Хэрэглэгч олдсонгүй.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
