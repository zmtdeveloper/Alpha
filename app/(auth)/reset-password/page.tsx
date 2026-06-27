import Link from "next/link";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { UpdatePasswordForm } from "@/components/auth/password-reset-forms";
import { getCurrentUser } from "@/lib/auth/data";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthPageShell eyebrow="Account recovery" title="Reset your password">
        <div className="space-y-4">
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            Your reset link is missing or expired.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              className="font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/forgot-password"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell eyebrow="Account recovery" title="Choose a new password">
      <UpdatePasswordForm />
    </AuthPageShell>
  );
}
