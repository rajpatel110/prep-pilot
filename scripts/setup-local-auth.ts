import { readFileSync, writeFileSync } from "node:fs";
import { prepareAuthEnvironment } from "./auth-environment";

const path = ".env.local";
const current = readFileSync(path, "utf8");
const prepared = prepareAuthEnvironment(current);
if (prepared !== current) writeFileSync(path, prepared);
console.log(
  "Local authentication configuration prepared. Existing credentials were preserved; no secrets displayed.",
);
