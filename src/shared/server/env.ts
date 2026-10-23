// This parser is also used by next.config.ts, outside React's module graph.
// Application code must import it through the server-only config.ts wrapper.
import { z } from "zod";

const schema = z.object({
  APP_URL: z
    .string()
    .url()
    .refine((value) => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      );
    })
    .default("http://localhost:3000"),
});

export function getServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse({ APP_URL: source.APP_URL });
  if (!result.success) {
    // Field names only: do not include environment values in diagnostics.
    throw new Error(
      "Invalid server configuration: APP_URL must be an HTTP(S) origin without credentials, a path, query or fragment.",
    );
  }
  return result.data;
}
