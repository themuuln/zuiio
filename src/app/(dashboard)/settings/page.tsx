import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/erp/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { OrgInfoForm } from "./org-info-form";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const { supabase, organizationId, userId } = await requireAppContext();

  const [orgResult, profileResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, slug, company_type, currency")
      .eq("id", organizationId)
      .single(),
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
  ]);

  const org = orgResult.data;
  const profile = profileResult.data;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Тохиргоо</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Байгууллага, хэрэглэгчийн тохиргоо
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Байгууллагын мэдээлэл</CardTitle>
          <CardDescription>
            Байгууллагын нэр болон холбоосыг өөрчлөх
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgInfoForm
            initialName={org?.name ?? ""}
            initialSlug={org?.slug ?? ""}
          />
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Хэрэглэгчийн мэдээлэл</CardTitle>
          <CardDescription>Таны нэрийг өөрчлөх</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialFullName={profile?.full_name ?? ""} />
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Гадаад байдал</CardTitle>
          <CardDescription>
            Гэрэлтэй эсвэл харанхуй горим сонгох
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Гэрэлтэй / Харанхуй горим
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <WarningCircle className="size-5" />
            Аюултай бүс
          </CardTitle>
          <CardDescription>
            Энд хийх үйлдлүүд эргэлт буцалтгүй байж болно
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Энэ хэсэг удахгүй нэмэгдэх болно.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
