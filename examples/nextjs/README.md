# klap-one-js — Next.js example

A standalone, runnable Next.js 15 App Router app. `app/api/charges/route.ts`
is a Route Handler that creates a `Charge` with `@klappay/node` server-side
(`KLAP_API_KEY` never reaches the browser); `app/CheckoutButton.tsx` is a
Client Component that requests that charge, then renders `@klappay/one/react`'s
`<KlappayButton />` for it. This is the package's core reason to exist for a
React/Next.js merchant: a typed component instead of hand-rolling
`createKlappayOne()` and DOM wiring yourself.

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
  `createDemoCharge()` and returning `{ chargeId }`.
- `app/CheckoutButton.tsx` — a `'use client'` component: a "Start checkout"
  button that creates a charge, then renders `<KlappayButton />` for it and
  reports status (creating/ready/paid/error/cancelled).
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

Then open `http://localhost:3000` and click "Start checkout".

The server boots fine even without `KLAP_API_KEY`/`KLAP_BASE_URL` set
(credential resolution is lazy) — you'll just get a clean error from
`POST /api/charges` instead of a working checkout until you set them.
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

## Testing against local unpublished changes

By default this example depends on `@klappay/one@latest` from npm, so it
doubles as a live smoke test of whatever is actually published. To test
against changes made in this repo instead:

```bash
# from the repo root
pnpm build

# from this folder
cd examples/nextjs
pnpm link ../../
```

When you're done, restore the real published version before committing
anything in this folder:

```bash
pnpm unlink @klappay/one
pnpm install
```
