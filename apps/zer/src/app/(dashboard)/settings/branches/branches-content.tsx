"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  Star,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { withDbCapture } from "@zuiio/capture";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import {
  createBranch,
  deleteBranch,
  setDefaultBranch,
  updateBranch,
} from "./actions";

const createSchema = z.object({
  name: z.string().min(1, "Салбарын нэр шаардлагатай."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Салбарын нэр шаардлагатай."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean | null;
  created_at: string | null;
};

export function BranchesContent() {
  const { organizationId, hasMultiBranch } = useOrgSettings();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [defaultBusy, setDefaultBusy] = useState<string | null>(null);

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          <Building className="size-4 text-muted-foreground" />
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Хаяг",
      cell: ({ row }) => {
        const address = row.original.address;
        return address ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" />
            {address}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Утас",
      cell: ({ row }) => {
        const phone = row.original.phone;
        return phone ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="size-3.5" />
            {phone}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "is_default",
      header: "Төлөв",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_default ? (
            <Badge variant="default">
              <Star className="size-3" />
              Үндсэн
            </Badge>
          ) : (
            <Badge variant="outline">Энгийн</Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex items-center gap-1">
            {!branch.is_default && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={defaultBusy === branch.id}
                onClick={async (e) => {
                  e.stopPropagation();
                  setDefaultBusy(branch.id);
                  const result = await setDefaultBranch(branch.id);
                  setDefaultBusy(null);
                  if (result && "error" in result) {
                    toast.error(result.error);
                  } else {
                    toast.success("Үндсэн салбар болгон өөрчиллөө.");
                  }
                }}
                title="Үндсэн салбар болгох"
              >
                <Star className="size-4" />
              </Button>
            )}

            <Dialog
              open={editTarget?.id === branch.id}
              onOpenChange={(open) => {
                if (!open) setEditTarget(null);
              }}
            >
              <DialogTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(branch);
                  }}
                  title="Засах"
                >
                  <PencilSimple className="size-4" />
                </Button>
              </DialogTrigger>
              {editTarget?.id === branch.id && (
                <EditBranchDialog
                  branch={editTarget}
                  onClose={() => setEditTarget(null)}
                />
              )}
            </Dialog>

            <AlertDialog
              open={deleteTarget?.id === branch.id}
              onOpenChange={(open) => {
                if (!open) setDeleteTarget(null);
              }}
            >
              <AlertDialogTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(branch);
                  }}
                  title="Устгах"
                >
                  <Trash className="size-4" />
                </Button>
              </AlertDialogTrigger>
              {deleteTarget?.id === branch.id && (
                <DeleteBranchDialog
                  branch={deleteTarget}
                  onClose={() => setDeleteTarget(null)}
                />
              )}
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const query = useQuery({
    queryKey: ["branches", "list", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const [branchesResult, permissionsResult] = await Promise.all([
        withDbCapture(
          "page:branches",
          supabase
            .from("branches")
            .select(
              "id, name, slug, address, phone, email, is_default, created_at",
            )
            .eq("organization_id", organizationId)
            .order("name"),
        ),
        supabase.rpc("get_user_permissions"),
      ]);

      return {
        branches: (branchesResult.data ?? []) as Branch[],
        canManage: ((permissionsResult.data ?? []) as string[]).includes(
          "settings.manage",
        ),
      };
    },
    enabled: !!organizationId,
  });

  const { branches = [], canManage = false } = query.data ?? {};
  const isLoading = query.isLoading || query.isFetching;

  // Redirect if multi-branch feature is disabled
  useEffect(() => {
    if (!hasMultiBranch) {
      window.location.href = "/";
    }
  }, [hasMultiBranch]);

  // Don't render anything while redirecting
  if (!hasMultiBranch) return null;

  if (isLoading) {
    return (
      <PageShell
        title="Салбарууд"
        description="Байгууллагын салбаруудын бүртгэл, удирдлага"
      >
        <Card>
          <CardHeader>
            <CardTitle>Салбарын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Хаяг</TableHead>
                  <TableHead>Утас</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead className="w-40">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!canManage) {
    return (
      <PageShell
        title="Салбарууд"
        description="Байгууллагын салбаруудын бүртгэл, удирдлага"
      >
        <Card>
          <CardHeader>
            <CardTitle>Салбарын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Танд салбар удирдах эрх байхгүй байна.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Салбарууд"
      description="Байгууллагын салбаруудын бүртгэл, удирдлага"
    >
      <Card>
        <CardHeader>
          <CardTitle>Салбарын жагсаалт</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger>
                <Button size="sm">
                  <Plus className="size-4" />
                  Шинэ салбар
                </Button>
              </DialogTrigger>
              <CreateBranchDialog onClose={() => setCreateOpen(false)} />
            </Dialog>
          </div>

          {branches.length === 0 ? (
            <ErpEmptyState
              icon={<Building className="size-4" />}
              title="Салбар бүртгэгдээгүй"
              description="Шинэ салбар нэмж, байгууллагын салбаруудыг удирдах."
            />
          ) : (
            <DataTable
              columns={columns}
              data={branches}
              searchColumn="name"
              searchPlaceholder="Салбар хайх..."
              totalLabel="салбар"
              enableSorting
              enableColumnVisibility
            />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function CreateBranchDialog({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = async (data: CreateValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.address) formData.append("address", data.address);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);

    const result = await createBranch(formData);

    if (result && "error" in result) {
      setServerError(result.error);
    } else {
      toast.success("Салбар амжилттай үүсгэгдлээ.");
      onClose();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Шинэ салбар</DialogTitle>
        <DialogDescription>
          Салбарын мэдээллийг оруулна уу. Агуулах болон дансны бүртгэл
          автоматаар үүснэ.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">Нэр</FieldLabel>
          <Input id="name" placeholder="Үндсэн салбар" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="address">
            Хаяг{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input
            id="address"
            placeholder="СБД, 1-р хороо"
            {...register("address")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">
            Утас{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input id="phone" placeholder="99112233" {...register("phone")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">
            И-мэйл{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="branch@example.com"
            {...register("email")}
          />
        </Field>
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Үүсгэж байна..." : "Салбар үүсгэх"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditBranchDialog({
  branch,
  onClose,
}: {
  branch: Branch;
  onClose: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
    },
  });

  const onSubmit = async (data: EditValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("address", data.address ?? "");
    formData.append("phone", data.phone ?? "");
    formData.append("email", data.email ?? "");

    const result = await updateBranch(branch.id, formData);

    if (result && "error" in result) {
      setServerError(result.error);
    } else {
      toast.success("Салбарын мэдээлэл шинэчлэгдлээ.");
      onClose();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Салбар засах</DialogTitle>
        <DialogDescription>
          {branch.name} салбарын мэдээллийг шинэчлэх.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
          <Input id="edit-name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-address">
            Хаяг{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input id="edit-address" {...register("address")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-phone">
            Утас{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input id="edit-phone" {...register("phone")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-email">
            И-мэйл{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Input id="edit-email" type="email" {...register("email")} />
        </Field>
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteBranchDialog({
  branch,
  onClose,
}: {
  branch: Branch;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setServerError(null);
    const result = await deleteBranch(branch.id);
    setDeleting(false);

    if (result && "error" in result) {
      setServerError(result.error);
    } else {
      toast.success("Салбар амжилттай устгагдлаа.");
      onClose();
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Салбар устгах</AlertDialogTitle>
        <AlertDialogDescription className="space-y-2">
          <p>
            Та <strong>{branch.name}</strong> салбарыг устгах гэж байна.
          </p>
          <p>
            Энэ салбартай холбоотой агуулах болон дансны бүртгэл устах болно.
            Хэрэв салбар дээр өгөгдөл (борлуулалт, зарлага, нэхэмжлэл гэх мэт)
            байвал устгах боломжгүй.
          </p>
        </AlertDialogDescription>
      </AlertDialogHeader>
      {serverError && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <WarningCircle className="mt-0.5 size-4 shrink-0" />
          {serverError}
        </div>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>Буцах</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          disabled={deleting}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {deleting ? "Устгаж байна..." : "Устгах"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
