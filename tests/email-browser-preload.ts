if (
  !process.env.MONGODB_DB_NAME?.startsWith("prep_pilot_mail_ui_") ||
  process.env.RESEND_API_KEY !== "mock-browser-only" ||
  process.env.EMAIL_PROVIDER !== "resend" ||
  !process.send
)
  throw new Error("Disposable browser fixture required");
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url === "https://api.resend.com/emails") {
    const body = JSON.parse(String(init?.body)) as {
      to: string[];
      text: string;
    };
    if (body.to.length !== 1 || body.to[0] !== process.env.EMAIL_TEST_RECIPIENT)
      throw new Error("Fixture recipient mismatch");
    process.send!({ emailFixture: true, text: body.text });
    return Response.json({ id: "mock-browser-accepted" });
  }
  if (url.startsWith("https://api.brevo.com/"))
    throw new Error("Real provider delivery forbidden in browser fixture");
  return original(input, init);
};
