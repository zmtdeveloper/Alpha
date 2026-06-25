import { MailPlus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

const members = [
  { name: "ZMT Developer", email: "owner@alpha.local", role: "Owner" },
  { name: "Areeba Khan", email: "areeba@alpha.local", role: "Admin" },
  { name: "Naveed Shah", email: "naveed@alpha.local", role: "Member" },
];

export default function MembersPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Members
          </h1>
        </div>
        <Button>
          <MailPlus />
          Invite
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_96px] border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_180px_96px]">
          <span>Member</span>
          <span className="hidden sm:block">Email</span>
          <span>Role</span>
        </div>
        <div className="divide-y divide-border">
          {members.map((member) => (
            <article
              key={member.email}
              className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_180px_96px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground sm:hidden">
                  {member.email}
                </p>
              </div>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                {member.email}
              </p>
              <span className="w-fit rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                {member.role}
              </span>
            </article>
          ))}
        </div>
      </section>

      <EmptyState
        description="Invitations that have not been accepted will appear here."
        icon={MailPlus}
        title="No pending invitations"
      />
    </div>
  );
}
