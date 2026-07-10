"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import type { BrandConfig } from "@/lib/branding";
import { BrandingForm } from "./branding/branding-form";

type BrandingDrawerProps = {
  initialConfig: BrandConfig;
};

export function BrandingDrawer({ initialConfig }: BrandingDrawerProps) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("branding") === "true");
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
      title="Брэндинг"
      description="Байгууллагын өнгө, загвар, лого тохируулах"
      panelWidth="42rem"
      trigger={
        <Button variant="outline" size="sm">
          Брэндинг тохируулах
        </Button>
      }
    >
      <BrandingForm initialConfig={initialConfig} />
    </SlideInDrawer>
  );
}
