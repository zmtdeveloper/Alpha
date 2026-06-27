import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-forms";
import {
  getCurrentUser,
  redirectToWorkspaceOrOnboarding,
} from "@/lib/auth/data";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    await redirectToWorkspaceOrOnboarding();
  }

  return (
    <AuthPageShell eyebrow="Account recovery" title="Reset your password">
      <PasswordResetRequestForm />
    </AuthPageShell>
  );
}
