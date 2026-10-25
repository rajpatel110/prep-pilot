import { createRequire } from "node:module";
import { createServer } from "node:http";
import { Readable } from "node:stream";

if (
  !/^pp_files_ui_[a-f0-9]{12}$/.test(process.env.MONGODB_DB_NAME ?? "") ||
  process.env.R2_BUCKET !== "mock-browser-only" ||
  process.env.R2_ACCESS_KEY_ID !== "mock-browser-only" ||
  !process.send
)
  throw new Error("Explicit disposable file browser fixture required");

const objects = new Map<string, Buffer>();
const requireSdk = createRequire(import.meta.url);
const sdk = requireSdk(
  "@aws-sdk/client-s3",
) as typeof import("@aws-sdk/client-s3");
const OriginalClient = sdk.S3Client;
class FixtureClient extends OriginalClient {
  constructor(config: ConstructorParameters<typeof OriginalClient>[0]) {
    super({
      ...config,
      endpoint: "http://127.0.0.1:3135",
      forcePathStyle: true,
    });
  }
}
Object.defineProperty(sdk, "S3Client", { value: FixtureClient });
Object.defineProperty(FixtureClient.prototype, "send", {
  value: async (command: {
    constructor: { name: string };
    input: Record<string, unknown>;
  }) => {
    const input = command.input;
    if (input.Bucket !== "mock-browser-only")
      throw new Error("Fixture bucket mismatch");
    const key = String(input.Key ?? "");
    const bytes = objects.get(key);
    switch (command.constructor.name) {
      case "HeadObjectCommand":
      case "GetObjectCommand":
        if (!bytes)
          throw Object.assign(new Error("Missing fixture object"), {
            $metadata: { httpStatusCode: 404 },
          });
        return command.constructor.name === "HeadObjectCommand"
          ? { ContentLength: bytes.length }
          : { Body: Readable.from([bytes]) };
      case "PutObjectCommand":
        if (input.IfNoneMatch === "*" && objects.has(key))
          throw new Error("Fixture immutable key conflict");
        objects.set(key, Buffer.from(input.Body as Uint8Array));
        return {};
      case "DeleteObjectCommand":
        objects.delete(key);
        return {};
      case "ListObjectsV2Command":
        return {
          Contents: [...objects.keys()]
            .filter((value) => value.startsWith(String(input.Prefix)))
            .map((Key) => ({ Key })),
        };
      default:
        throw new Error("Unsupported fixture command; no provider fallback");
    }
  },
});

const bridge = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3134");
  response.setHeader("Access-Control-Allow-Methods", "PUT, GET");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store");
  const url = new URL(request.url ?? "/", "http://127.0.0.1:3135");
  const prefix = "/mock-browser-only/";
  if (!url.pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }
  const key = decodeURIComponent(url.pathname.slice(prefix.length));
  if (request.method === "PUT") {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 10485760) {
        response.writeHead(413).end();
        return;
      }
      chunks.push(Buffer.from(chunk));
    }
    objects.set(key, Buffer.concat(chunks));
    response.writeHead(200).end();
  } else if (request.method === "GET" && objects.has(key)) {
    response.setHeader(
      "Content-Type",
      url.searchParams.get("response-content-type") ??
        "application/octet-stream",
    );
    response.setHeader(
      "Content-Disposition",
      url.searchParams.get("response-content-disposition") ?? "attachment",
    );
    response.end(objects.get(key));
  } else response.writeHead(404).end();
});
bridge.listen(3135, "127.0.0.1");
process.once("disconnect", () => bridge.close());
