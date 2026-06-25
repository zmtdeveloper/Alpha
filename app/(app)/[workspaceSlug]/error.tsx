"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          <h1 className="font-semibold">Workspace view failed</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The workspace shell stayed loaded, but this view could not render.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Digest {error.digest}
          </p>
        ) : null}
        <Button className="mt-5" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </section>
    </div>
  );
}
