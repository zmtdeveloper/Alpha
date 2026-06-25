import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: string;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <Button className="mt-5" size="sm">
          {action}
        </Button>
      ) : null}
    </section>
  );
}
