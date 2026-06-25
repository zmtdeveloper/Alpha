"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createBoard,
  createLabel,
  createProject,
  updateBoard,
  updateProject,
} from "@/lib/workspace/actions";
import type {
  BoardListItem,
  LabelOption,
  ProjectListItem,
  WorkspaceMemberOption,
} from "@/lib/workspace/data";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspace/validation";

type ProjectOption = Pick<ProjectListItem, "id" | "name">;

type ProjectDialogProps = {
  members: WorkspaceMemberOption[];
  project?: ProjectListItem;
  trigger: React.ReactNode;
  workspaceSlug: string;
};

type BoardDialogProps = {
  board?: BoardListItem;
  projects: ProjectOption[];
  trigger: React.ReactNode;
  workspaceSlug: string;
};

type LabelDialogProps = {
  boardSlug: string;
  labels: LabelOption[];
  trigger: React.ReactNode;
  workspaceSlug: string;
};

const statusOptions = [
  ["planned", "Planned"],
  ["active", "Active"],
  ["paused", "Paused"],
  ["completed", "Completed"],
  ["canceled", "Canceled"],
];

const labelColors = ["#9be7c7", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa"];

export function ProjectDialog({
  members,
  project,
  trigger,
  workspaceSlug,
}: ProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    project ? updateProject : createProject,
    initialWorkspaceActionState,
  );

  useCloseOnSuccess(state, () => {
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            Group related boards, owners, and target dates.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          {project ? (
            <input name="projectId" type="hidden" value={project.id} />
          ) : null}
          <FieldError state={state} />
          <Field label="Name" name="name" defaultValue={project?.name} />
          <Field
            label="Description"
            name="description"
            defaultValue={project?.description ?? ""}
            textarea
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <select
                className={selectClassName}
                name="status"
                defaultValue={project?.status ?? "planned"}
              >
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Lead</span>
              <select
                className={selectClassName}
                name="leadId"
                defaultValue={project?.lead_id ?? ""}
              >
                <option value="">No lead</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Start date"
              name="startDate"
              type="date"
              defaultValue={project?.start_date ?? ""}
            />
            <Field
              label="Target date"
              name="targetDate"
              type="date"
              defaultValue={project?.target_date ?? ""}
            />
          </div>
          <DialogFooter>
            <Button disabled={pending} type="submit">
              {pending ? "Saving" : project ? "Save project" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BoardDialog({
  board,
  projects,
  trigger,
  workspaceSlug,
}: BoardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    board ? updateBoard : createBoard,
    initialWorkspaceActionState,
  );

  useCloseOnSuccess(state, () => {
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{board ? "Edit board" : "New board"}</DialogTitle>
          <DialogDescription>
            Boards track task flow for one project.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          {board ? <input name="boardId" type="hidden" value={board.id} /> : null}
          <FieldError state={state} />
          <Field label="Name" name="name" defaultValue={board?.name} />
          <label className="space-y-1 text-sm">
            <span className="font-medium">Project</span>
            <select
              className={selectClassName}
              name="projectId"
              defaultValue={board?.project_id ?? projects[0]?.id ?? ""}
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Description"
            name="description"
            defaultValue={board?.description ?? ""}
            textarea
          />
          <DialogFooter>
            <Button disabled={pending || projects.length === 0} type="submit">
              {pending ? "Saving" : board ? "Save board" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LabelDialog({
  boardSlug,
  labels,
  trigger,
  workspaceSlug,
}: LabelDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createLabel,
    initialWorkspaceActionState,
  );

  useCloseOnSuccess(state, () => {
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New label</DialogTitle>
          <DialogDescription>
            Labels stay scoped to this workspace.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          <input name="boardSlug" type="hidden" value={boardSlug} />
          <FieldError state={state} />
          <Field label="Name" name="name" />
          <div className="grid grid-cols-5 gap-2">
            {labelColors.map((color) => (
              <label
                className="flex h-10 items-center justify-center rounded-md border border-border"
                key={color}
                title={color}
              >
                <input
                  className="sr-only"
                  defaultChecked={color === labelColors[0]}
                  name="color"
                  type="radio"
                  value={color}
                />
                <span
                  className="size-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
          {labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  className="rounded-md border border-border px-2 py-1 text-xs"
                  key={label.id}
                >
                  {label.name}
                </span>
              ))}
            </div>
          ) : null}
          <DialogFooter>
            <Button disabled={pending} type="submit">
              {pending ? "Saving" : "Create label"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  defaultValue,
  label,
  name,
  textarea,
  type = "text",
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          defaultValue={defaultValue ?? ""}
          name={name}
        />
      ) : (
        <Input defaultValue={defaultValue ?? ""} name={name} type={type} />
      )}
    </label>
  );
}

function FieldError({ state }: { state: WorkspaceActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
      role="status"
    >
      {state.message}
    </p>
  );
}

function useCloseOnSuccess(state: WorkspaceActionState, onClose: () => void) {
  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [onClose, state.ok]);
}

export const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
