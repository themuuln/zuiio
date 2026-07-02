import { FileX } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SaleNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <FileX className="size-7 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Борлуулалт олдсонгүй</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Энэ борлуулалт байхгүй эсвэл устгагдсан байна.
        </p>
        <Button asChild size="sm">
          <Link href="/sales">Борлуулалтын жагсаалт руу буцах</Link>
        </Button>
      </div>
    </div>
  );
}
