import React, { type ReactNode } from "https://esm.sh/react@18.3.1";
import { renderToStaticMarkup } from "https://esm.sh/react-dom@18.3.1/server";
import { Resend } from "https://esm.sh/resend@2.0.0";

export type ReactElementLike = ReactNode;

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAction {
  label: string;
  href: string;
}

export interface EmailSendOptions {
  to: string | string[];
  subject: string;
  react: ReactElementLike;
  previewText?: string;
  templateName: string;
  supabaseClient?: {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<{ error?: unknown }>;
    };
  };
  maxRetries?: number;
}

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

const getDenoEnv = (key: string): string | undefined => {
  const denoRuntime = (globalThis as typeof globalThis & { Deno?: { env?: { get: (name: string) => string | undefined } } }).Deno;
  return denoRuntime?.env?.get(key) ?? undefined;
};

const getFromAddress = (): string => {
  const name = getDenoEnv("RESEND_FROM_NAME");
  const email = getDenoEnv("RESEND_FROM_EMAIL");

  if (!name || !email) {
    throw new Error("Missing RESEND_FROM_NAME or RESEND_FROM_EMAIL");
  }

  return `${name} <${email}>`;
};

const logEmailDelivery = async (
  supabaseClient: EmailSendOptions["supabaseClient"],
  payload: {
    template_name: string;
    recipient: string;
    subject: string;
    status: "sent" | "failed";
    provider: string;
    provider_message_id?: string;
    provider_response?: string;
    error_message?: string;
  }
) => {
  if (!supabaseClient) return;

  try {
    await supabaseClient.from("email_delivery_logs").insert({
      template_name: payload.template_name,
      recipient: payload.recipient,
      subject: payload.subject,
      status: payload.status,
      provider: payload.provider,
      provider_message_id: payload.provider_message_id,
      error_message: payload.error_message,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Email log insert failed:", error);
  }
};

export const sendEmail = async ({
  to,
  subject,
  react,
  previewText,
  templateName,
  supabaseClient,
  maxRetries = 2,
}: EmailSendOptions): Promise<EmailSendResult> => {
  const apiKey = getDenoEnv("RESEND_API_KEY");
  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const resend = new Resend(apiKey);
  const recipients = Array.isArray(to) ? to : [to];
  const html = renderToStaticMarkup(React.isValidElement(react) ? react : React.createElement(React.Fragment, null, react));

  const sendAttempt = async (attempt: number): Promise<EmailSendResult> => {
    try {
      const response = await resend.emails.send({
        from: getFromAddress(),
        to: recipients,
        subject,
        html,
        text: previewText || subject,
      });

      if (response.error) {
        throw new Error(typeof response.error === "string" ? response.error : JSON.stringify(response.error));
      }

      const messageId = response.data?.id;
      const providerDetails = JSON.stringify(response, null, 2);
      await Promise.all(
        recipients.map((recipient) =>
          logEmailDelivery(supabaseClient, {
            template_name: templateName,
            recipient,
            subject,
            status: "sent",
            provider: "resend",
            provider_message_id: messageId,
            provider_response: providerDetails,
          })
        )
      );

      return { success: true, id: messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const providerDetails = error instanceof Error ? message : JSON.stringify(error, null, 2);
      await Promise.all(
        recipients.map((recipient) =>
          logEmailDelivery(supabaseClient, {
            template_name: templateName,
            recipient,
            subject,
            status: "failed",
            provider: "resend",
            provider_response: providerDetails,
            error_message: message,
          })
        )
      );

      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        return sendAttempt(attempt + 1);
      }

      return { success: false, error: message };
    }
  };

  return sendAttempt(1);
};

export const formatDate = (value: string | Date | undefined, locale: string = "en-IN") => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTime = (value: string | undefined) => {
  if (!value) return "—";
  const [hours, minutes] = value.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};
