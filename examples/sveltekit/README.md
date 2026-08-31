# klap-one-js — SvelteKit example

A standalone, runnable SvelteKit app: a `+server.ts` route can create a
`Charge` server-side (so `KLAP_API_KEY` never reaches the browser), and
the raw `<klappay-button>` Custom Element is rendered directly in a
Svelte template — there's no Svelte-specific wrapper package, since a
real Custom Element already works natively in every framework's own
templating.

Full API docs: **https://js-one.klappay.com** (this app is also walked through at [/examples#sveltekit](https://js-one.klappay.com/examples#sveltekit)).

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
  Not called from the page itself; `curl -X POST
  http://localhost:5173/api/charges` mints a real `chargeId` to paste into
  the form below.
- `src/routes/+page.svelte` — an origin input (pre-filled from
  `PUBLIC_KLAP_ONE_ORIGIN`) and a charge ID input, plus `<klappay-button>`
  itself, always mounted. It renders natively disabled until both inputs
  have a value — the "Generate button" button (labeled "Fill in origin and
  charge ID first" until then) copies the inputs' current value onto it,
  enabling it, and reports status in the UI.
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

Then open `http://localhost:5173`, fill in the origin and charge ID
inputs, and click "Generate button".

## Test

```bash
pnpm test
```

`src/lib/server/create-demo-charge.test.ts` exercises `createDemoCharge()`
— the function behind `POST /api/charges` — against a fake `@klappay/node`
client, asserting the exact charge shape requested and that a failure from
the underlying client propagates instead of being swallowed. It never hits
the network and never needs real credentials.

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
