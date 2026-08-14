import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <h2 className="text-xl font-semibold">Хуудас олдоогүй</h2>
      <p className="text-sm text-muted-foreground">
        Таны хайсан хуудас байхгүй эсвэл шилжсэн байна.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Хяналтын самбар руу буцах
      </Link>
    </div>
  );
}
