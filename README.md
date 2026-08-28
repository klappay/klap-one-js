# @klappay/one

The embeddable payment button for Klappay One. Drop it on any page — it
opens a modal (an iframe, on desktop) or a popup (mobile) that handles
identity, wallet connection, and payment approval entirely on Klappay's
own origin, then reports the result back to you.

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
<button data-klappay-one="ch_123">Pay with Klappay</button>
```

Both are wired up automatically once the script loads — no JavaScript
required for either. Both also accept `mode="iframe"` / `mode="popup"`
(`data-klappay-one-mode` for the plain button) to force a mode instead of
the mobile/desktop default.

### Programmatic

```ts
import { createKlappayOne } from '@klappay/one'

const klappayOne = createKlappayOne({
  chargeId: 'ch_123',
  onSuccess: (result) => {
    // UX signal only — confirm fulfillment via Klappay Core's webhook,
    // never from this callback alone.
  },
  onError: (error) => console.error(error),
  onCancel: () => console.log('payer closed the checkout'),
})

klappayOne.open()
```

Defaults to an iframe/modal on desktop and a popup on mobile — pass
`mode: 'iframe' | 'popup'` to force one or the other.

### React

```tsx
import { KlappayButton } from '@klappay/one/react'

function Checkout() {
  return <KlappayButton chargeId="ch_123" variant="black" size="md" />
}
```

## Documentation

See `ONE_JS_SDK.md` and `ONE_ID.md` in the `klap-one` repository for the
full protocol and security model this package implements against.

## License

MIT
