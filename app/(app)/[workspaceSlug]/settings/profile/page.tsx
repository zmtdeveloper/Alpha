import { ProfileForm } from "@/components/account/profile-form";
import {
  getCurrentProfile,
  getInitials,
  requireCurrentUser,
} from "@/lib/auth/data";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [user, profile] = await Promise.all([
    requireCurrentUser(),
    getCurrentProfile(),
  ]);
  const fullName = profile?.full_name || user.name;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Update the identity your teammates see across this workspace.
          </p>
        </div>
      </section>

      <ProfileForm
        avatarUrl={profile?.avatar_url ?? ""}
        email={user.email}
        fullName={fullName}
        initials={getInitials(fullName)}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
