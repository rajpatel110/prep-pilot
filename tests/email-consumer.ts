async function main() {
  if (
    !process.send ||
    !process.env.MONGODB_DB_NAME?.startsWith("prep_pilot_email_test_")
  )
    throw new Error("Isolated IPC fixture required");
  const { createIdentityEmailHttp } =
    await import("../src/modules/identity/email-http");
  const { buildAuth } = await import("../src/modules/identity/auth");
  const { requireActor } = await import("../src/modules/identity/service");
  const { serverConfig } = await import("../src/shared/server/config");
  const { rateLimit } = await import("../src/shared/server/rate-limit");
  const { getAuthClient, getDomainConnection } =
    await import("../src/shared/server/db");
  const auth = buildAuth(await getAuthClient(), serverConfig, {
    ready: async () => {},
    queue: async () => {
      throw new Error("Delivery forbidden in reset consumer fixture");
    },
  });
  const handler = createIdentityEmailHttp({
    config: serverConfig,
    auth: async () => auth,
    actor: requireActor,
    client: getAuthClient,
    limit: rateLimit,
  });
  await getDomainConnection();
  process.once(
    "message",
    async (input: { token: string; newPassword: string }) => {
      try {
        const response = await handler(
          new Request(
            `${process.env.APP_URL}/api/v1/identity/password-reset/confirm`,
            {
              method: "POST",
              headers: {
                origin: process.env.APP_URL!,
                "content-type": "application/json",
              },
              body: JSON.stringify(input),
            },
          ),
        );
        process.send!({ status: response.status });
      } catch {
        process.send!({ status: 599 });
      } finally {
        await (await getDomainConnection()).close();
        await (await getAuthClient()).close();
        process.disconnect();
      }
    },
  );
  process.send({ ready: true });
}
void main().catch(() => {
  process.send?.({ failed: true });
  process.disconnect?.();
  process.exitCode = 1;
});
