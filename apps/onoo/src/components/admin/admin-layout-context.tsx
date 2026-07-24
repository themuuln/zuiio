"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface AdminLayoutContextValue {
  /** Whether the mobile sidebar is open */
  mobileSidebarOpen: boolean;
  /** Toggle mobile sidebar */
  toggleMobileSidebar: () => void;
  /** Close mobile sidebar */
  closeMobileSidebar: () => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(
    () => setMobileSidebarOpen((prev) => !prev),
    [],
  );

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <AdminLayoutContext.Provider
      value={{ mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar }}
    >
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) {
    throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  }
  return ctx;
}
