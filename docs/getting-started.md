# Getting started

`@klappay/one` is the embeddable payment button for Klappay One. It never
proposes a transaction, never signs anything, and never sees a private key
or a session token — it just opens a modal (an iframe, on desktop) or a
popup (mobile) pointing at Klappay's own hosted identity/wallet flow, and
relays the outcome back to your page via `postMessage`. Everything sensitive
— OTP, wallet selection, WalletConnect, signing — happens entirely on
Klappay's own origin. See [Protocol & security](/protocol) for exactly how
that boundary is enforced.

## Install

::: code-group

```bash [npm]
npm install @klappay/one
```

```bash [pnpm]
pnpm add @klappay/one
```

```bash [yarn]
yarn add @klappay/one
```

:::

Or via `<script>`, no build step required:

```html
<script src="https://js.klappay.com/one@1.js"></script>
```

Pin to a specific version instead of the `@1` major alias if you need a
frozen build — an exact version is also required if you want to add
`integrity`/`crossorigin` for Subresource Integrity, since `@1` is a moving
target and can't carry a fixed hash:

```html
<script
  src="https://js.klappay.com/one@1.2.3.js"
  integrity="sha384-..."
  crossorigin
></script>
```

## A charge, not an amount

Every checkout this button opens is tied to a `chargeId` — a `Charge`
your own backend already created against Klappay Core (with
[`@klappay/node`](https://node-sdk.klappay.com) or
[`@klappay/checkout-kit`](https://node-checkout-sdk.klappay.com)). The
button never takes an `amount`/`recipient`/`token` directly — the popup/
iframe fetches the real charge data itself once it opens, so nothing about
what's being paid ever needs to be trusted from client-side config. See
[Examples](/examples) for a full create-charge-then-render-button flow.

```ts
// on your own backend — never in the browser
import { createClient } from '@klappay/node'

const klap = createClient({ apiKey: process.env.KLAP_API_KEY! })
const charge = await klap.charges.create({
  amount: 25,
  currency: 'USD',
  expiresIn: 3600,
  acceptedPayments: [{ token: 'USDC', network: 'base' }],
})
// charge.id -> hand this to the button below
```

## Three ways to render the button

### Drop-in Web Component

```html
<klappay-button charge-id="ch_123" origin="https://klap.one" variant="black" size="md">
</klappay-button>
```

### Your own button

```html
<button data-klappay-one="ch_123" data-klappay-one-origin="https://klap.one">
  Pay with Klappay
</button>
```

Both are wired up automatically as soon as the script loads — no
JavaScript required for either, and both pick up elements added to the DOM
later too (a client-side router, an infinite-scroll list, a modal opened
after the fact). See [The button](/button) for every attribute.

### Programmatic

```ts
import { createKlappayOne } from '@klappay/one'

const klappayOne = createKlappayOne({
  chargeId: 'ch_123',
  origin: 'https://klap.one',
  onSuccess: (result) => {
    // UX signal only — confirm fulfillment via Klappay Core's webhook,
    // never from this callback alone. See /protocol.
  },
  onError: (error) => console.error(error),
  onCancel: () => console.log('payer closed the checkout'),
})

klappayOne.open()
```

See [Programmatic API](/programmatic) for the full `KlappayOneConfig`
shape, and [React](/react) for `<KlappayButton />` / `useKlappayOne()`.

## `origin`, one way or another

Every entry point needs to know which Klappay origin to open — there's no
baked-in default, since sandbox and production point at different hosts.
Pass it explicitly on every call, or set it once for the whole page:

```ts
import { configure } from '@klappay/one'

configure({ origin: 'https://klap.one', locale: 'en' })
```

`configure()` only affects the two zero-JS entry points (`<klappay-button>`
and `data-klappay-one`) — `createKlappayOne()` itself still requires
`origin` explicitly in its config; the programmatic API has no attribute to
fall back to, so there's no reason to make it implicit.

## Where to go next

- [`button.md`](/button) — every attribute `<klappay-button>` and
  `data-klappay-one` support, and the `success`/`error`/`cancel` events
  they dispatch.
- [`programmatic.md`](/programmatic) — the full `createKlappayOne()` API.
- [`react.md`](/react) — `<KlappayButton />` and `useKlappayOne()`.
- [`frameworks.md`](/frameworks) — Vue, Svelte, and anything else, since
  the core is a plain Web Component.
- [`modes.md`](/modes) — when you get an iframe/modal vs. a popup, and the
  automatic fallback between them.
- [`styling.md`](/styling) — `variant`/`size` and the CSS custom
  properties that cross the Shadow DOM boundary.
- [`errors.md`](/errors) — every error code, where each one comes from.
- [`protocol.md`](/protocol) — the `postMessage` wire format, the
  non-negotiable security invariants, and why `onSuccess` is never proof
  of payment.
- [`examples.md`](/examples) — full create-charge-then-render-button
  integrations, one per stack.

## For LLMs and agents

This site (built from these same files with VitePress) publishes
[`llms.txt`](/llms.txt) — a link index of every doc page — and
[`llms-full.txt`](/llms-full.txt) — the full content of every doc page
concatenated into one plain-text file. Point an agent, RAG pipeline, or MCP
server at either as a lightweight way to give it the whole package's
documentation without scraping HTML. Both regenerate on every deploy, so
they never drift from what's on this page.
