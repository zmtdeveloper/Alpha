import "server-only";

import type { Enums } from "@/lib/database.types";

type RenderedEmail = {
  html: string;
  subject: string;
  text: string;
};

type WelcomeEmailInput = {
  fullName: string;
  workspaceName: string;
  workspaceUrl: string;
};

type InvitationEmailInput = {
  expiresAt: string;
  inviteUrl: string;
  inviterName: string;
  role: Enums<"app_role">;
  workspaceName: string;
};

export function renderWelcomeEmail({
  fullName,
  workspaceName,
  workspaceUrl,
}: WelcomeEmailInput): RenderedEmail {
  const subject = `Welcome to ${workspaceName}`;
  const safeName = escapeHtml(fullName);
  const safeWorkspace = escapeHtml(workspaceName);
  const safeUrl = escapeHtml(workspaceUrl);

  return {
    html: shellHtml({
      body: [
        `<p>Hi ${safeName},</p>`,
        `<p><strong>${safeWorkspace}</strong> is ready in Alpha. You can now manage projects, boards, tasks, and teammates from your workspace.</p>`,
        actionLink("Open workspace", safeUrl),
      ].join(""),
      preview: `${workspaceName} is ready in Alpha.`,
      title: "Your workspace is ready",
    }),
    subject,
    text: [
      `Hi ${fullName},`,
      "",
      `${workspaceName} is ready in Alpha.`,
      "You can now manage projects, boards, tasks, and teammates from your workspace.",
      "",
      `Open workspace: ${workspaceUrl}`,
    ].join("\n"),
  };
}

export function renderInvitationEmail({
  expiresAt,
  inviteUrl,
  inviterName,
  role,
  workspaceName,
}: InvitationEmailInput): RenderedEmail {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const expiry = formatDate(expiresAt);
  const subject = `${inviterName} invited you to ${workspaceName}`;
  const safeInviter = escapeHtml(inviterName);
  const safeRole = escapeHtml(roleLabel);
  const safeUrl = escapeHtml(inviteUrl);
  const safeWorkspace = escapeHtml(workspaceName);

  return {
    html: shellHtml({
      body: [
        `<p>${safeInviter} invited you to join <strong>${safeWorkspace}</strong> as ${articleFor(roleLabel)} ${safeRole}.</p>`,
        `<p>This invitation expires ${escapeHtml(expiry)}.</p>`,
        actionLink("Accept invitation", safeUrl),
        `<p style="font-size:13px;color:#8d8d96;">If the button does not work, paste this link into your browser:<br>${safeUrl}</p>`,
      ].join(""),
      preview: `Join ${workspaceName} on Alpha.`,
      title: "You have a workspace invitation",
    }),
    subject,
    text: [
      `${inviterName} invited you to join ${workspaceName} as ${articleFor(roleLabel)} ${roleLabel}.`,
      "",
      `This invitation expires ${expiry}.`,
      "",
      `Accept invitation: ${inviteUrl}`,
    ].join("\n"),
  };
}

function actionLink(label: string, href: string) {
  return [
    `<p style="margin:28px 0;">`,
    `<a href="${href}" style="background:#6f6ae8;border-radius:6px;color:#ffffff;display:inline-block;font-weight:600;padding:11px 16px;text-decoration:none;">${escapeHtml(label)}</a>`,
    `</p>`,
  ].join("");
}

function articleFor(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function shellHtml({
  body,
  preview,
  title,
}: {
  body: string;
  preview: string;
  title: string;
}) {
  return [
    `<!doctype html>`,
    `<html>`,
    `<body style="background:#1f1f22;color:#fbfbfc;font-family:Arial,Helvetica,sans-serif;margin:0;padding:32px;">`,
    `<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</span>`,
    `<main style="background:#2a2a2e;border:1px solid #3b3b41;border-radius:8px;margin:0 auto;max-width:560px;padding:28px;">`,
    `<p style="color:#b6b6bf;font-size:12px;letter-spacing:0.16em;margin:0 0 12px;text-transform:uppercase;">Alpha</p>`,
    `<h1 style="font-size:24px;line-height:1.25;margin:0 0 18px;">${escapeHtml(title)}</h1>`,
    `<div style="color:#e6e6eb;font-size:15px;line-height:1.65;">${body}</div>`,
    `</main>`,
    `</body>`,
    `</html>`,
  ].join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
