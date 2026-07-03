import {
  Buildings,
  EnvelopeSimple,
  GearSix,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { getSuperadminEmail } from "@/lib/superadmin";

const baseCards = [
  {
    title: "Байгууллага",
    description: "Нэр, slug, үндсэн валют, ерөнхий мэдээллээ шинэчилнэ.",
    href: "/settings/organization",
    icon: Buildings,
  },
  {
    title: "Хэрэглэгчид",
    description: "Эзэн, админ, ажилтны эрхийг харах, багийн бүтэц хянах.",
    href: "/settings/users",
    icon: Users,
  },
] as const;

const smtpCard = {
  title: "SMTP тохиргоо",
  description: "Имэйл илгээх Gmail бүртгэлүүдийг удирдах.",
  href: "/settings/smtp",
  icon: EnvelopeSimple,
} as const;

export default async function SettingsPage() {
  await requireAppContext();
  const isSuperadmin = await getSuperadminEmail();
  const cards = isSuperadmin ? [...baseCards, smtpCard] : baseCards;

  return (
    <PageShell
      title="Тохиргоо"
      description="Байгууллагын үндсэн мэдээлэл болон багийн бүтэцтэй холбоотой бүх тохиргоо."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.href}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" render={<Link href={card.href} />}>
                  <GearSix data-icon="inline-start" />
                  Нээх
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
