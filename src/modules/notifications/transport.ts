import "server-only";
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
  ) {
    super(code);
  }
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
