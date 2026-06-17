"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RolesClient } from "@/components/roles/roles-client";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import type { RolePermission } from "@/components/roles/roles-client";

interface Role {
  id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
  is_system_role: boolean;
}

type RolesDrawerProps = {
  roles: Role[];
  rolePermissions: RolePermission[];
};

export function RolesDrawer({ roles, rolePermissions }: RolesDrawerProps) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("roles") === "true");
  const initialRef = useRef(open);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={setOpen}
      title="Үүрэг, эрхүүд"
      description="Байгууллагын гишүүдийн үүрэг болон эрхүүдийг удирдах"
      panelWidth="42rem"
      trigger={
        <Button variant="outline" size="sm">
          Үүрэг, эрхүүд удирдах
        </Button>
      }
    >
      <RolesClient roles={roles} rolePermissions={rolePermissions} />
    </SlideInDrawer>
  );
}
