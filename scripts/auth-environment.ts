import { randomBytes } from "node:crypto";

export function prepareAuthEnvironment(current: string) {
  let result = current;
  function value(key: string) {
    return new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*([^\\r\\n]*)`, "m")
      .exec(result)?.[1]
      ?.trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  function set(key: string, content: string) {
    const expression = new RegExp(`^[ \\t]*${key}[ \\t]*=[^\\r\\n]*`, "gm");
    if (expression.test(result))
      result = result.replace(expression, `${key}=${content}`);
    else result += `${result.endsWith("\n") ? "" : "\n"}${key}=${content}\n`;
  }
  for (const key of [
    "BETTER_AUTH_SECRET",
    "CSRF_SECRET",
    "RATE_LIMIT_SECRET",
  ]) {
    if (!value(key)) set(key, randomBytes(48).toString("base64url"));
  }
  set("AUTH_ENABLED", "true");
  if (!value("EMAIL_MODE")) set("EMAIL_MODE", "test");
  return result;
}
