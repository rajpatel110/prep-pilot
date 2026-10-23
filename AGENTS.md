# PrepPilot working instructions

## Sources of truth

Read these documents before implementing features:

- docs/PrepPilot_PRD_v2.md — product scope and acceptance criteria.
- docs/PrepPilot_System_Design.md — architecture and module boundaries.
- docs/PrepPilot_API_Design.md — HTTP contracts.
- docs/PrepPilot_Database_Design.md — persistence and invariants.

Report missing documents and material conflicts. Do not invent requirements.
Distinguish confirmed decisions from proposed defaults.

## Planning and implementation

Planning/read-only requests permit inspection and discussion only. Do not change
files, install packages or change infrastructure during those requests.
Implement only when requested or explicitly approved, within that scope.

## Architecture

Use one Next.js App Router modular monolith with TypeScript and Node.js REST
Route Handlers; no Express or NestJS. Keep src/app thin and business rules in
src/modules. Services enforce ownership regardless of caller. Server Components
may call authorised read services directly; browser mutations use REST.

Mongoose owns domain collections; Better Auth's MongoDB adapter owns auth
collections. Do not define competing auth models. Modules use another module's
public services, not direct collection writes. Keep planning rules pure.
Use src/shared/server for server mechanisms, src/shared/ui for reusable UI and
src/config for public/versioned configuration. Add real modules as needed,
not empty service/repository/model placeholders.

Mark server-only application imports. Import environment configuration through
src/shared/server/config.ts; env.ts is the pure parser shared with next.config.ts.
Never import the parser from client code. Keep public config free of secrets.
Follow documented DTOs, Zod validation, sessions, CSRF, transactions, retries,
concurrency and caching rules. Preserve history. Confirm schedule changes.

## Commands and validation

Use Node 24 (.nvmrc), npm 10.9.3 and package-lock.json. Use npm.cmd if PowerShell
blocks npm.ps1. Run npm run format:check, npm run lint, npm run typecheck and
npm run build for implementation changes. Run relevant tests when present;
add meaningful tests for new rules, security boundaries and persistence.
Verify changed UI at mobile/desktop sizes and with keyboard navigation.
Report checks run, failures and limitations; do not claim unrun checks pass.
Application and operational scripts must use TypeScript.

## Existing work and secrets

Inspect Git status first. Preserve existing edits and untracked files. Do not
reset, discard, overwrite or reformat unrelated work, including design documents.
Never commit secrets or real environment files. .env.example contains placeholders
only. Keep credentials, cookies, tokens and signed URLs out of logs and bundles.
Do not commit, push, deploy, provision cloud resources or use production services
without authorisation. Update docs/IMPLEMENTATION_STATUS.md with scope and evidence.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
