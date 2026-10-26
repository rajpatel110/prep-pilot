import "server-only";
import { createHash } from "node:crypto";
export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};
export type EmailTransport = (
  message: EmailMessage,
) => Promise<{ providerId: string }>;
export class DeliveryError extends Error {
  constructor(
    public code:
      "PROVIDER_REJECTED" | "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT",
    public retryable: boolean,
    public providerStatus?: number,
    public providerCode?: string,
  ) {
    super(code);
  }
}
export function brevoTransport(
  apiKey: string,
  sender: { email: string; name: string },
  send: typeof fetch = fetch,
): EmailTransport {
  return async (message) => {
    const digest = createHash("sha256")
      .update(message.idempotencyKey)
      .digest("hex");
    const key = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
    const signal = AbortSignal.timeout(5000);
    try {
      const response = await send("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        signal,
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: message.to }],
          subject: message.subject,
          textContent: message.text,
          headers: { idempotencyKey: key },
        }),
      });
      if (!response.ok) {
        let providerCode: string | undefined;
        try {
          const data: unknown = await response.json();
          if (
            data &&
            typeof data === "object" &&
            "code" in data &&
            typeof data.code === "string" &&
            [
              "unauthorized",
              "permission_denied",
              "not_enough_credits",
              "invalid_parameter",
              "duplicate_parameter",
              "account_under_validation",
            ].includes(data.code)
          )
            providerCode = data.code;
        } catch {}
        throw new DeliveryError(
          response.status >= 500 || response.status === 429
            ? "PROVIDER_UNAVAILABLE"
            : "PROVIDER_REJECTED",
          response.status >= 500,
          response.status,
          providerCode,
        );
      }
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "messageId" in data &&
        typeof data.messageId === "string" &&
        data.messageId.length > 0 &&
        data.messageId.length <= 200
      )
        return { providerId: data.messageId };
      throw new DeliveryError("PROVIDER_UNAVAILABLE", false);
    } catch (error) {
      if (error instanceof DeliveryError) throw error;
      throw new DeliveryError(
        signal.aborted ||
          (error instanceof Error &&
            ["AbortError", "TimeoutError"].includes(error.name))
          ? "PROVIDER_TIMEOUT"
          : "PROVIDER_UNAVAILABLE",
        false,
      );
    }
  };
}
export function resendTransport(
  apiKey: string,
  send: typeof fetch = fetch,
): EmailTransport {
  return async (message) => {
    let response: Response;
    const signal = AbortSignal.timeout(5000);
    try {
      response = await send("https://api.resend.com/emails", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
    } catch (error) {
      throw new DeliveryError(
        signal.aborted ||
          (error instanceof Error &&
            ["AbortError", "TimeoutError"].includes(error.name))
          ? "PROVIDER_TIMEOUT"
          : "PROVIDER_UNAVAILABLE",
        true,
      );
    }
    if (!response.ok)
      throw new DeliveryError(
        response.status >= 500 ||
          response.status === 429 ||
          response.status === 409
          ? "PROVIDER_UNAVAILABLE"
          : "PROVIDER_REJECTED",
        response.status >= 500 ||
          response.status === 429 ||
          response.status === 409,
      );
    try {
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "id" in data &&
        typeof data.id === "string" &&
        data.id.length > 0 &&
        data.id.length <= 200
      )
        return { providerId: data.id };
    } catch {}
    throw new DeliveryError("PROVIDER_UNAVAILABLE", true);
  };
}
