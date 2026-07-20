"use client";

import { AdminErrorBoundary } from "@/components/admin/admin-error-boundary";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return <AdminErrorBoundary>{children}</AdminErrorBoundary>;
}
