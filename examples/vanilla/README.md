# klap-one-js — vanilla example

A standalone, runnable example built with [Hono](https://hono.dev) and
**zero frontend build step** — `@klappay/one` is loaded with a plain
`<script>` tag (the prebuilt IIFE bundle, `dist/index.global.js`), the same
way Core's own hosted checkout (klap-checkout) serves its own client JS.
This is the package's core reason to exist for a merchant with no frontend
build tooling at all: no bundler, no JSX, no `import` resolution in the
browser — just `window.KlappayOne`.

This app is standalone — it is not part of a pnpm workspace, and depends
on the real, published `@klappay/one` package from npm (see "Testing
against local unpublished changes" below to point it at this repo's own
build instead).

## What's here

- `src/server.ts` — a Hono app: `POST /api/charges` (creates a `Charge`
  with `@klappay/node`, server-side, so `KLAP_API_KEY` never reaches the
  browser), `GET /api/config` (hands the client the `KLAP_ONE_ORIGIN` to
  open), a static route serving the IIFE bundle from `node_modules`, and a
  static route serving `public/`.
- `src/index.ts` — boots the Hono app with `@hono/node-server`.
- `public/index.html` + `public/app.js` — the browser side: on click,
  creates a charge, then calls `KlappayOne.createKlappayOne({ chargeId,
  origin, ... }).open()` and reports the result.

## Prerequisites

- Node 24+
- A Klappay API key and base URL from your Klappay dashboard
- The Klappay One origin for your environment (`KLAP_ONE_ORIGIN`)

## Run it

```bash
pnpm install
KLAP_API_KEY=your_api_key \
  KLAP_BASE_URL=your_base_url \
  KLAP_ONE_ORIGIN=https://klap.one \
  pnpm dev
```

Then open `http://localhost:3000` and click "Start checkout".

The server boots fine even without any of the three variables set
(credential resolution is lazy) — you'll just get a clean error from
`POST /api/charges` instead of a working checkout until you set them.

## Test

```bash
pnpm test
```

`src/server.test.ts` exercises `createDemoCharge()` — the function behind
`POST /api/charges` — against a fake `@klappay/node` client, asserting the
exact charge shape requested and that a failure from the underlying client
propagates instead of being swallowed. It never hits the network and never
needs real credentials.

## Testing against local unpublished changes

By default this example depends on `@klappay/one@latest` from npm, so it
doubles as a live smoke test of whatever is actually published. To test
against changes made in this repo instead:

```bash
# from the repo root
pnpm build

# from this folder
cd examples/vanilla
pnpm link ../../
```

When you're done, restore the real published version before committing
anything in this folder:

```bash
pnpm unlink @klappay/one
pnpm install
```
