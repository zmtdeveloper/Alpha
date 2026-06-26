"use client";

import {
  CheckSquare2,
  Loader2,
  PanelsTopLeft,
  Rocket,
  Search,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ComponentType,
  type KeyboardEvent,
} from "react";

import {
  searchWorkspace,
  type WorkspaceSearchResult,
} from "@/lib/search/actions";
import { cn } from "@/lib/utils";

type WorkspaceSearchProps = {
  workspaceSlug: string;
};

const resultConfig = {
  board: {
    icon: PanelsTopLeft,
    label: "Board",
  },
  member: {
    icon: UserRound,
    label: "Member",
  },
  project: {
    icon: Rocket,
    label: "Project",
  },
  task: {
    icon: CheckSquare2,
    label: "Task",
  },
} satisfies Record<
  WorkspaceSearchResult["type"],
  {
    icon: ComponentType<{ className?: string }>;
    label: string;
  }
>;

export function WorkspaceSearch({ workspaceSlug }: WorkspaceSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= 2;
  const visibleResults = canSearch ? results : [];
  const showPanel =
    focused &&
    (query.length > 0 || visibleResults.length > 0 || isPending || message);
  const isWaitingForResults = canSearch && lastQuery !== normalizedQuery;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const response = await searchWorkspace({
          query: normalizedQuery,
          workspaceSlug,
        });

        if (!active) {
          return;
        }

        setResults(response.results);
        setMessage(response.message ?? null);
        setLastQuery(normalizedQuery);
        setActiveIndex(response.results.length > 0 ? 0 : -1);
      });
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [canSearch, normalizedQuery, startTransition, workspaceSlug]);

  function navigateTo(result: WorkspaceSearchResult) {
    setFocused(false);
    setQuery("");
    setResults([]);
    setLastQuery("");
    router.push(result.href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setFocused(false);
      return;
    }

    if (!visibleResults.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visibleResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + visibleResults.length) % visibleResults.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      navigateTo(visibleResults[Math.max(activeIndex, 0)]);
    }
  }

  return (
    <div className="relative hidden w-full max-w-md lg:block" ref={containerRef}>
      <label
        className={cn(
          "flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors",
          focused && "border-ring bg-background/70 text-foreground",
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="sr-only">Search workspace</span>
        <input
          aria-label="Search tasks, boards, projects, or teammates"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => setQuery(event.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks, boards, or teammates"
          type="search"
          value={query}
        />
        {isPending || isWaitingForResults ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : null}
      </label>

      {showPanel ? (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/35"
          id="workspace-search-results"
        >
          {!canSearch ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Type at least 2 characters to search this workspace.
            </p>
          ) : null}

          {canSearch && message ? (
            <p className="px-3 py-3 text-sm text-destructive">{message}</p>
          ) : null}

          {canSearch &&
          !message &&
          (isPending || isWaitingForResults) &&
          visibleResults.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Searching...
            </p>
          ) : null}

          {canSearch &&
          !message &&
          !isPending &&
          !isWaitingForResults &&
          visibleResults.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No results found.
            </p>
          ) : null}

          {visibleResults.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto p-1">
              {visibleResults.map((result, index) => (
                <li key={result.id}>
                  <SearchResultButton
                    active={index === activeIndex}
                    onClick={() => navigateTo(result)}
                    result={result}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SearchResultButton({
  active,
  onClick,
  result,
}: {
  active: boolean;
  onClick: () => void;
  result: WorkspaceSearchResult;
}) {
  const config = resultConfig[result.type];
  const Icon = config.icon;

  return (
    <button
      className={cn(
        "grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-sm px-2 py-2 text-left outline-none transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
        {result.initials ?? <Icon className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {result.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {result.context}
        </span>
      </span>
      <span className="rounded-md bg-background/60 px-2 py-1 text-xs text-muted-foreground">
        {result.meta ?? config.label}
      </span>
    </button>
  );
}
