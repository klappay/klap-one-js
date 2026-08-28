# klap-one-js — SvelteKit example

A standalone, runnable SvelteKit app: a `+server.ts` route creates the
`Charge` server-side (so `KLAP_API_KEY` never reaches the browser), and
the raw `<klappay-button>` Custom Element is rendered directly in a
Svelte template — there's no Svelte-specific wrapper package, since a
real Custom Element already works natively in every framework's own
templating.

This app is standalone — it is not part of a pnpm workspace, and depends
on the real, published `@klappay/one` package from npm (see "Testing
against local unpublished changes" below to point it at this repo's own
build instead).

## What's here

- `src/lib/server/create-demo-charge.ts` — `createDemoCharge(charges)`,
  the testable function behind charge creation (same shape as `@klappay/node`'s
  `charges.create()` call, factored out from the route so it's unit-testable
  without hitting the network).
- `src/lib/server/create-demo-charge.test.ts` — exercises `createDemoCharge()`
  against a fake `@klappay/node` client.
- `src/routes/api/charges/+server.ts` — `POST` handler reading `KLAP_API_KEY`/
  `KLAP_BASE_URL` from `$env/dynamic/private` and calling `createDemoCharge`.
  Dynamic rather than static so this typechecks/builds fine (CI included)
  even when neither variable is set — `$env/static/private` requires the
  vars to exist at build time, `$env/dynamic/private` only reads them at
  request time, same lazy-resolution behavior as the other three examples.
- `src/routes/+page.svelte` — a "Start checkout" button that fetches
  `/api/charges`, calls `configure({ origin: PUBLIC_KLAP_ONE_ORIGIN })`
  from `@klappay/one`, then renders `<klappay-button charge-id={chargeId}
  on:success on:error on:cancel />` and reports status in the UI.
- `src/routes/+page.ts` — `export const ssr = false` for that page:
  `@klappay/one` registers a Custom Element and touches `document` at
  import time, so this route can't be server-rendered.

## Prerequisites

- Node 24+
- A Klappay API key and base URL from your Klappay dashboard
- The Klappay One origin for your environment (`PUBLIC_KLAP_ONE_ORIGIN`)

## Run it

```bash
pnpm install
```

Copy `.env.example` to `.env` and fill in `KLAP_API_KEY`, `KLAP_BASE_URL`,
and `PUBLIC_KLAP_ONE_ORIGIN` (e.g. `https://klap.one`), then:

```bash
pnpm dev
```

Then open `http://localhost:5173` and click "Start checkout".

## Test

```bash
pnpm test
```

`src/lib/server/create-demo-charge.test.ts` exercises `createDemoCharge()`
— the function behind `POST /api/charges` — against a fake `@klappay/node`
client, asserting the exact charge shape requested and that a failure from
the underlying client propagates instead of being swallowed. It never hits
the network and never needs real credentials.

## Testing against local unpublished changes

By default this example depends on `@klappay/one@latest` from npm, so it
doubles as a live smoke test of whatever is actually published. To test
against changes made in this repo instead:

```bash
# from the repo root
pnpm build

# from this folder
cd examples/sveltekit
pnpm link ../../
```

When you're done, restore the real published version before committing
anything in this folder:

```bash
pnpm unlink @klappay/one
pnpm install
```
