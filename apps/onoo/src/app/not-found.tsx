import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>Хуудас олдсонгүй</CardTitle>
          <CardDescription>
            Таны хайсан хуудас байхгүй эсвэл устгагдсан байна.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button variant="outline">
            <Link href="/">Нүүр хуудас руу буцах</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
