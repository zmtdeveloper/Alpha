import "server-only";

type WelcomeEmailInput = {
  email: string;
  fullName: string;
  workspaceName: string;
};

export async function sendWelcomeEmail({
  email,
  fullName,
  workspaceName,
}: WelcomeEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { status: "skipped" as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        to: email,
        subject: `Welcome to ${workspaceName}`,
        text: [
          `Hi ${fullName},`,
          "",
          `${workspaceName} is ready in Alpha.`,
          "You can now manage projects, boards, tasks, and teammates from your workspace.",
        ].join("\n"),
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      console.error("Welcome email failed", {
        status: response.status,
        workspaceName,
      });

      return { status: "failed" as const };
    }

    return { status: "sent" as const };
  } catch (error) {
    console.error("Welcome email request failed", {
      error,
      workspaceName,
    });

    return { status: "failed" as const };
  }
}
