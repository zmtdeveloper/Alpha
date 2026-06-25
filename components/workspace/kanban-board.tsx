"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  Plus,
  Tag,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import type * as React from "react";

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
import { DeleteButton } from "@/components/workspace/delete-button";
import { LabelDialog, selectClassName } from "@/components/workspace/forms";
import { createColumn, createTask, moveTask, updateTask } from "@/lib/workspace/actions";
import type {
  BoardColumn,
  BoardDetail,
  BoardTask,
} from "@/lib/workspace/data";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspace/validation";

type KanbanBoardProps = {
  board: BoardDetail;
  workspaceSlug: string;
};

const priorityLabels = {
  high: "High",
  low: "Low",
  medium: "Medium",
  none: "None",
  urgent: "Urgent",
};

const priorityOptions = Object.entries(priorityLabels);

export function KanbanBoard({ board, workspaceSlug }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useOptimistic(
    board.columns,
    (_currentColumns, nextColumns: BoardColumn[]) => nextColumns,
  );
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const taskCount = useMemo(
    () => columns.reduce((total, column) => total + column.tasks.length, 0),
    [columns],
  );

  function handleDragStart(event: DragStartEvent) {
    const taskId = taskIdFromDragId(event.active.id);

    if (!taskId) {
      return;
    }

    setActiveTask(findTask(columns, taskId));
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = taskIdFromDragId(event.active.id);
    const target = getDropTarget(columns, event.over?.id);

    setActiveTask(null);

    if (!taskId || !target) {
      return;
    }

    const source = findTaskLocation(columns, taskId);

    if (
      source?.columnId === target.columnId &&
      source.index === target.index
    ) {
      return;
    }

    const nextColumns = moveTaskLocally(
      columns,
      taskId,
      target.columnId,
      target.index,
    );
    const targetColumn = nextColumns.find((column) => column.id === target.columnId);
    const targetIndex =
      targetColumn?.tasks.findIndex((task) => task.id === taskId) ?? -1;

    if (!targetColumn || targetIndex < 0) {
      return;
    }

    const newSortOrder = calculateSortOrder(targetColumn.tasks, targetIndex);
    const optimisticColumns = updateTaskSortOrder(nextColumns, taskId, newSortOrder);
    const snapshot = columns;

    startTransition(async () => {
      setColumns(optimisticColumns);

      const result = await moveTask({
        boardSlug: board.slug,
        newSortOrder,
        targetColumnId: target.columnId,
        taskId,
        workspaceSlug,
      });

      if (!result.ok) {
        setColumns(snapshot);
        window.alert(result.message ?? "Task move failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {board.projectName}
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {board.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {board.description || "Move tasks through the board as work changes."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LabelDialog
            boardSlug={board.slug}
            labels={board.labels}
            trigger={
              <Button variant="outline">
                <Tag />
                Label
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
          <ColumnDialog
            boardSlug={board.slug}
            trigger={
              <Button variant="outline">
                <Plus />
                Column
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Tasks" value={taskCount.toString()} />
        <Metric label="Columns" value={columns.length.toString()} />
        <Metric label="Labels" value={board.labels.length.toString()} />
      </section>

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <section className="flex min-h-[520px] gap-3 overflow-x-auto pb-2">
          {columns.map((column) => (
            <KanbanColumn
              board={board}
              column={column}
              key={column.id}
              onOpenTask={setSelectedTask}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </section>
        <DragOverlay>
          {activeTask ? <TaskCardSurface task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask ? (
        <TaskDialog
          board={board}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null);
            }
          }}
          open
          task={selectedTask}
          workspaceSlug={workspaceSlug}
        />
      ) : null}
    </div>
  );
}

function KanbanColumn({
  board,
  column,
  onOpenTask,
  workspaceSlug,
}: {
  board: BoardDetail;
  column: BoardColumn;
  onOpenTask: (task: BoardTask) => void;
  workspaceSlug: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnDragId(column.id),
  });

  return (
    <div className="flex w-[min(82vw,320px)] shrink-0 flex-col rounded-lg border border-border bg-muted/30">
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <div className="flex min-w-0 items-center gap-2">
          <GripVertical className="size-4 text-muted-foreground" />
          <h2 className="truncate text-sm font-semibold">{column.name}</h2>
          <span className="rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center">
          <TaskDialog
            board={board}
            columnId={column.id}
            trigger={
              <Button aria-label="New task" size="icon" variant="ghost">
                <Plus />
              </Button>
            }
            workspaceSlug={workspaceSlug}
          />
          <DeleteButton
            boardSlug={board.slug}
            id={column.id}
            kind="column"
            label="Delete column"
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
      <SortableContext
        items={column.tasks.map((task) => taskDragId(task.id))}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={
            isOver
              ? "flex-1 space-y-2 bg-primary/5 p-2"
              : "flex-1 space-y-2 p-2"
          }
          ref={setNodeRef}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              onOpen={() => onOpenTask(task)}
              task={task}
            />
          ))}
          {column.tasks.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Drop tasks here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  onOpen,
  task,
}: {
  onOpen: () => void;
  task: BoardTask;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: taskDragId(task.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={isDragging ? "opacity-40" : undefined}
      ref={setNodeRef}
      style={style}
    >
      <TaskCardSurface
        dragAttributes={attributes}
        dragListeners={listeners}
        onOpen={onOpen}
        task={task}
      />
    </div>
  );
}

function TaskCardSurface({
  dragAttributes,
  dragListeners,
  onOpen,
  task,
}: {
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  onOpen?: () => void;
  task: BoardTask;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/60">
      <div className="flex items-start justify-between gap-3">
        <button
          className="line-clamp-2 min-w-0 flex-1 text-left text-sm font-medium leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onOpen}
          type="button"
        >
          {task.title}
        </button>
        <span className="rounded-md bg-secondary px-2 py-1 text-[11px] uppercase text-secondary-foreground">
          {priorityLabels[task.priority]}
        </span>
        {dragListeners ? (
          <button
            aria-label={`Move ${task.title}`}
            className="rounded p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
      </div>
      {task.labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              className="rounded px-1.5 py-0.5 text-[11px] text-background"
              key={label.id}
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3" />
          {task.due_date ?? "No due date"}
        </span>
        <span className="inline-flex -space-x-1">
          {task.assignees.length > 0 ? (
            task.assignees.slice(0, 3).map((assignee) => (
              <span
                className="flex size-6 items-center justify-center rounded-md border border-card bg-secondary text-[10px] font-semibold text-secondary-foreground"
                key={assignee.id}
                title={assignee.fullName}
              >
                {assignee.initials}
              </span>
            ))
          ) : (
            <UserRound className="size-4" />
          )}
        </span>
      </div>
    </div>
  );
}

function TaskDialog({
  board,
  columnId,
  onOpenChange,
  open: controlledOpen,
  task,
  trigger,
  workspaceSlug,
}: {
  board: BoardDetail;
  columnId?: number;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  task?: BoardTask;
  trigger?: React.ReactNode;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [state, setState] = useState<WorkspaceActionState>(
    initialWorkspaceActionState,
  );
  const [pending, startSaveTransition] = useTransition();

  function formAction(formData: FormData) {
    startSaveTransition(async () => {
      const result = await (task ? updateTask : createTask)(
        initialWorkspaceActionState,
        formData,
      );
      setState(result);

      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Task details" : "New task"}</DialogTitle>
          <DialogDescription>
            Keep the task scoped to this board and project.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          <input name="boardSlug" type="hidden" value={board.slug} />
          {task ? <input name="taskId" type="hidden" value={task.id} /> : null}
          <FieldError state={state} />
          <label className="space-y-1 text-sm">
            <span className="font-medium">Title</span>
            <Input name="title" defaultValue={task?.title ?? ""} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              name="description"
              defaultValue={task?.description ?? ""}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Column</span>
              <select
                className={selectClassName}
                name="columnId"
                defaultValue={task?.column_id ?? columnId}
              >
                {board.columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Priority</span>
              <select
                className={selectClassName}
                name="priority"
                defaultValue={task?.priority ?? "none"}
              >
                {priorityOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Due date</span>
              <Input name="dueDate" type="date" defaultValue={task?.due_date ?? ""} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MultiSelect
              label="Assignees"
              name="assigneeIds"
              options={board.members.map((member) => ({
                label: member.fullName,
                value: member.id,
              }))}
              values={task?.assignees.map((member) => member.id) ?? []}
            />
            <MultiSelect
              label="Labels"
              name="labelIds"
              options={board.labels.map((label) => ({
                label: label.name,
                value: String(label.id),
              }))}
              values={task?.labels.map((label) => String(label.id)) ?? []}
            />
          </div>
          <DialogFooter>
            {task ? (
              <DeleteButton
                boardSlug={board.slug}
                id={task.id}
                kind="task"
                label="Delete task"
                workspaceSlug={workspaceSlug}
              />
            ) : null}
            <Button disabled={pending} type="submit">
              {pending ? "Saving" : task ? "Save task" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ColumnDialog({
  boardSlug,
  trigger,
  workspaceSlug,
}: {
  boardSlug: string;
  trigger: React.ReactNode;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<WorkspaceActionState>(
    initialWorkspaceActionState,
  );
  const [pending, startSaveTransition] = useTransition();

  function formAction(formData: FormData) {
    startSaveTransition(async () => {
      const result = await createColumn(initialWorkspaceActionState, formData);
      setState(result);

      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New column</DialogTitle>
          <DialogDescription>Add another workflow stage.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          <input name="boardSlug" type="hidden" value={boardSlug} />
          <FieldError state={state} />
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name</span>
            <Input name="name" required />
          </label>
          <DialogFooter>
            <Button disabled={pending} type="submit">
              {pending ? "Saving" : "Create column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MultiSelect({
  label,
  name,
  options,
  values,
}: {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  values: string[];
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue={values}
        multiple
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function findTask(columns: BoardColumn[], taskId: number) {
  for (const column of columns) {
    const task = column.tasks.find((item) => item.id === taskId);

    if (task) {
      return task;
    }
  }

  return null;
}

function findTaskLocation(columns: BoardColumn[], taskId: number) {
  for (const column of columns) {
    const index = column.tasks.findIndex((item) => item.id === taskId);

    if (index >= 0) {
      return {
        columnId: column.id,
        index,
      };
    }
  }

  return null;
}

function moveTaskLocally(
  columns: BoardColumn[],
  taskId: number,
  targetColumnId: number,
  targetIndex: number,
) {
  let movedTask: BoardTask | null = null;
  const withoutTask = columns.map((column) => {
    const tasks = column.tasks.filter((task) => {
      if (task.id === taskId) {
        movedTask = { ...task, column_id: targetColumnId };
        return false;
      }

      return true;
    });

    return { ...column, tasks };
  });

  if (!movedTask) {
    return columns;
  }

  const taskToInsert = movedTask;

  return withoutTask.map((column) => {
    if (column.id !== targetColumnId) {
      return column;
    }

    const nextTasks = [...column.tasks];
    const insertIndex = Math.min(Math.max(targetIndex, 0), nextTasks.length);
    nextTasks.splice(insertIndex, 0, taskToInsert);

    return { ...column, tasks: nextTasks };
  });
}

function updateTaskSortOrder(
  columns: BoardColumn[],
  taskId: number,
  sortOrder: number,
) {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) =>
      task.id === taskId ? { ...task, sort_order: sortOrder } : task,
    ),
  }));
}

function getDropTarget(columns: BoardColumn[], overId?: UniqueIdentifier | null) {
  if (!overId) {
    return null;
  }

  const targetColumnId = columnIdFromDragId(overId);

  if (targetColumnId) {
    const column = columns.find((item) => item.id === targetColumnId);

    return column
      ? {
          columnId: column.id,
          index: column.tasks.length,
        }
      : null;
  }

  const targetTaskId = taskIdFromDragId(overId);

  if (!targetTaskId) {
    return null;
  }

  for (const column of columns) {
    const index = column.tasks.findIndex((task) => task.id === targetTaskId);

    if (index >= 0) {
      return {
        columnId: column.id,
        index,
      };
    }
  }

  return null;
}

function taskDragId(taskId: number) {
  return `task:${taskId}`;
}

function columnDragId(columnId: number) {
  return `column:${columnId}`;
}

function taskIdFromDragId(id: UniqueIdentifier) {
  const value = String(id);

  return value.startsWith("task:") ? Number(value.slice(5)) : null;
}

function columnIdFromDragId(id: UniqueIdentifier) {
  const value = String(id);

  return value.startsWith("column:") ? Number(value.slice(7)) : null;
}

function calculateSortOrder(tasks: BoardTask[], index: number) {
  const previous = tasks[index - 1]?.sort_order;
  const next = tasks[index + 1]?.sort_order;

  if (previous === undefined && next === undefined) {
    return 1000;
  }

  if (previous === undefined) {
    return Number(next) / 2;
  }

  if (next === undefined) {
    return Number(previous) + 1000;
  }

  return (Number(previous) + Number(next)) / 2;
}
