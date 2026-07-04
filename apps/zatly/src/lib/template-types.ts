export type TemplateRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  flow_json: unknown;
  is_builtin: boolean;
  usage_count: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  flow_json: unknown;
  is_builtin: boolean;
  usageCount: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    channels: row.channels,
    flow_json: row.flow_json,
    is_builtin: row.is_builtin,
    usageCount: row.usage_count,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
