# klap-one-js — vanilla example

A standalone, runnable example built with [Hono](https://hono.dev) and
**zero frontend build step** — `@klappay/one` is loaded with a plain
`<script>` tag (the prebuilt IIFE bundle, `dist/index.global.js`), the same
way Core's own hosted checkout (klap-checkout) serves its own client JS.
This is the package's core reason to exist for a merchant with no frontend
build tooling at all: no bundler, no JSX, no `import` resolution in the
browser — just `window.KlappayOne`.

Full API docs: **https://js-one.klappay.com** (this app is also walked through at [/examples#vanilla-no-bundler](https://js-one.klappay.com/examples#vanilla-no-bundler)).

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
- `public/index.html` + `public/app.js` — the browser side, two integrations
  side by side: the programmatic API (creates a real charge via `POST
  /api/charges`, then calls `KlappayOne.createKlappayOne({ chargeId,
  origin, ... }).open()`) and `<klappay-button>` (an origin input,
  pre-filled from `GET /api/config`, and a charge ID input you fill in by
  hand, plus a "Generate button" button that sets `charge-id`/`origin` on
  a `<klappay-button>` element) — both report the result the same way.

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

Then open `http://localhost:3000` — click "Start checkout" for the
programmatic-API demo, or fill in the origin/charge ID inputs and click
"Generate button" for the `<klappay-button>` demo (its origin input is
pre-filled from `GET /api/config`; the charge ID is always typed in by
hand — `curl -X POST http://localhost:3000/api/charges` mints a real one).

The server boots fine even without any of the three variables set
(credential resolution is lazy) — the programmatic-API demo and a curled
`POST /api/charges` will just return a clean error until you set them.

## Test

```bash
pnpm test
```

`src/server.test.ts` exercises `createDemoCharge()` — the function behind
`POST /api/charges` — against a fake `@klappay/node` client, asserting the
exact charge shape requested and that a failure from the underlying client
propagates instead of being swallowed. It never hits the network and never
needs real credentials.

## Always tests against the local build

This example depends on `@klappay/one` via `"file:../.."` — always this repo's
own `dist/`, never a version from npm. That's not a live link, though: pnpm
snapshots `file:` dependencies into its store at install time, so after
`pnpm build` at the repo root, re-run `pnpm install` in this folder to pick up
the change (a fresh clone's first install already gets whatever's currently
built).

CI separately verifies `@klappay/one@latest` — the real npm release — still
satisfies this example, in a non-blocking job (see the repo's own
`.github/workflows/ci.yml`).
