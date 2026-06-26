"use client";

import { Check, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const themeOptions = [
  {
    description: "High contrast workspace UI with muted panels.",
    icon: Moon,
    label: "Dark",
    value: "dark",
  },
  {
    description: "Bright workspace UI for daylight editing.",
    icon: Sun,
    label: "Light",
    value: "light",
  },
] as const;

export function PreferencesPanel() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const activeTheme = resolvedTheme ?? theme ?? "dark";

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(240px,0.36fr)_minmax(0,0.64fr)]">
      <aside className="rounded-md bg-card/70 p-4 text-card-foreground shadow-sm shadow-black/10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Settings className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Interface</h2>
            <p className="text-xs text-muted-foreground">Saved on this device</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Theme preference is applied across every workspace in this browser.
        </p>
      </aside>

      <div className="rounded-md bg-card/70 p-4 shadow-sm shadow-black/10">
        <h2 className="text-sm font-semibold">Theme</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeTheme === option.value;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "flex min-h-28 flex-col items-start justify-between rounded-md bg-background/45 p-4 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive && "bg-accent text-accent-foreground",
                )}
                key={option.value}
                onClick={() => setTheme(option.value)}
                type="button"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon className="size-4" />
                  </span>
                  {isActive ? <Check className="size-4 text-primary" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
