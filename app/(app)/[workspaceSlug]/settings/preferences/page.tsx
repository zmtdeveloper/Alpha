import { PreferencesPanel } from "@/components/account/preferences-panel";

export default function PreferencesPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Preferences
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Control how Alpha looks on this device.
          </p>
        </div>
      </section>

      <PreferencesPanel />
    </div>
  );
}
