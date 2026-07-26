"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { leaguesApi, type TeamRow, teamsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityCrud } from "@/hooks/use-entity-crud";

const teamSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  short_code: z.string().min(1, "Товчлол заавал байх ёстой"),
  slug: z.string().min(1, "Slug заавал байх ёстой"),
  primary_color: z.string().optional(),
  social_links: z.record(z.string(), z.string()).optional(),
});
const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/...",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/...",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    placeholder: "https://twitter.com/...",
  },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
  { id: "website", label: "Вэб", placeholder: "https://..." },
] as const;

export default function TeamsPage() {
  const queryClient = useQueryClient();

  const [leagueFilter, setLeagueFilter] = useState<string>("all");

  const { data: leagues = [] } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: () => leaguesApi.list(),
  });

  const effectiveLeagueId = leagueFilter === "all" ? undefined : leagueFilter;

  const { data: teams = [], isPending: teamsPending } = useQuery({
    queryKey: ["admin", "teams", effectiveLeagueId],
    queryFn: () =>
      teamsApi.list(
        effectiveLeagueId ? { league_id: effectiveLeagueId } : undefined,
      ),
  });

  const crud = useEntityCrud({
    api: teamsApi,
    queryKey: ["admin", "teams"],
    schema: teamSchema,
    defaultValues: {
      name: "",
      short_code: "",
      slug: "",
      primary_color: "",
      social_links: {},
    },
    successMessages: {
      create: "Баг амжилттай нэмэгдлээ",
      update: "Баг амжилттай шинэчлэгдлээ",
      delete: "Баг устгагдлаа",
    },
    editMap: (row: TeamRow) => ({
      name: row.name,
      short_code: row.short_code,
      slug: row.slug,
      primary_color: row.primary_color ?? "",
      social_links: row.social_links ?? {},
    }),
  });

  return (
    <>
      <AdminPageLayout
        title="Багууд"
        loading={teamsPending}
        isEmpty={teams.length === 0}
        emptyTitle="Баг олдсонгүй"
        emptyDescription="Баг нэмэх товчийг дарж шинэ баг үүсгэнэ үү."
        actions={
          <>
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-[200px]" aria-label="Лиг сонгох">
                <SelectValue placeholder="Бүх лиг" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх лиг</SelectItem>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={crud.handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Нэмэх
            </Button>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Товчлол</TableHead>
              <TableHead>Өнгө</TableHead>
              <TableHead>Лого</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{team.short_code}</TableCell>
                <TableCell>
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: team.primary_color ?? undefined }}
                    role="img"
                    aria-label={
                      team.primary_color
                        ? `Өнгө: ${team.primary_color}`
                        : "Өнгө сонгогдоогүй"
                    }
                  />
                </TableCell>
                <TableCell>
                  <PhotoUploader
                    entityId={team.id}
                    entityType="team"
                    currentUrl={team.logo_url}
                    onUploaded={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["admin", "teams"],
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  {leagues.find((l) => l.id === team.league_id)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => crud.handleEdit(team)}
                      aria-label={`${team.name} засах`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        crud.handleDelete(
                          team,
                          `"${team.name}" багийг устгах уу?`,
                        )
                      }
                      aria-label={`${team.name} устгах`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Баг засах" : "Шинэ баг нэмэх"}
            </DialogTitle>
          </DialogHeader>
          <Form {...crud.form}>
            <form
              onSubmit={crud.form.handleSubmit(crud.handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={crud.form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр</FormLabel>
                    <FormControl>
                      <Input placeholder="Багийн нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="short_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Товчлол</FormLabel>
                    <FormControl>
                      <Input placeholder="Жнь: ХАС" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Жнь: khas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Өнгө</FormLabel>
                    <FormControl>
                      <input
                        type="color"
                        className="h-10 w-20 cursor-pointer rounded border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Сошиал холбоосууд</p>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <FormField
                    key={platform.id}
                    control={crud.form.control}
                    name={`social_links.${platform.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{platform.label}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={platform.placeholder}
                            value={String(field.value ?? "")}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => crud.handleDialogOpenChange(false)}
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={crud.isMutating}>
                  {crud.isMutating ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
