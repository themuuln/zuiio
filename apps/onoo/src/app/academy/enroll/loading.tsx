import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AcademyEnrollLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10"
      aria-label="Бүртгэлийн хуудас ачаалж байна"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-24" />

      <Card className="shadow-none">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {["f1", "f2", "f3", "f4", "f5"].map((id) => (
            <div key={id} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
