<img src="./docs/public/icon-512.png" alt="Klap One" width="80" />
<img src="./docs/public/brand/klap-logo.png" alt="Klap" width="80" />

# @klappay/one

The embeddable payment button for Klap One. Drop it on any page — it
opens a modal (an iframe, by default) or a popup that handles identity,
wallet connection, and payment approval entirely on Klap's own origin,
then reports the result back to you.

## Install

```sh
npm install @klappay/one
```

Or via `<script>`, no build step required:

```html
<script src="https://js.klappay.com/one@1.js"></script>
```

Pin to a specific version instead of the `@1` major alias if you need a
frozen build — an exact version is also required if you want to add
`integrity`/`crossorigin` for Subresource Integrity, since the `@1` alias
is a moving target and can't carry a fixed hash.

## Quick start

### Drop-in button

```html
<klappay-button charge-id="ch_123" variant="black" size="md"></klappay-button>
```

### Your own button

```html
<button data-klappay-one="ch_123">Pay with Klap</button>
```

Both are wired up automatically once the script loads — no JavaScript
required for either. Both also accept `mode="iframe"` / `mode="popup"`
(`data-klappay-one-mode` for the plain button) to force a mode instead of
the iframe default.

### Programmatic

```ts
import { createKlappayOne } from '@klappay/one'

const klappayOne = createKlappayOne({
  chargeId: 'ch_123',
  onSuccess: (result) => {
    // UX signal only — confirm fulfillment via Klap Core's webhook,
    // never from this callback alone.
  },
  onError: (error) => console.error(error),
  onCancel: () => console.log('payer closed the checkout'),
})

klappayOne.open()
```

Defaults to an iframe/modal on every device — pass
`mode: 'iframe' | 'popup'` to force one or the other.

### React

```tsx
import { KlappayButton } from '@klappay/one/react'

function Checkout() {
  return <KlappayButton chargeId="ch_123" variant="black" size="md" />
}
```

## Documentation

Full docs, guides, and framework examples: **https://js-one.klappay.com**
(built from `docs/` in this repository — `docs/getting-started.md` for a
full walkthrough and `docs/protocol.md` for the popup/iframe embed and
`postMessage` contract this package implements against). Runnable example
apps live in [`examples/`](./examples).

The site also publishes [`llms.txt`](https://js-one.klappay.com/llms.txt)
and [`llms-full.txt`](https://js-one.klappay.com/llms-full.txt) —
plain-text, LLM-friendly versions of these docs, regenerated on every
deploy, for feeding an agent or MCP server.

## License

MIT
