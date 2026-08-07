import {
  ArrowRight,
  Award,
  Building,
  Calendar,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getPublicAcademyData } from "../lib/data";

export const metadata: Metadata = {
  title: "Академи — Оноо",
  description:
    "Манай академийн хөтөлбөр, дасгалжуулагчид, байршлуудтай танилцаж, бүртгүүлэх.",
};

export default async function AcademyPage() {
  const { profile, programs, trainers, locations } =
    await getPublicAcademyData();

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center">
        <div className="relative mb-4 h-32 w-32">
          <Image
            src="/illustrations/selecting-team.svg"
            alt="Академи"
            fill
            className="object-contain opacity-60"
          />
        </div>
        <h1 className="font-display text-3xl font-bold">Академи</h1>
        <p className="max-w-md text-muted-foreground">
          Одоогоор академийн мэдээлэл байхгүй байна. Тун удахгүй...
        </p>
      </main>
    );
  }

  const programCount = programs.length;
  const trainerCount = trainers.length;
  const locationCount = locations.length;

  return (
    <main className="flex flex-col">
      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sidebar via-sidebar to-sidebar/95 text-sidebar-foreground">
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-warning/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            {profile.logo_url ? (
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-background/10 ring-2 ring-white/10 sm:h-36 sm:w-36">
                <Image
                  src={profile.logo_url}
                  alt={profile.name}
                  fill
                  className="object-contain p-3"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-warning/20 text-4xl font-bold text-warning sm:h-36 sm:w-36">
                {profile.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-warning">
                Баскетболын академи
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {profile.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-sidebar-foreground/60">
                Мэргэжлийн дасгалжуулагчдын удирдлага дор сагсан бөмбөгийн ур
                чадвараа хөгжүүлж, өсөлт дэвшилд хүрээрэй.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sidebar-foreground/60 sm:justify-start">
                {profile.contact_phone && (
                  <a
                    href={`tel:${profile.contact_phone}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-sidebar-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {profile.contact_phone}
                  </a>
                )}
                {profile.contact_email && (
                  <a
                    href={`mailto:${profile.contact_email}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-sidebar-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {profile.contact_email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════ */}
      {(programCount > 0 || trainerCount > 0 || locationCount > 0) && (
        <section className="border-b bg-card">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-6 sm:gap-12 sm:py-8">
            {programCount > 0 && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{programCount}</p>
                  <p className="text-xs text-muted-foreground">Хөтөлбөр</p>
                </div>
              </div>
            )}
            {trainerCount > 0 && (
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{trainerCount}</p>
                  <p className="text-xs text-muted-foreground">Дасгалжуулагч</p>
                </div>
              </div>
            )}
            {locationCount > 0 && (
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{locationCount}</p>
                  <p className="text-xs text-muted-foreground">Байршил</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Programs ── */}
        {programs.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-warning" />
              <h2 className="font-display text-2xl font-bold">Хөтөлбөрүүд</h2>
            </div>
            <p className="mb-8 text-sm text-muted-foreground">
              Нас, түвшинд тохирсон өргөн сонголттой хөтөлбөрүүд
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Card
                  key={program.id}
                  className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                >
                  {program.price_mnt != null && (
                    <div className="absolute right-3 top-3 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                      {program.price_mnt.toLocaleString()} ₮
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg group-hover:text-warning transition-colors">
                      {program.name}
                    </CardTitle>
                    {program.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {program.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {program.age_group && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium">
                          <Users className="h-3.5 w-3.5" />
                          {program.age_group} нас
                        </span>
                      )}
                      {program.duration_weeks && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {program.duration_weeks} долоо хоног
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/academy/enroll?program=${program.id}&name=${encodeURIComponent(program.name)}`}
                      >
                        <Button className="w-full group-hover:bg-warning/90 transition-colors">
                          Бүртгүүлэх
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── About / Why Choose Us ── */}
        {(trainers.length > 0 || programs.length > 0 || profile.settings) && (
          <section>
            <h2 className="font-display mb-2 text-2xl font-bold">
              Бидний тухай
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              Яагаад биднийг сонгох вэ?
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {trainers.length > 0 && (
                <Card className="border-t-2 border-t-warning">
                  <CardHeader>
                    <Star className="mb-2 h-8 w-8 text-warning" />
                    <CardTitle className="text-base">
                      Мэргэжлийн дасгалжуулагчид
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {trainerCount} туршлагатай дасгалжуулагч таны ур чадварыг
                      хөгжүүлэхэд бэлэн байна. Тэд тус бүр өөрийн гэсэн
                      мэргэшил, арга барилтай.
                    </p>
                  </CardContent>
                </Card>
              )}
              {programs.length > 0 && (
                <Card className="border-t-2 border-t-warning">
                  <CardHeader>
                    <Award className="mb-2 h-8 w-8 text-warning" />
                    <CardTitle className="text-base">
                      Өргөн сонголттой хөтөлбөр
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {programCount} төрлийн хөтөлбөрөөс нас, түвшин,
                      сонирхолдоо тохирсоныг сонгох боломжтой. Эхлэгчээс
                      мэргэжлийн түвшин хүртэл.
                    </p>
                  </CardContent>
                </Card>
              )}
              {locationCount > 0 && (
                <Card className="border-t-2 border-t-warning">
                  <CardHeader>
                    <Building className="mb-2 h-8 w-8 text-warning" />
                    <CardTitle className="text-base">
                      Тохиромжтой байршил
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {locationCount} тохилог байршилд үйл ажиллагаа явуулж
                      байна.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* ── Trainers ── */}
        {trainers.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              <h2 className="font-display text-2xl font-bold">
                Дасгалжуулагчид
              </h2>
            </div>
            <p className="mb-8 text-sm text-muted-foreground">
              Манай туршлагатай дасгалжуулагчдын баг
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trainers.map((trainer) => (
                <Card
                  key={trainer.id}
                  className="group overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    {trainer.photo_url ? (
                      <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full ring-2 ring-muted">
                        <Image
                          src={trainer.photo_url}
                          alt={trainer.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10 text-2xl font-bold text-warning ring-2 ring-warning/20">
                        {trainer.name.charAt(0)}
                      </div>
                    )}
                    <p className="text-base font-semibold">{trainer.name}</p>
                    {trainer.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                        {trainer.specialties.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {trainer.bio && (
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {trainer.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── Locations ── */}
        {locations.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-warning" />
              <h2 className="font-display text-2xl font-bold">Байршлууд</h2>
            </div>
            <p className="mb-8 text-sm text-muted-foreground">
              Бидний үйл ажиллагаа явуулдаг газрууд
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className="overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">{location.name}</p>
                      {location.address && (
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                          {location.city ? `, ${location.city}` : ""}
                        </p>
                      )}
                      {location.hours && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {location.hours}
                        </div>
                      )}
                      {location.address && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            [location.address, location.city]
                              .filter(Boolean)
                              .join(", "),
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-warning hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          Газрын зураг дээр нээх
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Phone className="h-5 w-5 text-warning" />
            <h2 className="font-display text-2xl font-bold">Холбогдох</h2>
          </div>
          <p className="mb-8 text-sm text-muted-foreground">
            Бидэнтэй холбогдох
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {profile.contact_phone && (
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Утас</p>
                    <a
                      href={`tel:${profile.contact_phone}`}
                      className="text-base font-semibold hover:text-warning transition-colors"
                    >
                      {profile.contact_phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            {profile.contact_email && (
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">И-мэйл</p>
                    <a
                      href={`mailto:${profile.contact_email}`}
                      className="text-base font-semibold hover:text-warning transition-colors"
                    >
                      {profile.contact_email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sidebar to-sidebar/95 px-6 py-12 text-center text-sidebar-foreground sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-warning/10 blur-3xl" />
          <div className="relative">
            <GraduationCap className="mx-auto mb-4 h-10 w-10 text-warning" />
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Бүртгэл нээлттэй
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-sidebar-foreground/60">
              Сагсан бөмбөгийн ур чадвараа хөгжүүлж, шинэ найзуудтай танилцаж,
              хөгжилтэй цагийг өнгөрүүлээрэй. Бүртгүүлэхэд л хангалттай.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={
                  programs.length > 0
                    ? `/academy/enroll?program=${programs[0]?.id}&name=${encodeURIComponent(programs[0]?.name ?? "")}`
                    : "/academy/enroll"
                }
              >
                <Button
                  size="lg"
                  className="bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  Бүртгүүлэх
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="tel:+976">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/10 text-sidebar-foreground hover:bg-white/10"
                >
                  Захиалга авах
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
