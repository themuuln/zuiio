import { FileX } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <FileX className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <h2 className="mb-2 text-xl font-semibold">Хуудас олдсонгүй</h2>
        <p className="mb-6 text-muted-foreground">
          Таны хайсан хуудас байхгүй эсвэл устгагдсан байна. Буцаж нүүр хуудас
          руу очно уу.
        </p>
        <Button asChild>
          <Link href="/landing">Нүүр хуудас</Link>
        </Button>
      </div>
    </div>
  );
}
