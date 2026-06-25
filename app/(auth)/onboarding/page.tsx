import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/auth/onboarding-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import {
  getCurrentProfile,
  getWorkspaceMemberships,
  requireCurrentUser,
} from "@/lib/auth/data";

export default async function OnboardingPage() {
  const [user, profile, workspaces] = await Promise.all([
    requireCurrentUser(),
    getCurrentProfile(),
    getWorkspaceMemberships(),
  ]);

  const firstWorkspace = workspaces[0];

  if (firstWorkspace) {
    redirect(`/${firstWorkspace.slug}`);
  }

  return (
    <AuthPageShell eyebrow="First workspace" title="Set up your workspace">
      <OnboardingForm defaultFullName={profile?.full_name ?? user.name} />
    </AuthPageShell>
  );
}
