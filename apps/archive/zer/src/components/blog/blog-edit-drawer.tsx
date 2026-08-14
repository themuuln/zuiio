"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateBlogPost } from "@/app/(dashboard)/blog/actions";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { blogKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const blogPostSchema = z.object({
  title: z.string().min(1, "Гарчиг шаардлагатай"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Агуулга шаардлагатай"),
  cover_image_url: z.string().optional(),
  is_published: z.boolean().default(false),
});

type BlogPostValues = z.infer<typeof blogPostSchema>;

export type BlogEditData = BlogPostValues & { id: string };

export function BlogEditDrawer({
  post,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  post: BlogEditData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlogPostValues>({
    resolver: zodResolver(blogPostSchema) as Resolver<BlogPostValues>,
    defaultValues: {
      title: post.title,
      excerpt: post.excerpt ?? "",
      content: post.content,
      cover_image_url: post.cover_image_url ?? "",
      is_published: post.is_published,
    },
  });

  // Re-sync form when a different post is selected for edit.
  useEffect(() => {
    if (open) {
      reset({
        title: post.title,
        excerpt: post.excerpt ?? "",
        content: post.content,
        cover_image_url: post.cover_image_url ?? "",
        is_published: post.is_published,
      });
    }
  }, [open, post, reset]);

  const blogMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateBlogPost(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: blogKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      title: formData.get("title")?.toString() ?? "",
      excerpt: formData.get("excerpt")?.toString() ?? "",
      content: formData.get("content")?.toString() ?? "",
      cover_image_url: formData.get("cover_image_url")?.toString() ?? "",
      is_published: formData.get("is_published") === "true",
    }),
  });

  const onSubmit = (data: BlogPostValues) => {
    if (blogMutation.isPending) return;

    const formData = new FormData();
    formData.append("id", post.id);
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("excerpt", data.excerpt ?? "");
    formData.append("cover_image_url", data.cover_image_url ?? "");
    formData.append("is_published", String(data.is_published));

    blogMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Нийтлэл шинэчлэгдсэн.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title="Нийтлэл засах"
      description={post.title}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="blog-edit-form"
            isPending={blogMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="blog-edit-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Гарчиг</FieldLabel>
            <Input placeholder="Нийтлэлийн гарчиг" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>Товч агуулга</FieldLabel>
            <Textarea
              placeholder="Нийтлэлийн товч танилцуулга"
              rows={2}
              {...register("excerpt")}
            />
          </Field>

          <Field>
            <FieldLabel>Агуулга</FieldLabel>
            <Textarea
              placeholder="Нийтлэлийн үндсэн агуулга"
              rows={8}
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Нүүр зурагны URL</FieldLabel>
            <Input placeholder="https://…" {...register("cover_image_url")} />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <FieldLabel>Нийтлэх</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Нийтэлсэн даруйд нийтийн хуудаснаас харагдана
                </p>
              </div>
              <Switch
                {...register("is_published")}
                aria-label="Нийтэлсэн эсэх"
              />
            </div>
          </Field>
        </FieldGroup>

        {blogMutation.error && <ErrorBanner error={blogMutation.error} />}
      </form>
    </SlideInDrawer>
  );
}
