const expectedConfirmation = "I_UNDERSTAND_LOCAL_DATA_WILL_BE_DELETED";

if (process.env.ALLOW_SUPABASE_RESET === expectedConfirmation) {
  process.exit(0);
}

console.error(`
Refusing to run "supabase db reset".

This command deletes the local Supabase database, including Auth users,
workspaces, projects, boards, tasks, and invitations.

Use "npm run supabase:migrate" to apply new migrations without deleting data.

If you intentionally want a clean local database, run this first in PowerShell:

  $env:ALLOW_SUPABASE_RESET="${expectedConfirmation}"

Then run:

  npm run supabase:reset
`);

process.exit(1);
