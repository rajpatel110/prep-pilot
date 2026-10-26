import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";

let stage = "configuration";
async function main() {
  const focused = process.argv.includes("--focused");
  const holdMilliseconds = focused ? 120000 : 900000;
  if (!process.env.MONGODB_URI)
    throw new Error("Test database configuration missing");
  const database = `prep_pilot_mail_ui_${randomBytes(6).toString("hex")}`;
  assert.ok(Buffer.byteLength(database) <= 38);
  const origin = "http://127.0.0.1:3119",
    gateway = "http://127.0.0.1:3120";
  stage = "disposable database connection";
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  const links = new Map<string, string>();
  let server: ChildProcess | undefined;
  let cookies: string[] = [];
  const bridge = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    const path = request.url?.split("?")[0];
    if (path === "/login") {
      response.writeHead(302, {
        "Set-Cookie": cookies,
        Location: `${origin}/verify-email`,
      });
      response.end();
    } else if (path === "/verification" || path === "/reset") {
      const link = links.get(path);
      if (!link) {
        response.writeHead(404);
        response.end("No mock message available yet.");
        return;
      }
      response.writeHead(302, { Location: link });
      response.end();
    } else if (path === "/invalid-verification") {
      response.writeHead(302, {
        Location: `${origin}/verify-email#token=invalid-fixture-token`,
      });
      response.end();
    } else {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(
        `<h1>Disposable email browser fixture</h1><p>Mock delivery only. No real accounts or email.</p><a href="/login">Open fixture session</a><p><a href="/verification">Open latest verification message</a></p><a href="/reset">Open latest reset message</a><p><a href="/invalid-verification">Open invalid verification link</a></p>${links.has("/verification") ? `<a href="${links.get("/verification")}">Captured mock verification link</a>` : ""}`,
      );
    }
  });
  try {
    stage = "isolated migrations";
    await migrateDatabase(db);
    stage = "production server start";
    server = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        "./tests/email-browser-preload.ts",
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3119",
      ],
      {
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NODE_ENV: "production",
          APP_URL: origin,
          AUTH_ENABLED: "true",
          MONGODB_DB_NAME: database,
          EMAIL_MODE: "test",
          EMAIL_DELIVERY_MODE: "owner_test",
          EMAIL_PROVIDER: "resend",
          EMAIL_TEST_RECIPIENT: "email-browser-owner@example.com",
          RESEND_API_KEY: "mock-browser-only",
          RESEND_FROM_EMAIL: "PrepPilot <onboarding@resend.dev>",
          RESEND_SENDER_VERIFIED: "false",
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
        },
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      },
    );
    server.on(
      "message",
      (message: { emailFixture?: boolean; text?: string }) => {
        if (!message.emailFixture || typeof message.text !== "string") return;
        const value = message.text
          .split("\n")
          .find((line) => line.startsWith(origin));
        if (!value) return;
        const link = new URL(value);
        if (link.origin !== origin) return;
        links.set(
          link.pathname === "/verify-email" ? "/verification" : "/reset",
          link.href,
        );
        console.log(
          `Mock ${link.pathname === "/verify-email" ? "verification" : "reset"} message accepted; link retained only in fixture memory.`,
        );
      },
    );
    for (let count = 0; count < 60; count++) {
      try {
        if ((await fetch(`${origin}/api/health`)).ok) break;
      } catch {}
      if (count === 59 || server.exitCode !== null)
        throw new Error("Fixture server unavailable");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    stage = "fixture signup";
    const signup = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        name: "Disposable email browser",
        email: "email-browser-owner@example.com",
        password: randomBytes(24).toString("base64url"),
      }),
    });
    assert.equal(signup.status, 200);
    cookies = signup.headers.getSetCookie();
    assert.ok(cookies.length);
    for (const path of [
      "/verify-email",
      "/forgot-password",
      "/reset-password",
    ]) {
      const page = await fetch(`${origin}${path}`);
      assert.equal(page.status, 200);
      assert.equal(page.headers.get("referrer-policy"), "no-referrer");
      assert.ok(page.headers.get("cache-control")?.includes("no-store"));
      assert.ok(page.headers.get("x-robots-tag")?.includes("noindex"));
    }
    await new Promise<void>((resolve) =>
      bridge.listen(3120, "127.0.0.1", resolve),
    );
    console.log(
      `BROWSER READY ${gateway}/ — isolated production fixture, mock delivery only. Automatic cleanup after ${holdMilliseconds / 60000} minutes.${focused ? "" : " Enter also finishes."}`,
    );
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, holdMilliseconds);
      if (!focused)
        process.stdin.once("data", () => {
          clearTimeout(timer);
          resolve();
        });
    });
    process.stdin.pause();
    const user = await db
      .collection("user")
      .findOne({ email: "email-browser-owner@example.com" });
    const deliveries = await db
      .collection("emailDeliveries")
      .find({})
      .project({ _id: 0, type: 1, state: 1, attempts: 1 })
      .toArray();
    console.log(
      JSON.stringify({
        fixtureVerified: user?.emailVerified === true,
        deliveries,
      }),
    );
  } finally {
    bridge.close();
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise<void>((resolve) => {
        server!.once("exit", () => resolve());
        setTimeout(resolve, 5000).unref();
      });
    }
    assert.ok(/^prep_pilot_mail_ui_[a-f0-9]{12}$/.test(database));
    try {
      await db.dropDatabase();
    } finally {
      await client.close();
    }
    console.log(
      "Disposable browser database removed; owned fixture servers stopped.",
    );
  }
}
void main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "unknown error",
      code:
        typeof (error as { code?: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined,
      category:
        error instanceof Error &&
        /not authorized|unauthorized/i.test(error.message)
          ? "database authorization"
          : undefined,
      location:
        error instanceof Error
          ? error.stack?.match(/email-browser-fixture\.ts:\d+:\d+/)?.[0]
          : undefined,
    }),
  );
  process.exitCode = 1;
});
