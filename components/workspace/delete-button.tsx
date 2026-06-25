"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import {
  deleteBoard,
  deleteColumn,
  deleteProject,
  deleteTask,
} from "@/lib/workspace/actions";

type DeleteKind = "board" | "column" | "project" | "task";

const actionByKind = {
  board: deleteBoard,
  column: deleteColumn,
  project: deleteProject,
  task: deleteTask,
};

export function DeleteButton({
  boardSlug,
  id,
  kind,
  label,
  workspaceSlug,
}: {
  boardSlug?: string;
  id: number;
  kind: DeleteKind;
  label: string;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const title = `Delete ${kind}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={label}
          disabled={pending}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This removes the {kind} from this workspace. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const action = actionByKind[kind];
                const result = await action({ boardSlug, id, workspaceSlug });

                if (!result.ok && result.message) {
                  window.alert(result.message);
                  return;
                }

                setOpen(false);
                router.refresh();
              });
            }}
            type="button"
            variant="destructive"
          >
            {pending ? "Deleting" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
