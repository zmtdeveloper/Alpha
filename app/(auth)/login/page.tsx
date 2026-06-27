import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import {
  getCurrentUser,
  redirectToWorkspaceOrOnboarding,
} from "@/lib/auth/data";
import { sanitizeNextPath } from "@/lib/auth/validation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    await redirectToWorkspaceOrOnboarding();
  }

  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  return (
    <AuthPageShell eyebrow="Secure access" title="Sign in to your workspace">
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthPageShell>
  );
}
