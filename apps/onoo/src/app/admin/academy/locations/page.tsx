"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type AcademyLocationRow, academyApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const locationSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  address: z.string().optional(),
  city: z.string().optional(),
  hours: z.string().optional(),
  is_active: z.enum(["active", "inactive"]),
});

type LocationFormValues = z.infer<typeof locationSchema>;

export default function AcademyLocationsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<AcademyLocationRow | null>(null);

  const { data: locations = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "locations"],
    queryFn: () => academyApi.locations.list(),
  });

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      hours: "",
      is_active: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LocationFormValues) =>
      academyApi.locations.create({
        name: data.name,
        address: data.address || undefined,
        city: data.city || undefined,
        hours: data.hours || undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "locations"],
      });
      toast.success("Байршил амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: LocationFormValues & { id: string }) =>
      academyApi.locations.update(id, {
        name: data.name,
        address: data.address || undefined,
        city: data.city || undefined,
        hours: data.hours || undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "locations"],
      });
      toast.success("Байршил амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingLocation(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academyApi.locations.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "locations"],
      });
      toast.success("Байршил устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(location: AcademyLocationRow) {
    setEditingLocation(location);
    form.reset({
      name: location.name,
      address: location.address ?? "",
      city: location.city ?? "",
      hours: location.hours ?? "",
      is_active: location.is_active ? "active" : "inactive",
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: LocationFormValues) {
    if (editingLocation) {
      updateMutation.mutate({ ...values, id: editingLocation.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingLocation(null);
      form.reset();
    }
  }

  return (
    <AdminPageLayout
      title="Байршил"
      loading={isPending}
      isEmpty={locations.length === 0}
      emptyTitle="Байршил олдсонгүй"
      emptyDescription="Одоогоор байршил бүртгэгдээгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Байршил засах" : "Шинэ байршил нэмэх"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нэр</FormLabel>
                      <FormControl>
                        <Input placeholder="Байршлын нэр" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хаяг</FormLabel>
                      <FormControl>
                        <Input placeholder="Байршлын хаяг" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хот</FormLabel>
                      <FormControl>
                        <Input placeholder="Хот" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цагийн хуваарь</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Жнь: Да-Ба 09:00-18:00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Төлөв</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Идэвхтэй</SelectItem>
                          <SelectItem value="inactive">Идэвхгүй</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    Цуцлах
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? "Хадгалж байна..." : "Хадгалах"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Нэр</TableHead>
            <TableHead>Хаяг</TableHead>
            <TableHead>Хот</TableHead>
            <TableHead>Цагийн хуваарь</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead className="w-[100px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {location.address ?? "—"}
              </TableCell>
              <TableCell>{location.city ?? "—"}</TableCell>
              <TableCell>{location.hours ?? "—"}</TableCell>
              <TableCell>
                {location.is_active ? (
                  <Badge variant="secondary">Идэвхтэй</Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/40 text-muted-foreground"
                  >
                    Идэвхгүй
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(location)}
                    aria-label={`${location.name} засах`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (
                        window.confirm(`"${location.name}" байршлыг устгах уу?`)
                      ) {
                        deleteMutation.mutate(location.id);
                      }
                    }}
                    aria-label={`${location.name} устгах`}
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
  );
}
