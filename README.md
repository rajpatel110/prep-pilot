# PrepPilot

A focused interview-preparation workspace for DSA, aptitude and computer science
fundamentals. Choose your goals and available time, review a suggested schedule,
then track practice and study progress.

**[Open the live demo](https://prep-pilot-theta-tan.vercel.app)**

## What you can do

- Create an account, verify your email, sign in and recover your password.
- Set company preferences, a preparation deadline and daily study time.
- Search and filter published questions and learning resources.
- Preview a budget-aware plan and explicitly accept it; inspect saved plan history.
- Record self-reported question outcomes and manage due revisions.
- Mark planned study tasks complete and inspect Dashboard and Progress.
- Update Settings without silently replacing your active plan.
- Use responsive light/dark themes with a remembered local preference.

Administrators manage drafts, previews, publication and archival. The owner
manages administrator access with password confirmation and audited role changes.
Public signup always creates a student.

The catalog is curated and limited, not complete company coverage or an official
company syllabus. Practice outcomes are self-reported, not automatically graded.
A daily budget is a ceiling: insufficient eligible content can leave empty days.
Opening content or recording an outcome does not automatically complete a task.

## Technology

Next.js 16 App Router, React 19, TypeScript, Node.js 24, MongoDB Atlas,
Mongoose, Better Auth and Zod. Styling uses CSS/Tailwind CSS 4, semantic theme
tokens and self-hosted Instrument Sans through Next's font loader.
Brevo provides transactional email; Vercel hosts the application.

Email verification and recovery are enabled in the hosted demo according to
operator-reported delivery and verification checks. Provider acceptance is not
a guarantee of inbox delivery. Attachments are not available in the demo;
no R2 setup is needed to use it.

## Run locally

Requirements: Node.js **24.x**, npm **10.9.3**, and a MongoDB replica set for
the authenticated application. Use your own database credentials. The existing
maintainer environment shares its database with the live application; never
treat that target as test data.

```bash
git clone https://github.com/rajpatel110/prep-pilot.git
cd prep-pilot
npm ci
cp .env.example .env.local
```

Edit the ignored `.env.local` privately. For an authenticated local application:

| Variable              | Value or purpose                                              |
| --------------------- | ------------------------------------------------------------- |
| `APP_URL`             | Exact browser origin, normally `http://localhost:3000`        |
| `AUTH_ENABLED`        | `true`                                                        |
| `MONGODB_URI`         | Private replica-set URI with access to your selected database |
| `MONGODB_DB_NAME`     | Your explicitly chosen development database                   |
| `BETTER_AUTH_SECRET`  | Independent random secret, at least 32 characters             |
| `CSRF_SECRET`         | Different random secret, at least 32 characters               |
| `RATE_LIMIT_SECRET`   | Different random secret, at least 32 characters               |
| `EMAIL_MODE`          | `test` for local development without mandatory verification   |
| `EMAIL_DELIVERY_MODE` | `disabled` unless deliberately testing delivery               |
| `FILES_ENABLED`       | `false`                                                       |

`npm run auth:setup` can generate missing independent secrets in your local file
without printing them; it preserves existing nonempty values. Inspect your chosen
target before running the following additive setup command:

```bash
npm run db:setup -- --database YOUR_LOCAL_DATABASE --environment development
npm run dev
```

Replace `YOUR_LOCAL_DATABASE` with the exact database name configured above.
Open the exact `APP_URL`; `localhost` and `127.0.0.1` are different origins.
On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`.

The public homepage also runs with the example's `AUTH_ENABLED=false`, without
database credentials; account and study features then remain disabled.
For real verification/recovery, use [email configuration](docs/email/OPERATIONS.md).
Do not use test-mode access policy for a public mandatory-verification deployment.

Never commit real environment files or expose secrets through `NEXT_PUBLIC_`.
No public environment variables are required.

## Commands

| Command                        | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `npm run dev`                  | Local Webpack development server               |
| `npm run build`                | Production build                               |
| `npm start`                    | Serve the existing production build            |
| `npm run typecheck`            | Next route generation and TypeScript checks    |
| `npm run lint`                 | ESLint with zero warnings                      |
| `npm run format:check`         | Prettier check                                 |
| `npm test`                     | Unit and contract tests without database setup |
| `npm run test:company-content` | Prepared-content validation                    |
| `npm run test:content-import`  | Disposable-database importer checks            |
| `npm run test:student`         | Disposable student integration journey         |
| `npm run test:practice`        | Practice integration checks                    |
| `npm run test:planning`        | Planning integration checks                    |

Integration commands require private MongoDB configuration; compiled HTTP checks
also require a current production build. Fixtures select disposable targets.
Do not run build/type generation concurrently with compiled-app checks.
CI runs formatting, lint, type checking, unit tests and build; it does not deploy
or use cloud credentials.

## Architecture

One modular monolith: `src/app` contains pages and thin Node.js API handlers;
`src/modules` owns domain rules and services; `src/shared` contains server
mechanisms and shared UI. Mongoose owns domain records, while Better Auth owns
identities and sessions. The planner is a pure deterministic engine. Mutations
use validation, authorization, CSRF, revision guards and transactional audits.

## Documentation

- [Product behavior](docs/PrepPilot_PRD_v2.md)
- [Architecture](docs/PrepPilot_System_Design.md)
- [API contracts](docs/PrepPilot_API_Design.md) · [Database contracts](docs/PrepPilot_Database_Design.md)
- [Deployment and environment operations](docs/DEPLOYMENT.md)
- [Planning rules](docs/PLANNING_CONFIGURATION.md)
- [Owner administration](docs/admin/OPERATIONS.md)
- [Content provenance and safe imports](docs/content/README.md)
- [Visual theme and accessibility](docs/VISUAL_THEME.md)
