"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

export function SignOutMenuItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={pending}
      onSelect={(event) => {
        event.preventDefault();
        startTransition(async () => {
          await signOut();
        });
      }}
    >
      <LogOut />
      {pending ? "Signing out" : "Sign out"}
    </DropdownMenuItem>
  );
}
