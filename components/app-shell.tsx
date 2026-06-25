"use client";

import {
  Bell,
  ChevronDown,
  CreditCard,
  Home,
  Menu,
  PanelsTopLeft,
  Plus,
  Rocket,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutMenuItem } from "@/components/sign-out-menu-item";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    email: string;
    fullName: string;
    initials: string;
  };
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
};

type WorkspaceSummary = {
  id: number;
  name: string;
  role: "owner" | "admin" | "member";
  slug: string;
};

const primaryNav = [
  { label: "Overview", href: "", icon: Home },
  { label: "Projects", href: "/projects", icon: Rocket },
  { label: "Boards", href: "/boards", icon: PanelsTopLeft },
  { label: "Members", href: "/settings/members", icon: Users },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
];

export function AppShell({
  children,
  user,
  workspace,
  workspaces,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const basePath = `/${workspace.slug}`;

  const navigation = primaryNav.map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen w-full lg:pl-[17.5rem]">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-[17.5rem] border-r border-border bg-card lg:block">
          <ShellSidebar
            basePath={basePath}
            navigation={navigation}
            pathname={pathname}
            user={user}
            workspace={workspace}
            workspaces={workspaces}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-5 lg:px-6 2xl:px-8">
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <Button
                  className="lg:hidden"
                  size="icon"
                  variant="ghost"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </DialogTrigger>
              <DialogContent className="left-0 top-0 h-svh w-[min(88vw,320px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-0">
                <DialogHeader className="sr-only">
                  <DialogTitle>Workspace navigation</DialogTitle>
                  <DialogDescription>
                    Navigate through workspace sections.
                  </DialogDescription>
                </DialogHeader>
                <ShellSidebar
                  basePath={basePath}
                  navigation={navigation}
                  pathname={pathname}
                  user={user}
                  workspace={workspace}
                  workspaces={workspaces}
                  onNavigate={() => setMobileOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground lg:hidden">
                {workspace.name}
              </p>
              <div className="hidden h-9 max-w-md items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground lg:flex">
                <Search className="size-4" />
                <span>Search tasks, boards, or teammates</span>
              </div>
            </div>

            <Button size="sm" className="hidden sm:inline-flex">
              <Plus />
              New task
            </Button>
            <Button size="icon" variant="ghost" aria-label="Notifications">
              <Bell />
            </Button>
            <ThemeToggle />
            <div className="lg:hidden">
              <UserMenu user={user} />
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 2xl:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function ShellSidebar({
  basePath,
  navigation,
  onNavigate,
  pathname,
  user,
  workspace,
  workspaces,
}: {
  basePath: string;
  navigation: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onNavigate?: () => void;
  pathname: string;
  user: {
    email: string;
    fullName: string;
    initials: string;
  };
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
}) {
  return (
    <div className="flex h-full min-h-svh flex-col px-3 py-4">
      <div className="mb-6 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-11 w-full justify-between px-2"
              variant="ghost"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
                  {workspace.name.charAt(0)}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-semibold">
                    {workspace.name}
                  </span>
                  <span className="block truncate text-xs font-normal capitalize text-muted-foreground">
                    {workspace.role}
                  </span>
                </span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((item) => (
              <DropdownMenuItem asChild key={item.id}>
                <Link href={`/${item.slug}`} onClick={onNavigate}>
                  {item.name}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Plus />
              New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="space-y-1" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border pt-3">
        <Link
          href={`${basePath}/settings/members`}
          onClick={onNavigate}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <UserMenu user={user} sidebar />
      </div>
    </div>
  );
}

function UserMenu({
  sidebar = false,
  user,
}: {
  sidebar?: boolean;
  user: {
    email: string;
    fullName: string;
    initials: string;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            sidebar
              ? "h-12 w-full justify-between bg-background/45 px-2 text-left"
              : "size-9 rounded-md bg-secondary p-0 text-xs font-semibold",
          )}
          variant="ghost"
          aria-label="Open user menu"
        >
          {sidebar ? (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                  {user.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {user.fullName}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </>
          ) : (
            user.initials
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-sm">{user.fullName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
