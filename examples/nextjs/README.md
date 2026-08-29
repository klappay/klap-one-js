# klap-one-js — Next.js example

A standalone, runnable Next.js 15 App Router app. `app/api/charges/route.ts`
is a Route Handler that creates a `Charge` with `@klappay/node` server-side
(`KLAP_API_KEY` never reaches the browser); `app/CheckoutButton.tsx` is a
Client Component with origin/charge ID inputs that renders
`@klappay/one/react`'s `<KlappayButton />` for whatever charge you point it
at. This is the package's core reason to exist for a React/Next.js
merchant: a typed component instead of hand-rolling `createKlappayOne()`
and DOM wiring yourself.

Full API docs: **https://js-one.klappay.com** (this app is also walked through at [/examples#next-js-app-router](https://js-one.klappay.com/examples#next-js-app-router)).

This app is standalone — it is not part of a pnpm workspace, and depends on
the real, published `@klappay/one` package from npm (see "Testing against
local unpublished changes" below to point it at this repo's own build
instead).

## What's here

- `lib/klap.ts` — the `@klappay/node` client, created once from
  `KLAP_API_KEY`/`KLAP_BASE_URL`.
- `lib/create-demo-charge.ts` — `createDemoCharge()`, the testable function
  behind the charge-creation route.
- `app/api/charges/route.ts` — `POST /api/charges`, calling
  `createDemoCharge()` and returning `{ chargeId }`. Not called from the
  page itself; `curl -X POST http://localhost:3000/api/charges` mints a
  real `chargeId` to paste into the form below.
- `app/CheckoutButton.tsx` — a `'use client'` component: an origin input
  (pre-filled from `NEXT_PUBLIC_KLAP_ONE_ORIGIN`) and a charge ID input,
  plus `<KlappayButton />` itself, always mounted. It renders natively
  disabled until both inputs have a value — the "Generate button" button
  (labeled "Fill in origin and charge ID first" until then) copies the
  inputs' current value onto it, enabling it, and reports its status
  (paid/error/cancelled).
- `app/page.tsx` + `app/layout.tsx` — the page that renders `CheckoutButton`.

## Prerequisites

- Node 24+
- A Klappay API key and base URL from your Klappay dashboard
- The Klappay One origin for your environment (`NEXT_PUBLIC_KLAP_ONE_ORIGIN`)

## Run it

```bash
pnpm install
KLAP_API_KEY=your_api_key \
  KLAP_BASE_URL=your_base_url \
  NEXT_PUBLIC_KLAP_ONE_ORIGIN=https://klap.one \
  pnpm dev
```

Then open `http://localhost:3000`, fill in the origin and charge ID
inputs, and click "Generate button".

The server boots fine even without `KLAP_API_KEY`/`KLAP_BASE_URL` set
(credential resolution is lazy) — a curled `POST /api/charges` just returns
a clean error instead of a real `chargeId` until you set them.
`NEXT_PUBLIC_KLAP_ONE_ORIGIN` is inlined at build time, so it must be set
before `pnpm dev`/`pnpm build` runs, not just at request time.

## Test

```bash
pnpm test
```

`lib/create-demo-charge.test.ts` exercises `createDemoCharge()` — the
function behind `POST /api/charges` — against a fake `@klappay/node` client,
asserting the exact charge shape requested and that a failure from the
underlying client propagates instead of being swallowed. It never hits the
network and never needs real credentials.

## Always tests against the local build

This example depends on `@klappay/one` via `"file:../.."` — always this repo's
own `dist/`, never a version from npm. Run `pnpm build` at the repo root
whenever the library changes; this example (already installed) picks it up
immediately since it's a real filesystem link, no `pnpm install`, link, or
unlink step needed.

CI separately verifies `@klappay/one@latest` — the real npm release — still
satisfies this example, in a non-blocking job (see the repo's own
`.github/workflows/ci.yml`).
