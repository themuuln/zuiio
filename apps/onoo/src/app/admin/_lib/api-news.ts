/**
 * Types and API client for the news (public articles) admin module.
 *
 * The admin form works with a `status` field ("draft" | "published");
 * the API routes normalize it to the `published` boolean column and
 * expose `status` back on every row.
 */
import { request } from "./api";

export interface NewsRow {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  published: boolean;
  /** Derived from `published` for the admin form (draft | published). */
  status: "draft" | "published";
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Joined creator info (admin list only). */
  users?: { email: string } | null;
}

const BASE = "/admin/api/news";

export const newsApi = {
  list: () => request<NewsRow[]>(BASE),
  create: (data: Partial<NewsRow>) =>
    request<NewsRow>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<NewsRow>) =>
    request<NewsRow>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
