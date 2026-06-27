import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

const footerLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create workspace" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex w-fit rounded-md outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/"
        >
          <BrandLogo
            markClassName="size-7 text-xs"
            textClassName="text-sm text-muted-foreground transition-colors"
          />
        </Link>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9"
        >
          {footerLinks.map((link) => (
            <Link
              className="rounded-md px-1 py-1 outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
