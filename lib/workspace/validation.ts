import { z } from "zod";

export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const itemSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const projectStatusSchema = z.enum([
  "planned",
  "active",
  "paused",
  "completed",
  "canceled",
]);

export const taskPrioritySchema = z.enum([
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Use a valid date.",
  });

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) =>
      value === null ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    { message: "Choose a valid member." },
  );

export const projectInputSchema = z.object({
  description: z.string().trim().max(1200).optional(),
  leadId: optionalUuidSchema,
  name: z.string().trim().min(2).max(160),
  startDate: optionalDateSchema,
  status: projectStatusSchema,
  targetDate: optionalDateSchema,
  workspaceSlug: workspaceSlugSchema,
});

export const boardInputSchema = z.object({
  description: z.string().trim().max(800).optional(),
  name: z.string().trim().min(2).max(120),
  projectId: z.coerce.number().int().positive(),
  workspaceSlug: workspaceSlugSchema,
});

export const columnInputSchema = z.object({
  boardSlug: itemSlugSchema,
  name: z.string().trim().min(2).max(80),
  workspaceSlug: workspaceSlugSchema,
});

export const taskInputSchema = z.object({
  assigneeIds: z.array(z.string().uuid()).max(20).default([]),
  boardSlug: itemSlugSchema,
  columnId: z.coerce.number().int().positive(),
  description: z.string().trim().max(4000).optional(),
  dueDate: optionalDateSchema,
  labelIds: z.array(z.coerce.number().int().positive()).max(20).default([]),
  priority: taskPrioritySchema,
  title: z.string().trim().min(2).max(240),
  workspaceSlug: workspaceSlugSchema,
});

export const updateTaskInputSchema = taskInputSchema.extend({
  taskId: z.coerce.number().int().positive(),
});

export const moveTaskInputSchema = z.object({
  boardSlug: itemSlugSchema,
  newSortOrder: z.number().finite(),
  targetColumnId: z.number().int().positive(),
  taskId: z.number().int().positive(),
  workspaceSlug: workspaceSlugSchema,
});

export const deleteInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  workspaceSlug: workspaceSlugSchema,
});

export const boardDeleteInputSchema = deleteInputSchema.extend({
  boardSlug: itemSlugSchema,
});

export type WorkspaceActionState = {
  errors?: Record<string, string[] | undefined>;
  fields?: Record<string, string>;
  message?: string;
  ok?: boolean;
};

export const initialWorkspaceActionState: WorkspaceActionState = {};

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function formStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value !== "");
}
