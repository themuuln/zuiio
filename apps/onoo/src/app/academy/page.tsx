import type { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type AcademyData,
  getAcademyData,
} from "../lib/data";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Академи — Оноо",
  description: "Академийн хөтөлбөр, дасгалжуулагчид, байршил.",
};

export default async function AcademyPage() {
  await connection();
  const academyData = await getAcademyData();

  if (!academyData) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Академи</h1>
        <p className="text-muted-foreground">
          Одоогоор академийн мэдээлэл байхгүй байна.
        </p>
        <p className="text-sm text-muted-foreground">
          Админ хэсгээс академийн хөтөлбөр, дасгалжуулагч, байршлын мэдээлэл
          нэмэх боломжтой.
        </p>
      </main>
    );
  }

  const { academy_name, programs, trainers, locations } = academyData;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* Academy header */}
      <section className="flex items-center gap-4 py-8">
        {academyData.academy_logo_url ? (
          <Image
            src={academyData.academy_logo_url}
            alt={academy_name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {academy_name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{academy_name}</h1>
          <p className="text-muted-foreground">
            Академийн хөтөлбөр, дасгалжуулагчид, байршил
          </p>
        </div>
      </section>

      {/* Programs */}
      <section aria-labelledby="programs-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="programs-heading" className="text-xl font-semibold">
            Хөтөлбөрүүд
          </h2>
          <Badge variant="secondary">{programs.length}</Badge>
        </div>
        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Одоогоор хөтөлбөр байхгүй.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card key={program.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {program.name}
                    </CardTitle>
                    {program.price_mnt != null && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {program.price_mnt.toLocaleString()}₮
                      </span>
                    )}
                  </div>
                  {program.age_group && (
                    <Badge variant="outline" className="w-fit">
                      {program.age_group}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {program.description}
                    </p>
                  )}
                  {program.duration_weeks && (
                    <p className="text-xs text-muted-foreground">
                      Хугацаа: {program.duration_weeks} долоо хоног
                    </p>
                  )}
                  {program.location_name && (
                    <p className="text-xs text-muted-foreground">
                      Байршил: {program.location_name}
                      {program.location_city ? `, ${program.location_city}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Trainers */}
      <section aria-labelledby="trainers-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="trainers-heading" className="text-xl font-semibold">
            Дасгалжуулагчид
          </h2>
          <Badge variant="secondary">{trainers.length}</Badge>
        </div>
        {trainers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Одоогоор дасгалжуулагчийн мэдээлэл байхгүй.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((trainer) => (
              <Card key={trainer.id}>
                <CardHeader className="flex flex-row items-center gap-4">
                  {trainer.photo_url ? (
                    <Image
                      src={trainer.photo_url}
                      alt={trainer.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold">
                      {trainer.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">{trainer.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trainer.specialties && trainer.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trainer.specialties.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {trainer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {trainer.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Locations */}
      <section aria-labelledby="locations-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="locations-heading" className="text-xl font-semibold">
            Байршил
          </h2>
          <Badge variant="secondary">{locations.length}</Badge>
        </div>
        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Одоогоор байршлын мэдээлэл байхгүй.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <CardHeader>
                  <CardTitle className="text-base">{loc.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {loc.city && (
                    <p className="text-sm text-muted-foreground">{loc.city}</p>
                  )}
                  {loc.address && (
                    <p className="text-sm text-muted-foreground">
                      {loc.address}
                    </p>
                  )}
                  {loc.hours && (
                    <p className="text-sm text-muted-foreground">
                      Цагийн хуваарь: {loc.hours}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
