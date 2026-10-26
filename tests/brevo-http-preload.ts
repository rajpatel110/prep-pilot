if (
  !/^pp_brevo_http_[a-f0-9]{12}$/.test(process.env.MONGODB_DB_NAME ?? "") ||
  process.env.BREVO_API_KEY !== "mock-http-only" ||
  process.env.EMAIL_PROVIDER !== "brevo" ||
  !process.send
)
  throw new Error("Disposable Brevo HTTP fixture required");

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url === "https://api.brevo.com/v3/smtp/email") {
    const body = JSON.parse(String(init?.body)) as {
      to: { email: string }[];
      textContent: string;
    };
    if (
      body.to.length !== 1 ||
      body.to[0]?.email !== "http-fixture@example.com"
    )
      throw new Error("Fixture recipient mismatch");
    process.send!({ brevoFixture: true, text: body.textContent });
    return Response.json({ messageId: "mock-http-accepted" }, { status: 201 });
  }
  if (
    url.startsWith("https://api.resend.com/") ||
    url.startsWith("https://api.brevo.com/")
  )
    throw new Error("Unexpected provider request forbidden");
  return originalFetch(input, init);
};
