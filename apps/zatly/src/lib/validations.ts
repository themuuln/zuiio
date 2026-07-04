import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name required").max(100),
  lastName: z.string().min(1, "Last name required").max(100),
  fullName: z.string().max(200).optional(),
  gender: z.enum(["female", "male", "unknown"]).optional(),
  language: z.string().max(50).optional(),
  psid: z.string().max(100).optional(),
});

export const updateContactSchema = z.object({
  tags: z.array(z.string()).optional(),
  pausedAutomations: z.boolean().optional(),
  status: z.enum(["subscribed", "unsubscribed"]).optional(),
});

const conditionSchema = z.object({
  field: z.string().min(1, "Condition field is required"),
  operator: z.string().min(1, "Condition operator is required"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const actionSchema = z.object({
  type: z.string().min(1, "Action type is required"),
  params: z.record(z.string(), z.any()).optional().default({}),
});

const EVENT_TYPES = [
  "message_received",
  "tag_added",
  "contact_subscribed",
  "contact_unsubscribed",
  "automation_triggered",
] as const;

const eventEnum = z.enum(EVENT_TYPES, { message: "Invalid event type. Must be one of: message_received, tag_added, contact_subscribed, contact_unsubscribed, automation_triggered" });

export const createRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  event: eventEnum,
  conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
  actions: z.array(actionSchema).min(1, "At least one action is required"),
  enabled: z.boolean().optional().default(true),
  automation_id: z.string().uuid().optional().nullable(),
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  event: eventEnum.optional(),
  conditions: z.array(conditionSchema).min(1).optional(),
  actions: z.array(actionSchema).min(1).optional(),
  enabled: z.boolean().optional(),
  automation_id: z.string().uuid().optional().nullable(),
});

export const createAutomationSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  folder: z.string().max(100).optional(),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  folder: z.string().max(100).optional(),
  status: z.enum(["live", "draft", "off"]).optional(),
  trigger: z.enum(["keyword", "default", "button", "ref"]).optional(),
  triggerState: z.enum(["active", "inactive"]).optional(),
  keywords: z.array(z.string()).optional(),
  channel: z.string().max(100).optional(),
});

export const saveFlowSchema = z.object({
  nodes: z.array(z.any()).min(1, "At least one node required"),
  edges: z.array(z.any()),
});

export const shareAutomationSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const importCsvQuerySchema = z.object({
  file: z.any(), // File type handled separately
});

export const sendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Text body is required"),
  html: z.string().optional(),
});
