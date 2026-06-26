"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { cn } from "@/lib/utils";
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

const labelColors = ["#ef6262", "#7f7af0", "#60a5fa", "#f59e0b", "#6ee7b7"];

const composerContentClassName =
  "max-w-[34rem] gap-0 border-border bg-popover/95 p-0 text-foreground shadow-2xl shadow-black/50";

const composerHeaderClassName = "space-y-1 px-6 pb-0 pt-6";

const composerFormClassName = "space-y-4 px-6 pb-6 pt-4";

const composerFieldClassName =
  "h-10 w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

const composerTextareaClassName =
  "min-h-20 w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

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
      <DialogContent className={composerContentClassName}>
        <DialogHeader className={composerHeaderClassName}>
          <DialogTitle className="text-xl font-semibold">
            {project ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Group related boards, owners, and target dates.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className={composerFormClassName}>
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
            <SelectField
              label="Status"
              name="status"
              defaultValue={project?.status ?? "planned"}
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Lead"
              name="leadId"
              defaultValue={project?.lead_id ?? ""}
            >
              <option value="">No lead</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </SelectField>
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
          <DialogFooter className="pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-foreground text-background hover:bg-foreground/90"
              disabled={pending}
              type="submit"
            >
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
      <DialogContent className={composerContentClassName}>
        <DialogHeader className={composerHeaderClassName}>
          <DialogTitle className="text-xl font-semibold">
            {board ? "Edit board" : "New board"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Boards track task flow for one project.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className={composerFormClassName}>
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          {board ? (
            <input name="boardId" type="hidden" value={board.id} />
          ) : null}
          <FieldError state={state} />
          <Field label="Name" name="name" defaultValue={board?.name} />
          <SelectField
            label="Project"
            name="projectId"
            defaultValue={String(board?.project_id ?? projects[0]?.id ?? "")}
            required
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectField>
          <Field
            label="Description"
            name="description"
            defaultValue={board?.description ?? ""}
            textarea
          />
          <DialogFooter className="pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-foreground text-background hover:bg-foreground/90"
              disabled={pending || projects.length === 0}
              type="submit"
            >
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
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);
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
          <input name="color" type="hidden" value={selectedColor} />
          <FieldError state={state} />
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name</span>
            <Input maxLength={40} name="name" required />
          </label>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Label color">
            {labelColors.map((color) => (
              <button
                aria-checked={selectedColor === color}
                aria-label={`Use ${color} label color`}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border bg-background/40 outline-none transition hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selectedColor === color
                    ? "border-ring shadow-[0_0_0_1px_var(--ring)_inset]"
                    : "border-border",
                )}
                key={color}
                onClick={() => setSelectedColor(color)}
                role="radio"
                type="button"
              >
                <span
                  className="size-5 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.35)_inset]"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
          {labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                  key={label.id}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
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
          className={composerTextareaClassName}
          defaultValue={defaultValue ?? ""}
          name={name}
        />
      ) : (
        <Input
          className={composerFieldClassName}
          defaultValue={defaultValue ?? ""}
          name={name}
          type={type}
        />
      )}
    </label>
  );
}

function SelectField({
  children,
  defaultValue,
  label,
  name,
  required,
}: {
  children: React.ReactNode;
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="relative block">
        <select
          className={selectClassName}
          defaultValue={defaultValue}
          name={name}
          required={required}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </span>
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
  "h-10 w-full appearance-none rounded-md border border-border bg-background/70 px-3 py-2 pr-9 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
