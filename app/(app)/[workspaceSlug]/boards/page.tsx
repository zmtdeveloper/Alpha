import { Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

const boards = [
  {
    name: "Product",
    description: "Roadmap intake, current build work, and review handoff.",
    tasks: 24,
    columns: 5,
  },
  {
    name: "Platform",
    description: "Infrastructure, auth, tenant safety, and release hygiene.",
    tasks: 18,
    columns: 4,
  },
];

export default function BoardsPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Boards
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace boards
          </h1>
        </div>
        <Button>
          <Plus />
          New board
        </Button>
      </section>

      {boards.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {boards.map((board) => (
            <article
              key={board.name}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{board.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {board.description}
                  </p>
                </div>
                <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                  MVP
                </span>
              </div>
              <div className="mt-5 flex gap-5 text-sm text-muted-foreground">
                <span>{board.tasks} tasks</span>
                <span>{board.columns} columns</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          action="New board"
          description="Create a board to organize columns, tasks, labels, and assignees for this workspace."
          icon={Plus}
          title="No boards yet"
        />
      )}
    </div>
  );
}
