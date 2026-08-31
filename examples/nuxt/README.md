# klap-one-js — Nuxt example

A standalone, runnable example built with [Nuxt](https://nuxt.com) — a
Nitro server route can create a `Charge`, and a Vue component wraps the
raw `<klappay-button>` Custom Element (there is no Vue-specific wrapper
package; `@klappay/one` registers `<klappay-button>` as soon as it's
imported, and it's used directly in the template).

Full API docs: **https://js-one.klappay.com** (this app is also walked through at [/examples#nuxt](https://js-one.klappay.com/examples#nuxt)).

This app is standalone — it is not part of a pnpm workspace, and depends
on the real, published `@klappay/one` package from npm (see "Testing
against local unpublished changes" below to point it at this repo's own
build instead).

## What's here

- `server/utils/create-demo-charge.ts` — the testable
  `createDemoCharge(charges)` function (creates a `Charge` with
  `@klappay/node`, server-side, so `KLAP_API_KEY` never reaches the
  browser), a plain module with no Nuxt auto-import dependency.
- `server/api/charges.post.ts` — the Nitro route handler: builds a
  `createClient()` from `useRuntimeConfig()` and calls `createDemoCharge`.
  Not called from the page itself; `curl -X POST
  http://localhost:3000/api/charges` mints a real `chargeId` to paste
  into the form below.
- `app/components/CheckoutButton.vue` — the browser side: an origin input
  (pre-filled from `runtimeConfig.public.klapOneOrigin`) and a charge ID
  input, plus `<klappay-button>` itself, always mounted. It renders
  natively disabled until both inputs have a value — the "Generate button"
  button (labeled "Fill in origin and charge ID first" until then) copies
  the inputs' current value onto it, enabling it, and reports `success` /
  `error` / `cancel` status.
- `app/app.vue` — renders `<CheckoutButton />` inside `<ClientOnly>`
  (`@klappay/one` registers a Custom Element on `window.customElements`,
  a browser-only API, so it can't run during server-side rendering).
- `nuxt.config.ts` — `vue.compilerOptions.isCustomElement` tells Vue's
  compiler that `klappay-button` is an intentional Custom Element, not an
  unresolved component, and `runtimeConfig` reads the three env vars
  below.

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

Then open `http://localhost:3000`, fill in the origin and charge ID
inputs, and click "Generate button".

`KLAP_API_KEY`/`KLAP_BASE_URL` are read into `runtimeConfig.apiKey`/
`runtimeConfig.baseUrl` (server-only); `KLAP_ONE_ORIGIN` is read into
`runtimeConfig.public.klapOneOrigin`, which `CheckoutButton.vue` uses to
pre-fill the origin input.

The server boots fine even without any of the three variables set
(credential resolution is lazy) — a curled `POST /api/charges` just
returns a clean error instead of a real `chargeId` until you set them.

## Test

```bash
pnpm test
```

`server/utils/create-demo-charge.test.ts` exercises `createDemoCharge()`
— the function behind `POST /api/charges` — against a fake `@klappay/node`
client, asserting the exact charge shape requested and that a failure
from the underlying client propagates instead of being swallowed. It
never hits the network, never needs real credentials, and runs under
plain `vitest` with no Nuxt runtime.

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
