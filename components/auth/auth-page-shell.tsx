import type * as React from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

type AuthPageShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
};

export function AuthPageShell({
  children,
  eyebrow,
  title,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1680px] flex-col">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <Link
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="/"
          >
            <BrandLogo />
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 border-b border-border pb-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
