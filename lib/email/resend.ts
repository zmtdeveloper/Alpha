import "server-only";

import { Resend } from "resend";

type EmailLogContext = Record<string, string | number | boolean | null | undefined>;

type SendEmailInput = {
  html: string;
  kind: string;
  logContext?: EmailLogContext;
  subject: string;
  text: string;
  to: string;
};

type EmailSendResult =
  | {
      id?: string;
      status: "sent";
    }
  | {
      status: "failed" | "skipped";
    };

let resendClient: Resend | null = null;

function getResendClient(apiKey: string) {
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

export async function sendTransactionalEmail({
  html,
  kind,
  logContext,
  subject,
  text,
  to,
}: SendEmailInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("Transactional email skipped: missing configuration.", {
      kind,
      ...logContext,
    });

    return { status: "skipped" };
  }

  try {
    const { data, error } = await getResendClient(apiKey).emails.send({
      from,
      html,
      subject,
      text,
      to: [to],
    });

    if (error) {
      console.error("Transactional email failed.", {
        error: emailErrorMessage(error),
        kind,
        ...logContext,
      });

      return { status: "failed" };
    }

    return {
      id: data?.id,
      status: "sent",
    };
  } catch (error) {
    console.error("Transactional email request failed.", {
      error: emailErrorMessage(error),
      kind,
      ...logContext,
    });

    return { status: "failed" };
  }
}

function emailErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown email error";
}
