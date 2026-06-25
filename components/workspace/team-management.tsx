"use client";

import {
  Copy,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  createInvitation,
  removeMember,
  resendInvitation,
  revokeInvitation,
  updateMemberRole,
} from "@/lib/team/actions";
import type { TeamInvitation, TeamMember } from "@/lib/team/data";
import {
  initialTeamActionState,
  type TeamActionState,
} from "@/lib/team/validation";

type TeamManagementProps = {
  canManageTeam: boolean;
  currentRole: "owner" | "admin" | "member" | null;
  invitations: TeamInvitation[];
  members: TeamMember[];
  ownerCount: number;
  workspaceSlug: string;
};

const roleOptions = [
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
] as const;

export function InviteMemberDialog({
  canInviteOwners,
  trigger,
  workspaceSlug,
}: {
  canInviteOwners: boolean;
  trigger: React.ReactNode;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createInvitation,
    initialTeamActionState,
  );
  const inviteUrl = state.fields?.inviteUrl;

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>
            Create a workspace-scoped invitation link for this email.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
          <ActionMessage state={state} />
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <Input
              autoComplete="email"
              defaultValue={state.fields?.email ?? ""}
              name="email"
              placeholder="name@company.com"
              type="email"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Role</span>
            <select
              className={selectClassName}
              defaultValue={state.fields?.role ?? "member"}
              name="role"
            >
              {roleOptions
                .filter((role) => canInviteOwners || role.value !== "owner")
                .map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
            </select>
          </label>
          {inviteUrl ? <InviteLink url={inviteUrl} /> : null}
          <DialogFooter>
            <Button disabled={pending} type="submit">
              <MailPlus />
              {pending ? "Creating" : "Create invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamManagement({
  canManageTeam,
  currentRole,
  invitations,
  members,
  ownerCount,
  workspaceSlug,
}: TeamManagementProps) {
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.state === "pending",
  );
  const pastInvitations = invitations.filter(
    (invitation) => invitation.state !== "pending",
  );

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_112px_44px] border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_128px_132px_44px]">
          <span>Member</span>
          <span>Role</span>
          <span className="hidden sm:block">Joined</span>
          <span className="sr-only">Actions</span>
        </div>
        <div className="divide-y divide-border">
          {members.map((member) => (
            <MemberRow
              canManageTeam={canManageTeam}
              currentRole={currentRole}
              key={member.id}
              member={member}
              ownerCount={ownerCount}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Pending invitations</h2>
          <span className="text-xs text-muted-foreground">
            {pendingInvitations.length} pending
          </span>
        </div>
        {pendingInvitations.length > 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {pendingInvitations.map((invitation) => (
                <InvitationRow
                  canManageTeam={canManageTeam}
                  currentRole={currentRole}
                  invitation={invitation}
                  key={invitation.id}
                  workspaceSlug={workspaceSlug}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyInviteState canManageTeam={canManageTeam} />
        )}
      </section>

      {pastInvitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Invitation history</h2>
          <div className="rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {pastInvitations.map((invitation) => (
                <InvitationRow
                  canManageTeam={false}
                  currentRole={currentRole}
                  invitation={invitation}
                  key={invitation.id}
                  workspaceSlug={workspaceSlug}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MemberRow({
  canManageTeam,
  currentRole,
  member,
  ownerCount,
  workspaceSlug,
}: {
  canManageTeam: boolean;
  currentRole: TeamManagementProps["currentRole"];
  member: TeamMember;
  ownerCount: number;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const canChangeRole = canManageRole(currentRole, member.role);
  const isLastOwner = member.role === "owner" && ownerCount <= 1;
  const canRemove = canChangeRole && !isLastOwner;
  const visibleRoles = useMemo(
    () =>
      roleOptions.filter(
        (role) => currentRole === "owner" || role.value !== "owner",
      ),
    [currentRole],
  );

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_112px_44px] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_128px_132px_44px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
          {member.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.fullName}
            {member.isCurrentUser ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                You
              </span>
            ) : null}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {member.userId}
          </p>
          {message ? (
            <p className="mt-1 text-xs text-destructive" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </div>
      {canManageTeam && canChangeRole ? (
        <select
          aria-label={`Change ${member.fullName} role`}
          className={selectClassName}
          disabled={pending}
          onChange={(event) => {
            const role = event.currentTarget.value;

            startTransition(async () => {
              const result = await updateMemberRole({
                memberId: member.id,
                role,
                workspaceSlug,
              });

              if (!result.ok) {
                setMessage(result.message ?? "Role could not be changed.");
                router.refresh();
                return;
              }

              setMessage(null);
              router.refresh();
            });
          }}
          value={member.role}
        >
          {visibleRoles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      ) : (
        <RoleBadge role={member.role} />
      )}
      <time className="hidden text-sm text-muted-foreground sm:block">
        {formatDate(member.createdAt)}
      </time>
      <RemoveMemberDialog
        disabled={!canManageTeam || !canRemove || pending}
        memberName={member.fullName}
        onRemove={() => {
          startTransition(async () => {
            const result = await removeMember({
              memberId: member.id,
              workspaceSlug,
            });

            if (!result.ok) {
              setMessage(result.message ?? "Member could not be removed.");
              return;
            }

            router.refresh();
          });
        }}
        pending={pending}
      />
    </article>
  );
}

function InvitationRow({
  canManageTeam,
  currentRole,
  invitation,
  workspaceSlug,
}: {
  canManageTeam: boolean;
  currentRole: TeamManagementProps["currentRole"];
  invitation: TeamInvitation;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const canManageInvitation =
    canManageTeam &&
    invitation.state === "pending" &&
    canManageRole(currentRole, invitation.role);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_96px_44px] items-start gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_112px_116px_44px]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          Expires {formatDate(invitation.expires_at)}
        </p>
        {inviteUrl ? <InviteLink url={inviteUrl} /> : null}
        {message ? (
          <p className="mt-1 text-xs text-destructive" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <RoleBadge role={invitation.role} />
      <InvitationStateBadge state={invitation.state} />
      {canManageInvitation ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Manage invitation for ${invitation.email}`}
              disabled={pending}
              size="icon"
              variant="ghost"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                startTransition(async () => {
                  const result = await resendInvitation({
                    invitationId: invitation.id,
                    workspaceSlug,
                  });

                  if (!result.ok) {
                    setMessage(result.message ?? "Invitation could not be resent.");
                    return;
                  }

                  setMessage(null);
                  setInviteUrl(result.fields?.inviteUrl ?? null);
                  router.refresh();
                });
              }}
            >
              <RefreshCw />
              Resend link
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                startTransition(async () => {
                  const result = await revokeInvitation({
                    invitationId: invitation.id,
                    workspaceSlug,
                  });

                  if (!result.ok) {
                    setMessage(result.message ?? "Invitation could not be revoked.");
                    return;
                  }

                  router.refresh();
                });
              }}
            >
              <Trash2 />
              Revoke
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span aria-hidden="true" />
      )}
    </article>
  );
}

function RemoveMemberDialog({
  disabled,
  memberName,
  onRemove,
  pending,
}: {
  disabled: boolean;
  memberName: string;
  onRemove: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Remove ${memberName}`}
          disabled={disabled}
          size="icon"
          type="button"
          variant="ghost"
        >
          <UserMinus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            This removes {memberName} from the workspace. Their past task
            activity stays in place.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
            type="button"
            variant="destructive"
          >
            {pending ? "Removing" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyInviteState({ canManageTeam }: { canManageTeam: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <MailPlus className="mx-auto mb-3 size-5 text-muted-foreground" />
      <p className="text-sm font-medium">No pending invitations</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {canManageTeam
          ? "Create an invitation to add a teammate."
          : "Pending invitations will appear here."}
      </p>
    </div>
  );
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 flex gap-2">
      <Input className="font-mono text-xs" readOnly value={url} />
      <Button
        aria-label="Copy invitation link"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
        type="button"
        variant="outline"
      >
        <Copy />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function RoleBadge({ role }: { role: "owner" | "admin" | "member" }) {
  return (
    <span className="inline-flex h-7 w-fit items-center gap-1 rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
      {role === "owner" ? <ShieldCheck className="size-3.5" /> : null}
      {roleLabel(role)}
    </span>
  );
}

function InvitationStateBadge({
  state,
}: {
  state: TeamInvitation["state"];
}) {
  return (
    <span className="inline-flex h-7 w-fit items-center rounded-md border border-border px-2 text-xs capitalize text-muted-foreground">
      {state}
    </span>
  );
}

function ActionMessage({ state }: { state: TeamActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
      role="status"
    >
      {state.message}
    </p>
  );
}

function canManageRole(
  currentRole: TeamManagementProps["currentRole"],
  targetRole: "owner" | "admin" | "member",
) {
  return currentRole === "owner" || (currentRole === "admin" && targetRole !== "owner");
}

function roleLabel(role: "owner" | "admin" | "member") {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";
