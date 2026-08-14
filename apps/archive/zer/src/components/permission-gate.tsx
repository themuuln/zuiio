"use client";

import type { AppPermission } from "@/lib/permissions";

interface PermissionGateProps {
  permissions: string[];
  required: AppPermission | AppPermission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permissions,
  required,
  children,
  fallback = null,
}: PermissionGateProps) {
  const requiredArray = Array.isArray(required) ? required : [required];
  const hasPermission = requiredArray.every((p) => permissions.includes(p));

  if (!hasPermission) return fallback;
  return <>{children}</>;
}
