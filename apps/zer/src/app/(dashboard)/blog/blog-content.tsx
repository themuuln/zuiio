"use client";

import { NotePencil, Plus, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BlogCreateDrawer } from "@/components/blog/blog-create-drawer";
import {
  type BlogEditData,
  BlogEditDrawer,
} from "@/components/blog/blog-edit-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { actionsColumn } from "@/lib/table-columns";
import { deleteBlogPost, toggleBlogPostPublished } from "./actions";
import type { BlogRow } from "./page";

function toEditData(d: BlogRow): BlogEditData {
  return {
    id: d.id,
    title: d.title,
    excerpt: d.excerpt ?? "",
    content: d.content,
    cover_image_url: d.cover_image_url ?? "",
    is_published: d.is_published,
  };
}

export function BlogContent({ posts }: { posts: BlogRow[] }) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [editPost, setEditPost] = useState<BlogEditData | null>(null);
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/blog");
    }
  }, []);

  const runToggle = async (post: BlogRow, isPublished: boolean) => {
    const result = await toggleBlogPostPublished(post.id, isPublished);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      isPublished ? "Нийтлэл нээлттэй боллоо." : "Нийтлэл хаагдлаа.",
    );
  };

  const runDelete = async (post: BlogRow) => {
    const confirmed = window.confirm(
      `"${post.title}" нийтлэлийг устгахдаа итгэлтэй байна уу?`,
    );
    if (!confirmed) return;
    const result = await deleteBlogPost(post.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Нийтлэл устгагдлаа.");
  };

  if (posts.length === 0) {
    return (
      <PageShell title="Блог" description="Байгууллагын блог, нийтлэлүүд">
        <ErpEmptyState
          icon={<Plus className="size-4" />}
          title="Нийтлэл байхгүй"
          description="Шинэ нийтлэл үүсгэж, нийтийн хуудаснаас нийтлээрэй."
          action={
            <BlogCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<BlogRow>[] = [
    {
      accessorKey: "title",
      header: "Гарчиг",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium">{row.original.title}</p>
          {row.original.excerpt && (
            <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">
              {row.original.excerpt}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Холбоос",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          /{row.original.slug}
        </code>
      ),
    },
    {
      id: "is_published",
      header: "Нийтэлсэн",
      cell: ({ row }) => (
        <Badge variant={row.original.is_published ? "default" : "secondary"}>
          {row.original.is_published ? "Тийм" : "Үгүй"}
        </Badge>
      ),
    },
    {
      id: "published_at",
      header: "Нийтэлсэн огноо",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.published_at
            ? formatDate(row.original.published_at)
            : "—"}
        </span>
      ),
    },
    actionsColumn("", (row) => (
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1.5">
          <Switch
            checked={row.is_published}
            onCheckedChange={(checked) => runToggle(row, checked)}
            aria-label="Нийтэлсэн эсэх"
          />
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditPost(toEditData(row))}
        >
          <NotePencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => runDelete(row)}
        >
          <Trash className="size-4" />
        </Button>
      </div>
    )),
  ];

  return (
    <>
      <PageShell
        title="Блог"
        description="Байгууллагын блог, нийтлэлүүд"
        actions={
          <BlogCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
        }
      >
        <DataTable
          columns={columns}
          data={posts}
          searchColumn="title"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="нийтлэл"
          enableSorting
          enableColumnVisibility
        />
      </PageShell>
      <BlogEditDrawer
        post={editPost ?? ({} as BlogEditData)}
        open={!!editPost}
        onOpenChange={(open) => {
          if (!open) setEditPost(null);
        }}
      />
    </>
  );
}
