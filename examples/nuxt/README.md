# klap-one-js — Nuxt example

A standalone, runnable example built with [Nuxt](https://nuxt.com) — a
Nitro server route creates the `Charge`, and a Vue component wraps the
raw `<klappay-button>` Custom Element (there is no Vue-specific wrapper
package; `@klappay/one` registers `<klappay-button>` as soon as it's
imported, and it's used directly in the template).

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
- `app/components/CheckoutButton.vue` — the browser side: "Start
  checkout" calls `POST /api/charges`, stores the returned `chargeId`,
  calls `configure({ origin })` from `@klappay/one`, then renders
  `<klappay-button :charge-id="chargeId" />` and reports `success` /
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

Then open `http://localhost:3000` and click "Start checkout".

`KLAP_API_KEY`/`KLAP_BASE_URL` are read into `runtimeConfig.apiKey`/
`runtimeConfig.baseUrl` (server-only); `KLAP_ONE_ORIGIN` is read into
`runtimeConfig.public.klapOneOrigin`, which `CheckoutButton.vue` passes to
`configure({ origin })`.

The server boots fine even without any of the three variables set
(credential resolution is lazy) — you'll just get a clean error from
`POST /api/charges` instead of a working checkout until you set them.

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

## Testing against local unpublished changes

By default this example depends on `@klappay/one@latest` from npm, so it
doubles as a live smoke test of whatever is actually published. To test
against changes made in this repo instead:

```bash
# from the repo root
pnpm build

# from this folder
cd examples/nuxt
pnpm link ../../
```

When you're done, restore the real published version before committing
anything in this folder:

```bash
pnpm unlink @klappay/one
pnpm install
```
