# AGENTS.md

This repo is the SignatureAPI Next.js starter: a GitHub template that sends one agreement for signature with the SignatureAPI e-signature API, tracks it through webhooks and links to the signed PDF. Next.js App Router, TypeScript, Drizzle with SQLite, Vitest.

## Run and test

```bash
npm install
npx --yes signatureapi init --env-path .env.local     # writes SIGNATUREAPI_KEY
npm run dev                                            # http://localhost:3000
npx --yes signatureapi listen --env-path .env.local --forward-to http://127.0.0.1:3000/webhooks/signatureapi
npm run lint
npm run typecheck
npm test
```

The e2e test in `e2e/` runs against SignatureAPI test mode and needs credentials. Only `e2e/app.config.ts` is specific to this repo.

## Where things live

- `lib/signatureapi.ts`: the only SignatureAPI client (plain `fetch`, `X-API-Key`). `uploadDocument`, `createEnvelope`, `listDeliverables`.
- `app/webhooks/signatureapi/route.ts`: webhook receiver. Event type to status map.
- `app/actions.ts`: the form's Server Action (upload, create envelope, save `Agreement`).
- `app/agreements/[id]/signed.pdf/route.ts`: redirects to a fresh deliverable URL.
- `lib/db/schema.ts`, `drizzle/`: the `agreements` table and its migrations (`npx drizzle-kit generate` after a schema change). `instrumentation.ts` applies them at startup.
- `app/page.tsx`, `app/agreement-form.tsx`: the page. Keep the DOM in sync with the other SignatureAPI starters; the e2e test relies on its labels and `data-*` attributes.

## SignatureAPI rules

- https://spec.signatureapi.com/openapi.yaml is the source of truth for fields, enums, events and paths. Check it, not memory.
- Verify webhooks with the `standardwebhooks` package against the **raw** body (`await request.text()`) and the `webhook-id`, `webhook-timestamp`, `webhook-signature` headers. Never parse the JSON first and never hand-roll the HMAC. A failed check returns 401 and does nothing else.
- Find the agreement by `data.envelope_id`. Events carry ids, not objects. A terminal status never changes again.
- Deliverable URLs expire after an hour. Fetch them on demand.
- Use test keys (`key_test_...`) only. Never put a key in code, commits, logs or command arguments; it lives in `.env.local`.

The SignatureAPI skills are vendored in `.agents/skills/` and installed for Claude Code through the plugin in `.claude/settings.json`. Use them for API, webhook and diagnosis work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
