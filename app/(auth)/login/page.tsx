import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import {
  getCurrentUser,
  redirectToWorkspaceOrOnboarding,
} from "@/lib/auth/data";
import { sanitizeNextPath } from "@/lib/auth/validation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    auth_error?: string;
    next?: string;
    reset?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    await redirectToWorkspaceOrOnboarding();
  }

  const { auth_error: authError, next, reset } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  return (
    <AuthPageShell eyebrow="Secure access" title="Sign in to your workspace">
      {reset === "success" ? (
        <p className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      {authError === "invalid-link" ? (
        <p className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          That sign-in link is invalid or expired.
        </p>
      ) : null}
      <AuthForm mode="login" nextPath={nextPath} />
      <MagicLinkForm nextPath={nextPath} />
    </AuthPageShell>
  );
}
