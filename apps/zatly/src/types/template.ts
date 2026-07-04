export type TemplateCategory = "welcome" | "support" | "sales" | "notifications" | "general";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  channels: string[];
  flow_json: unknown;
  is_builtin: boolean;
  usageCount: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "welcome",
  "support",
  "sales",
  "notifications",
  "general",
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  welcome: "Welcome",
  support: "Support",
  sales: "Sales",
  notifications: "Notifications",
  general: "General",
};
